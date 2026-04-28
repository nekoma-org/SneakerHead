# SneakerHead — Kubernetes Architecture

## Overview

SneakerHead runs on Kubernetes with a **Helm umbrella chart** managed by **ArgoCD** using the **App-of-Apps** pattern. The root app watches the `argocd/` directory recursively in the `SneakerHead-manifests` repo and creates all child Applications automatically in three sync waves.

---

## Cluster Namespaces

| Namespace | Purpose | Managed By |
|---|---|---|
| `argocd` | ArgoCD control plane | Manual install |
| `sneakerhead-dev` | Dev environment | ArgoCD auto-sync |
| `sneakerhead-prod` | Prod environment | ArgoCD manual sync |
| `monitoring` | Prometheus + Grafana | Separate ArgoCD app |
| `kgateway-system` | Envoy Gateway controller | Separate ArgoCD app |

---

## Workloads — sneakerhead-dev / sneakerhead-prod

| Workload | Kind | Replicas (dev) | Port | Docker Image |
|---|---|---|---|---|
| `frontend-service` | Deployment | 2 | 80 | `yaswanthreddy1602/sneakerhead-frontend` |
| `user-service` | Deployment | 2 | 8001 | `yaswanthreddy1602/sneakerhead-user-service` |
| `product-service` | Deployment | 2 | 8002 | `yaswanthreddy1602/sneakerhead-product-service` |
| `order-service` | Deployment | 2 | 8003 | `yaswanthreddy1602/sneakerhead-order-service` |
| `user-postgres` | StatefulSet | 1 | 5432 | `postgres:16-alpine` |
| `product-postgres` | StatefulSet | 1 | 5432 | `postgres:16-alpine` |
| `order-postgres` | StatefulSet | 1 | 5432 | `postgres:16-alpine` |
| `sneakerhead-gateway` | Gateway (kgateway/Envoy) | — | 80 | Envoy proxy |

### HPA (Horizontal Pod Autoscaler)
| Service | Min | Max | CPU Target | Memory Target |
|---|---|---|---|---|
| `frontend-service` | 2 | 4 | 60% | 70% |

---

## Helm Umbrella Chart Structure

```
SneakerHead-manifests/
└── helm/
    └── sneakerhead/                  ← Parent chart
        ├── Chart.yaml
        ├── values-dev.yaml           ← Dev image tags + config
        ├── values-prod.yaml          ← Prod image tags + config
        └── charts/
            ├── frontend/             ← Deployment + Service + ConfigMap + HPA
            ├── gateway/              ← Gateway + HTTPRoutes (kgateway/Envoy)
            ├── user-service/         ← Deployment + Service + ConfigMap + Secret
            ├── product-service/      ← Deployment + Service + ConfigMap + Secret
            ├── order-service/        ← Deployment + Service + ConfigMap + Secret
            ├── user-postgres/        ← StatefulSet + Service + ConfigMap + Secret + PVC
            ├── product-postgres/     ← StatefulSet + Service + ConfigMap + Secret + PVC
            ├── order-postgres/       ← StatefulSet + Service + ConfigMap + Secret + PVC
            ├── network-policies/     ← All NetworkPolicy resources
            └── rbac/                 ← Role + RoleBinding
```

---

## ArgoCD App-of-Apps Structure

```
sneakerhead-root   (Application — watches argocd/ dir, recurse: true)
  syncPolicy: automated (selfHeal: true, prune: true)
  source: SneakerHead-manifests → path: argocd/
  │
  ├── AppProjects (sneakerhead-infra, sneakerhead-data, sneakerhead-apps)
  │
  ├── WAVE 0 — Infrastructure (network policies + RBAC)
  │   ├── sneakerhead-network-policies-dev   (infra/network-policies-dev.yaml)
  │   ├── sneakerhead-network-policies-prod  (infra/network-policies-prod.yaml)
  │   ├── sneakerhead-rbac-dev               (infra/rbac-dev.yaml)
  │   └── sneakerhead-rbac-prod              (infra/rbac-prod.yaml)
  │
  ├── WAVE 1 — Databases (PostgreSQL StatefulSets — always manual sync)
  │   ├── sneakerhead-user-postgres-dev      (databases/user-postgres-dev.yaml)
  │   ├── sneakerhead-product-postgres-dev   (databases/product-postgres-dev.yaml)
  │   ├── sneakerhead-order-postgres-dev     (databases/order-postgres-dev.yaml)
  │   ├── sneakerhead-user-postgres-prod     (databases/user-postgres-prod.yaml)
  │   ├── sneakerhead-product-postgres-prod  (databases/product-postgres-prod.yaml)
  │   └── sneakerhead-order-postgres-prod    (databases/order-postgres-prod.yaml)
  │
  └── WAVE 2 — Microservices (via ApplicationSet)
      ApplicationSet: sneakerhead-microservices
      Generator: list  →  5 services × 2 envs = 10 Applications
      │
      ├── DEV (autoSync: true)
      │   ├── sneakerhead-frontend-dev
      │   ├── sneakerhead-gateway-dev
      │   ├── sneakerhead-user-service-dev
      │   ├── sneakerhead-product-service-dev
      │   └── sneakerhead-order-service-dev
      │
      └── PROD (autoSync: false — manual approval)
          ├── sneakerhead-frontend-prod
          ├── sneakerhead-gateway-prod
          ├── sneakerhead-user-service-prod
          ├── sneakerhead-product-service-prod
          └── sneakerhead-order-service-prod
```

---

## AppProjects & Resource Whitelists

| AppProject | Manages | Key Allowed Resources |
|---|---|---|
| `sneakerhead-infra` | Network policies, RBAC | NetworkPolicy, Role, RoleBinding, ServiceAccount |
| `sneakerhead-data` | PostgreSQL databases | StatefulSet, Service, ConfigMap, Secret, PVC, Pod |
| `sneakerhead-apps` | Microservices + gateway | Deployment, Service, ConfigMap, Secret, HPA, Ingress, Gateway, HTTPRoute, Pod, ServiceAccount |

---

## Network Policies (All Environments)

```
default-deny-all
  → blocks ALL traffic by default

gateway-netpol   (podSelector: app.kubernetes.io/name: sneakerhead-gateway)
  ingress: port 80 from anywhere (external)
  egress:  → frontend:80
            → tier:backend 8001,8002,8003
            → kgateway-system:9977 (xDS config)
            → 0.0.0.0/0:443,6443 (K8s API)
            → DNS:53

frontend-netpol  (podSelector: tier: frontend)
  ingress: from gateway:80
  egress:  → DNS:53

backend-netpol   (podSelector: tier: backend)
  ingress: from gateway:8001,8002,8003
           from tier:backend:8001,8002,8003  (inter-service)
           from monitoring NS:8001,8002,8003 (Prometheus scraping)
  egress:  → tier:data:5432
            → tier:backend:8001,8002,8003
            → DNS:53

data-netpol      (podSelector: tier: data)
  ingress: from tier:backend:5432
  egress:  → DNS:53
```

---

## Persistent Storage

| PVC | StorageClass | Capacity (dev) | Capacity (prod) |
|---|---|---|---|
| `user-postgres-data` | `nfs-client` | 1Gi | 5Gi |
| `product-postgres-data` | `nfs-client` | 2Gi | 10Gi |
| `order-postgres-data` | `nfs-client` | 1Gi | 5Gi |

---

## Eraser.io / Gamma.ai Diagram Script

Paste into [Eraser.io](https://app.eraser.io) → New Diagram → Code mode:

```
direction right

Internet [icon: globe]

group ArgoCD_ns [label: "argocd namespace"] {
  root_app [label: "sneakerhead-root\n(App of Apps)\nwatches: argocd/ recurse:true"]
  appset [label: "ApplicationSet\nsneakerhead-microservices\n5 services x 2 envs"]
}

group ManifestRepo [label: "SneakerHead-manifests (Git)", color: gray] {
  helm_values [label: "helm/sneakerhead/\nvalues-dev.yaml\nvalues-prod.yaml"]
}

group Dev [label: "sneakerhead-dev namespace", color: blue] {
  gw_dev [label: "kgateway\nEnvoy :80"]

  group fe_tier [label: "Frontend"] {
    fe [label: "frontend\nDeployment x2\n:80"]
    fe_hpa [label: "HPA min2/max4"]
  }

  group be_tier [label: "Backend"] {
    us [label: "user-service\nx2 :8001"]
    ps [label: "product-service\nx2 :8002"]
    os [label: "order-service\nx2 :8003"]
  }

  group db_tier [label: "Data"] {
    upg [label: "user-postgres\nStatefulSet :5432\nPVC 1Gi"]
    ppg [label: "product-postgres\nStatefulSet :5432\nPVC 2Gi"]
    opg [label: "order-postgres\nStatefulSet :5432\nPVC 1Gi"]
  }
}

group Monitoring [label: "monitoring namespace", color: yellow] {
  prom [label: "Prometheus"]
  graf [label: "Grafana"]
}

Internet > gw_dev: "HTTP :80"
gw_dev > fe: ":80"
gw_dev > us: ":8001"
gw_dev > ps: ":8002"
gw_dev > os: ":8003"
os > us: "validate user"
os > ps: "check stock"
us > upg: "SQL :5432"
ps > ppg: "SQL :5432"
os > opg: "SQL :5432"
prom > us: "scrape :8001"
prom > ps: "scrape :8002"
prom > os: "scrape :8003"

ManifestRepo > root_app: "ArgoCD watches"
root_app > appset: "creates"
appset > Dev: "wave 2 — auto-sync"
```
