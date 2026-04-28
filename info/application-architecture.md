# SneakerHead — Application Architecture

## Overview

SneakerHead is a **microservices e-commerce platform** for premium sneakers.
It has one React SPA frontend, three independent Python FastAPI backend services, one API gateway, and three dedicated PostgreSQL databases (one per service).

---

## Services & Ports

| Service | Technology | Internal Port | Docker Image |
|---|---|---|---|
| `frontend-service` | React 18 + Vite + Nginx | `80` | `yaswanthreddy1602/sneakerhead-frontend` |
| `nginx-gateway` (local) / `kgateway` (K8s) | Nginx / Envoy | `80` | nginx:alpine / Envoy |
| `user-service` | Python FastAPI + PostgreSQL | `8001` | `yaswanthreddy1602/sneakerhead-user-service` |
| `product-service` | Python FastAPI + PostgreSQL | `8002` | `yaswanthreddy1602/sneakerhead-product-service` |
| `order-service` | Python FastAPI + PostgreSQL | `8003` | `yaswanthreddy1602/sneakerhead-order-service` |
| `user-postgres` | PostgreSQL 16-alpine | `5432` | `postgres:16-alpine` |
| `product-postgres` | PostgreSQL 16-alpine | `5432` | `postgres:16-alpine` |
| `order-postgres` | PostgreSQL 16-alpine | `5432` | `postgres:16-alpine` |

---

## API Gateway Routing

```
Browser / Client
    │
    ▼ HTTP :80
nginx-gateway (local Docker) / kgateway Envoy (Kubernetes)
    │
    ├── GET  /                      → frontend-service:80   (React SPA)
    ├── ANY  /api/v1/users/*        → user-service:8001
    ├── ANY  /api/v1/products/*     → product-service:8002
    └── ANY  /api/v1/orders/*       → order-service:8003
```

---

## Inter-Service Communication

```
order-service  ──HTTP──►  user-service:8001     (validate user exists on order create)
order-service  ──HTTP──►  product-service:8002  (check product stock / details)
```

All services validate JWT tokens **independently** using the shared `JWT_SECRET` — no per-request call to user-service is needed for token verification.

---

## Health Check Endpoints

All services expose `GET /health` returning:
```json
{ "status": "ok", "service": "<name>", "version": "1.0.0" }
```

Used by:
- Docker Compose `healthcheck`
- Kubernetes liveness + readiness probes

---

## Local Development (Docker Compose)

```
docker-compose up --build -d

Services on host:
  :80  → nginx-gateway  (entry point)

Internal (Docker network sneakerhead-network):
  user-service:8001
  product-service:8002
  order-service:8003
  frontend-service:80
  postgres:5432  (single shared DB locally)
```

### Dependency chain (startup order):
```
postgres → user-service, product-service, order-service → frontend-service → nginx-gateway
```

---

## Eraser.io / Gamma.ai Diagram Script

Paste into [Eraser.io](https://app.eraser.io) → New Diagram → Code mode:

```
direction right

User [label: "Browser / User"]

group Gateway [label: "API Gateway", color: orange] {
  gw [label: "nginx-gateway (local)\nkgateway/Envoy (K8s)\n:80"]
}

group Frontend [label: "Frontend", color: blue] {
  fe [label: "frontend-service\nReact 18 + Vite + Nginx\n:80\nyaswanthreddy1602/sneakerhead-frontend"]
}

group Backend [label: "Backend Services", color: green] {
  us [label: "user-service\nFastAPI\n:8001\nyaswanthreddy1602/sneakerhead-user-service"]
  ps [label: "product-service\nFastAPI\n:8002\nyaswanthreddy1602/sneakerhead-product-service"]
  os [label: "order-service\nFastAPI\n:8003\nyaswanthreddy1602/sneakerhead-order-service"]
}

group Data [label: "Data Tier", color: purple] {
  udb [label: "user-postgres\nPostgreSQL 16\n:5432"]
  pdb [label: "product-postgres\nPostgreSQL 16\n:5432"]
  odb [label: "order-postgres\nPostgreSQL 16\n:5432"]
}

User > gw: "HTTP :80"
gw > fe: "GET /"
gw > us: "POST /api/v1/users/*"
gw > ps: "GET /api/v1/products/*"
gw > os: "POST /api/v1/orders/*"

os > us: "validate user (HTTP)"
os > ps: "check stock (HTTP)"

us > udb: "SQL :5432"
ps > pdb: "SQL :5432"
os > odb: "SQL :5432"
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Database-per-service** | Each service owns its schema — no cross-DB joins, independent scaling |
| **Stateless services** | All auth state in JWT — no server-side sessions, easy horizontal scaling |
| **Gateway as single entry** | No service directly exposed externally; consistent auth/routing |
| **Shared JWT_SECRET** | product-service and order-service verify tokens locally without calling user-service (except order-service's explicit user-exists check) |
| **Nginx serves SPA** | Frontend is a static build served by Nginx inside container — no Node.js runtime in prod |
| **Health at `/health`** | Same endpoint pattern across all services — Docker Compose + K8s probes use identical config |
| **Database migrations on startup** | Alembic runs on container start — zero manual DB setup needed |
