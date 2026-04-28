# SneakerHead — CI/CD Pipeline Architecture

## Overview

The CI/CD pipeline uses **GitHub Actions** with two patterns:

- **Python services** (`user-service`, `product-service`, `order-service`): thin caller `ci.yml` that delegates all logic to the **centralized reusable template** at `SneakerHead-template/.github/workflows/cicd_template.yml`
- **Frontend service**: standalone `ci.yml` with 10 jobs written directly (Node.js stack differs from Python template)

On push to `main` or `dev`, the pipeline runs end-to-end: code quality → build → security scan → Docker push → Helm values update → ArgoCD detects and deploys.

---

## Repositories Involved

| Repository | Role |
|---|---|
| `SneakerHead-template` | Central reusable template (`cicd_template.yml`) |
| `SneakerHead-user-service` | Thin caller → delegates to template |
| `SneakerHead-product-service` | Thin caller → delegates to template |
| `SneakerHead-order-service` | Thin caller → delegates to template |
| `SneakerHead-frontend` | Standalone full pipeline (Node.js, 10 jobs) |
| `SneakerHead-manifests` | GitOps manifest repo — Helm values updated by CD job |

### Caller Pattern (Python services)

Each Python service `ci.yml` is ~35 lines:
```yaml
uses: SneakerHead-org/SneakerHead-template/.github/workflows/cicd_template.yml@main
with:
  service-name:       sneakerhead-user-service
  sonar_project_key:  SneakerHead-User-Service
  helm-service-name:  user-service          # key in values-{env}.yaml
  chart-path:         helm/sneakerhead
```

---

## Branch Strategy

| Branch | Tag Format | Values File Updated | ArgoCD Sync |
|---|---|---|---|
| `main` | Semantic version (`v1.2.3`) | `values-prod.yaml` | Manual approval |
| `dev` | SHA prefix (`dev-abc1234`) | `values-dev.yaml` | Automatic + self-heal |
| PR / other | `sha-abc1234` | None (no push) | — |

---

## Pipeline Jobs — Python Services (cicd_template.yml)

```
git push / pull_request  →  main or dev
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ JOB 1: PREPARE                                          │
│  • Checkout (fetch-depth: 0)                            │
│  • Setup Python + pip cache                             │
│  • Semantic version calc (main only — dry_run)          │
│  • Resolve image tag:                                   │
│      main → v1.2.3 (semver)  push=true                 │
│      dev  → dev-abc1234      push=true                  │
│      PR   → sha-abc1234      push=false                 │
│  • pip install requirements.txt                         │
│  Outputs: tag, push                                     │
└──────────┬──────────────────────────────────────────────┘
           │
   ┌───────┼───────────────────┐
   ▼       ▼                   ▼
┌──────┐ ┌──────────────────┐ ┌──────────────────┐
│ JOB 2│ │ JOB 3            │ │ JOB 4            │
│ TEST │ │ SONAR            │ │ SNYK             │
│      │ │ needs:[prepare,  │ │ needs:[prepare]  │
│pytest│ │        test]     │ │                  │
│      │ │ SonarQube scan   │ │ snyk test        │
│cov.  │ │ + Quality Gate   │ │ → HTML report    │
│xml   │ │                  │ │ artifact 7d      │
└──┬───┘ └────────┬─────────┘ └────────┬─────────┘
   │              │                    │
   └──────────────┼────────────────────┘
                  ▼
   ┌──────────────────────────────────────┐
   │ JOB 5: BUILD                         │
   │ needs: [prepare, test, sonar, snyk]  │
   │  • docker build -f Dockerfile        │
   │  • docker save → /tmp/docker-img.tar │
   │  • upload artifact (1 day)           │
   └──────────────┬───────────────────────┘
                  ▼
   ┌──────────────────────────────────────┐
   │ JOB 6: TRIVY                         │
   │ needs: [prepare, build]              │
   │  • download image artifact           │
   │  • docker load                       │
   │  • trivy image scan                  │
   │  • exit-code: 1 on HIGH/CRITICAL     │
   └──────────────┬───────────────────────┘
                  ▼
   ┌────────────────────────────────────────────┐
   │ JOB 7: PUSH                                │
   │ needs: [prepare, trivy]                    │
   │ if: push==true && (main || dev)            │
   │  • docker login Docker Hub                 │
   │  • push :tag + :latest                     │
   │  • Create Git Tag (main only)              │
   └───────────┬────────────────────────────────┘
               │
     ┌─────────┴──────────────┐
     ▼                        ▼
┌──────────────────┐  ┌────────────────────────────────────┐
│ JOB 8:           │  │ JOB 9: UPDATE HELM (CD)            │
│ CREATE RELEASE   │  │ needs: [prepare, push]             │
│ needs:[prepare,  │  │ if: push.result == 'success'       │
│  test,sonar,     │  │                                    │
│  build,trivy,    │  │  • Resolve values file:            │
│  push]           │  │    main → values-prod.yaml         │
│ if: main &&      │  │    dev  → values-dev.yaml          │
│   push==success  │  │  • GitHub App token (cross-repo)   │
│                  │  │  • Checkout SneakerHead-manifests  │
│ softprops/       │  │  • yq update:                      │
│ action-gh-release│  │    "<service>".image.tag = "<tag>" │
│                  │  │    in helm/sneakerhead/values-*.yaml│
│                  │  │  • git commit [skip ci] + push     │
└──────────────────┘  └────────────────────┬───────────────┘
                                           │
                              ┌────────────┘
                              ▼
                    ┌─────────────────────────┐
                    │ ArgoCD                  │
                    │ (watches manifest repo) │
                    │  dev:  auto-sync        │
                    │  prod: manual sync      │
                    └─────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ JOB 10: NOTIFY                                             │
│ needs: [prepare,test,sonar,build,trivy,push,               │
│         create-release, update-helm]                       │
│ if: always() && main branch only                           │
│  • Email success → dawidd6/action-send-mail                │
│  • Email failure → same action                             │
└────────────────────────────────────────────────────────────┘
```

---

## Pipeline Jobs — Frontend (Standalone, 10 Jobs)

The frontend uses a **standalone** `ci.yml` (not the shared template) because it is Node.js:

| Job | Name | Key Steps |
|---|---|---|
| 1 | Prepare | Node.js setup, semver calc, resolve tag |
| 2 | Test | `npx vitest run --coverage`, upload coverage |
| 3 | SonarQube | Scan + Quality Gate |
| 4 | Snyk | `npx snyk test --file=package.json` |
| 5 | Build | `docker build`, save `.tar` artifact |
| 6 | Trivy | Image scan HIGH/CRITICAL |
| 7 | Push | Login + push `:tag` + `:latest`, Git tag (main only) |
| 8 | Create Release | `softprops/action-gh-release` (main only) |
| 9 | Update Helm | `yq` update `frontend.image.tag` in `values-{env}.yaml` |
| 10 | Notify | Email success/failure (main only) |

---

## GitOps Flow

```
Developer
   │ git push main / dev
   ▼
GitHub Actions (service repo)
   │  Jobs 1-8: CI — test, scan, build, push to Docker Hub
   │
   ▼ Job 9: CD
SneakerHead-manifests (GitOps repo)
   │  Checkout with GitHub App token
   │  yq: helm/sneakerhead/values-dev.yaml   → user-service.image.tag = dev-abc1234
   │  yq: helm/sneakerhead/values-prod.yaml  → user-service.image.tag = v1.2.3
   │  git commit "chore(user-service): bump dev image tag to dev-abc1234 [skip ci]"
   │  git push
   │
   ▼
ArgoCD (watches SneakerHead-manifests repo)
   │
   ├── sneakerhead-dev app: AUTO-SYNC → rolling update in sneakerhead-dev namespace
   └── sneakerhead-prod app: PENDING SYNC → manual approve → rolling update
```

---

## Secrets Required Per Service Repo

| Secret | Purpose |
|---|---|
| `SONAR_TOKEN` | SonarQube authentication |
| `SONAR_HOST_URL` | SonarQube server URL |
| `SNYK_TOKEN` | Snyk security scanning |
| `DOCKER_USERNAME` | Docker Hub push login |
| `DOCKER_PASSWORD` | Docker Hub push login |
| `SMTP_HOST` | Email notification server |
| `SMTP_PORT` | Email notification port |
| `SMTP_USERNAME` | Email notification login |
| `SMTP_PASSWORD` | Email notification login |
| `EMAIL_TO` | Notification recipient address |
| `APP_ID` | GitHub App ID for cross-repo manifest push |
| `APP_PRIVATE_KEY` | GitHub App PEM private key |
| `MANIFEST_REPO` | Manifest repo name (`SneakerHead-manifests`) |

---

## Eraser.io / Gamma.ai Diagram Script

Paste into [Eraser.io](https://app.eraser.io) → New Diagram → Code mode:

```
direction down

Developer [icon: user, color: blue]

group ServiceRepo [label: "Service Repo (GitHub)", color: gray] {
  push [label: "git push\nmain / dev", shape: oval]
}

group GHA [label: "GitHub Actions — cicd_template.yml", color: green] {
  prepare [label: "JOB 1\nPrepare\n(resolve tag)"]
  test [label: "JOB 2\nTest\n(pytest/vitest)"]
  sonar [label: "JOB 3\nSonarQube\n+ Quality Gate"]
  snyk [label: "JOB 4\nSnyk\nSecurity"]
  build [label: "JOB 5\nDocker Build\n(→ .tar artifact)"]
  trivy [label: "JOB 6\nTrivy\nImage Scan"]
  docker_push [label: "JOB 7\nDocker Push\n:tag + :latest"]
  release [label: "JOB 8\nCreate Release\n(main only)"]
  helm_update [label: "JOB 9\nUpdate Helm\n(yq + git push)"]
  notify [label: "JOB 10\nNotify\n(email)"]
}

DockerHub [icon: docker, label: "Docker Hub\nyaswanthreddy1602/*"]

group ManifestRepo [label: "SneakerHead-manifests (GitOps)", color: orange] {
  values_dev [label: "values-dev.yaml\nimage.tag = dev-SHA"]
  values_prod [label: "values-prod.yaml\nimage.tag = v1.2.3"]
}

group ArgoCD [label: "ArgoCD", color: red] {
  dev_sync [label: "sneakerhead-dev\nauto-sync"]
  prod_sync [label: "sneakerhead-prod\nmanual sync"]
}

Developer > push
push > prepare
prepare > test
prepare > snyk
test > sonar
sonar > build
snyk > build
build > trivy
trivy > docker_push
docker_push > release: "main only"
docker_push > helm_update: "push==success"
helm_update > values_dev: "dev branch"
helm_update > values_prod: "main branch"
docker_push > DockerHub: ":tag + :latest"
values_dev > dev_sync: "auto-detect"
values_prod > prod_sync: "auto-detect"
helm_update > notify
```

---

## Key Design Decisions

- **Single template, multiple callers** — user/product/order service `ci.yml` files are ~35 lines; all logic lives in the template
- **Image tag flows PREPARE → PUSH → UPDATE-HELM** — no re-derivation; the exact tested tag is deployed
- **GitHub App token** — scoped cross-repo push; more secure than PAT tokens
- **`[skip ci]`** in commit message — prevents infinite loop when manifest repo is updated
- **Artifact-based image handoff** — image built once in JOB 5, saved as `.tar`, reused by Trivy (JOB 6) and Push (JOB 7); no rebuild
- **Snyk on `requirements.txt`** (Python) or `package.json` (Node.js) — separate from Trivy which scans the built image
