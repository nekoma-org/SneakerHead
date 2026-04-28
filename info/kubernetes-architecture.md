# SneakerHead â€” Kubernetes Architecture

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

## Workloads â€” sneakerhead-dev / sneakerhead-prod

| Workload | Kind | Replicas (dev) | Port | Docker Image |
|---|---|---|---|---|
| `frontend-service` | Deployment | 2 | 80 | `yaswanthreddy1602/sneakerhead-frontend` |
| `user-service` | Deployment | 2 | 8001 | `yaswanthreddy1602/sneakerhead-user-service` |
| `product-service` | Deployment | 2 | 8002 | `yaswanthreddy1602/sneakerhead-product-service` |
| `order-service` | Deployment | 2 | 8003 | `yaswanthreddy1602/sneakerhead-order-service` |
| `user-postgres` | StatefulSet | 1 | 5432 | `postgres:16-alpine` |
| `product-postgres` | StatefulSet | 1 | 5432 | `postgres:16-alpine` |
| `order-postgres` | StatefulSet | 1 | 5432 | `postgres:16-alpine` |
| `sneakerhead-gateway` | Gateway (kgateway/Envoy) | â€” | 80 | Envoy proxy |

### HPA (Horizontal Pod Autoscaler)
| Service | Min | Max | CPU Target | Memory Target |
|---|---|---|---|---|
| `frontend-service` | 2 | 4 | 60% | 70% |

---

## Helm Umbrella Chart Structure

```
SneakerHead-manifests/
â””â”€â”€ helm/
    â””â”€â”€ sneakerhead/                  â† Parent chart
        â”œâ”€â”€ Chart.yaml
        â”œâ”€â”€ values-dev.yaml           â† Dev image tags + config
        â”œâ”€â”€ values-prod.yaml          â† Prod image tags + config
        â””â”€â”€ charts/
            â”œâ”€â”€ frontend/             â† Deployment + Service + ConfigMap + HPA
            â”œâ”€â”€ gateway/              â† Gateway + HTTPRoutes (kgateway/Envoy)
            â”œâ”€â”€ user-service/         â† Deployment + Service + ConfigMap + Secret
            â”œâ”€â”€ product-service/      â† Deployment + Service + ConfigMap + Secret
            â”œâ”€â”€ order-service/        â† Deployment + Service + ConfigMap + Secret
            â”œâ”€â”€ user-postgres/        â† StatefulSet + Service + ConfigMap + Secret + PVC
            â”œâ”€â”€ product-postgres/     â† StatefulSet + Service + ConfigMap + Secret + PVC
            â”œâ”€â”€ order-postgres/       â† StatefulSet + Service + ConfigMap + Secret + PVC
            â”œâ”€â”€ network-policies/     â† All NetworkPolicy resources
            â””â”€â”€ rbac/                 â† Role + RoleBinding
```

---

## ArgoCD App-of-Apps Structure

```
sneakerhead-root   (Application â€” watches argocd/ dir, recurse: true)
  syncPolicy: automated (selfHeal: true, prune: true)
  source: SneakerHead-manifests â†’ path: argocd/
  â”‚
  â”œâ”€â”€ AppProjects (sneakerhead-infra, sneakerhead-data, sneakerhead-apps)
  â”‚
  â”œâ”€â”€ WAVE 0 â€” Infrastructure (network policies + RBAC)
  â”‚   â”œâ”€â”€ sneakerhead-network-policies-dev   (infra/network-policies-dev.yaml)
  â”‚   â”œâ”€â”€ sneakerhead-network-policies-prod  (infra/network-policies-prod.yaml)
  â”‚   â”œâ”€â”€ sneakerhead-rbac-dev               (infra/rbac-dev.yaml)
  â”‚   â””â”€â”€ sneakerhead-rbac-prod              (infra/rbac-prod.yaml)
  â”‚
  â”œâ”€â”€ WAVE 1 â€” Databases (PostgreSQL StatefulSets â€” always manual sync)
  â”‚   â”œâ”€â”€ sneakerhead-user-postgres-dev      (databases/user-postgres-dev.yaml)
  â”‚   â”œâ”€â”€ sneakerhead-product-postgres-dev   (databases/product-postgres-dev.yaml)
  â”‚   â”œâ”€â”€ sneakerhead-order-postgres-dev     (databases/order-postgres-dev.yaml)
  â”‚   â”œâ”€â”€ sneakerhead-user-postgres-prod     (databases/user-postgres-prod.yaml)
  â”‚   â”œâ”€â”€ sneakerhead-product-postgres-prod  (databases/product-postgres-prod.yaml)
  â”‚   â””â”€â”€ sneakerhead-order-postgres-prod    (databases/order-postgres-prod.yaml)
  â”‚
  â””â”€â”€ WAVE 2 â€” Microservices (via ApplicationSet)
      ApplicationSet: sneakerhead-microservices
      Generator: list  â†’  5 services Ã— 2 envs = 10 Applications
      â”‚
      â”œâ”€â”€ DEV (autoSync: true)
      â”‚   â”œâ”€â”€ sneakerhead-frontend-dev
      â”‚   â”œâ”€â”€ sneakerhead-gateway-dev
      â”‚   â”œâ”€â”€ sneakerhead-user-service-dev
      â”‚   â”œâ”€â”€ sneakerhead-product-service-dev
      â”‚   â””â”€â”€ sneakerhead-order-service-dev
      â”‚
      â””â”€â”€ PROD (autoSync: false â€” manual approval)
          â”œâ”€â”€ sneakerhead-frontend-prod
          â”œâ”€â”€ sneakerhead-gateway-prod
          â”œâ”€â”€ sneakerhead-user-service-prod
          â”œâ”€â”€ sneakerhead-product-service-prod
          â””â”€â”€ sneakerhead-order-service-prod
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
  â†’ blocks ALL traffic by default

gateway-netpol   (podSelector: app.kubernetes.io/name: sneakerhead-gateway)
  ingress: port 80 from anywhere (external)
  egress:  â†’ frontend:80
            â†’ tier:backend 8001,8002,8003
            â†’ kgateway-system:9977 (xDS config)
            â†’ 0.0.0.0/0:443,6443 (K8s API)
            â†’ DNS:53

frontend-netpol  (podSelector: tier: frontend)
  ingress: from gateway:80
  egress:  â†’ DNS:53

backend-netpol   (podSelector: tier: backend)
  ingress: from gateway:8001,8002,8003
           from tier:backend:8001,8002,8003  (inter-service)
           from monitoring NS:8001,8002,8003 (Prometheus scraping)
  egress:  â†’ tier:data:5432
            â†’ tier:backend:8001,8002,8003
            â†’ DNS:53

data-netpol      (podSelector: tier: data)
  ingress: from tier:backend:5432
  egress:  â†’ DNS:53
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

Paste into [Eraser.io](https://app.eraser.io) â†’ New Diagram â†’ Code mode:

```
direction right

Internet [icon: globe]

haproxy [label: "HAProxy\nExternal Load Balancer", icon: load-balancer, color: red]

group ArgoCD_ns [label: "argocd namespace", color: purple] {
  root_app [label: "sneakerhead-root\n(App of Apps)\nautomated + selfHeal + prune\nwatches: argocd/ recurse:true"]
  wave0 [label: "Wave 0 - Infra\nNetworkPolicies + RBAC\nAppProjects"]
  wave1 [label: "Wave 1 - Databases\n6x PostgreSQL StatefulSets\nmanual sync"]
  appset [label: "Wave 2 - ApplicationSet\nsneakerhead-microservices\n5 services x 2 envs = 10 Apps"]
}

group ManifestRepo [label: "SneakerHead-manifests (GitHub)", color: gray] {
  helm_vals [label: "helm/sneakerhead/\nvalues-dev.yaml\nvalues-prod.yaml"]
  argocd_dir [label: "argocd/\ninfra/ databases/ apps/ appprojects/"]
}

group kgateway_ns [label: "kgateway-system namespace", color: orange] {
  kgw_ctrl [label: "kgateway Controller\nGatewayClass: kgateway\nxDS port :9977"]
}

group Dev [label: "sneakerhead-dev namespace - auto-sync", color: blue] {
  gw_dev [label: "kgateway\nsneakerhead-gateway\nNodePort :31803\nHTTPRoute rules"]

  group fe_dev [label: "Frontend Tier"] {
    fe_d [label: "frontend-service\nDeployment x2 :80\nHPA min2/max10"]
  }

  group be_dev_ns [label: "Backend Tier"] {
    us_d [label: "user-service x1\n:8001 /api/v1/auth /users"]
    ps_d [label: "product-service x1\n:8002 /api/v1/products"]
    os_d [label: "order-service x1\n:8003 /api/v1/cart /orders"]
  }

  group db_dev [label: "Data Tier"] {
    upg_d [label: "user-postgres\nStatefulSet PVC 4Gi\nDB: userdb"]
    ppg_d [label: "product-postgres\nStatefulSet PVC 4Gi\nDB: productdb"]
    opg_d [label: "order-postgres\nStatefulSet PVC 4Gi\nDB: orderdb"]
  }
}

group Prod [label: "sneakerhead-prod namespace - MANUAL sync", color: green] {
  gw_prod [label: "kgateway\nsneakerhead-gateway\nNodePort :32686\nHTTPRoute rules"]

  group fe_prod [label: "Frontend Tier"] {
    fe_p [label: "frontend-service\nDeployment x2 :80\nHPA min2/max10\nCPU 60% Mem 70%"]
  }

  group be_prod_ns [label: "Backend Tier"] {
    us_p [label: "user-service x2\n:8001 /api/v1/auth /users"]
    ps_p [label: "product-service x2\n:8002 /api/v1/products"]
    os_p [label: "order-service x2\n:8003 /api/v1/cart /orders"]
  }

  group db_prod [label: "Data Tier"] {
    upg_p [label: "user-postgres\nStatefulSet PVC 4Gi\nDB: userdb"]
    ppg_p [label: "product-postgres\nStatefulSet PVC 4Gi\nDB: productdb"]
    opg_p [label: "order-postgres\nStatefulSet PVC 4Gi\nDB: orderdb"]
  }
}

group Monitoring [label: "monitoring namespace", color: yellow] {
  prom [label: "Prometheus\nNodePort :32507"]
  graf [label: "Grafana\nNodePort :31633"]
}

nfs [label: "NFS Server\nnfs-client StorageClass\ndynamic provisioning", icon: database]

// Traffic routing
Internet > haproxy: "HTTPS"
haproxy > gw_dev: "dev.sneakerhead.rest"
haproxy > gw_prod: "sneakerhead.rest"
haproxy > root_app: "argocd.sneakerhead.rest"
haproxy > graf: "grafana.sneakerhead.rest"
haproxy > prom: "prometheus.sneakerhead.rest"

// kgateway controller programs both gateways
kgw_ctrl > gw_dev: "xDS :9977"
kgw_ctrl > gw_prod: "xDS :9977"

// Dev namespace routing
gw_dev > fe_d: "/ :80"
gw_dev > us_d: "/api/v1/auth /users :8001"
gw_dev > ps_d: "/api/v1/products :8002"
gw_dev > os_d: "/api/v1/cart /orders :8003"
os_d > us_d: "validate user"
os_d > ps_d: "check stock"
us_d > upg_d: "SQL :5432"
ps_d > ppg_d: "SQL :5432"
os_d > opg_d: "SQL :5432"

// Prod namespace routing
gw_prod > fe_p: "/ :80"
gw_prod > us_p: "/api/v1/auth /users :8001"
gw_prod > ps_p: "/api/v1/products :8002"
gw_prod > os_p: "/api/v1/cart /orders :8003"
os_p > us_p: "validate user"
os_p > ps_p: "check stock"
us_p > upg_p: "SQL :5432"
ps_p > ppg_p: "SQL :5432"
os_p > opg_p: "SQL :5432"

// Prometheus scraping (both envs)
prom > us_d: "scrape :8001"
prom > ps_d: "scrape :8002"
prom > os_d: "scrape :8003"
prom > us_p: "scrape :8001"
prom > ps_p: "scrape :8002"
prom > os_p: "scrape :8003"
prom > graf: "metrics"

// NFS persistent storage
upg_d > nfs: "PVC 4Gi"
ppg_d > nfs: "PVC 4Gi"
opg_d > nfs: "PVC 4Gi"
upg_p > nfs: "PVC 4Gi"
ppg_p > nfs: "PVC 4Gi"
opg_p > nfs: "PVC 4Gi"

// GitOps ArgoCD flow
argocd_dir > root_app: "ArgoCD watches (auto)"
helm_vals > appset: "Helm values source"
root_app > wave0: "sync-wave: 0"
wave0 > wave1: "sync-wave: 1"
wave1 > appset: "sync-wave: 2"
appset > Dev: "5 apps - autoSync + selfHeal + prune"
appset > Prod: "5 apps - MANUAL sync only"
```