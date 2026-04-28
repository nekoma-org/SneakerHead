# SneakerHead — Premium Sneaker Shopping Platform

A production-ready microservices ecommerce application for browsing, filtering,
and purchasing authentic sneakers from top brands.

## Architecture

| Service            | Tech Stack                              | Port |
|--------------------|----------------------------------------|------|
| frontend-service   | React 18 + Vite + TailwindCSS + Nginx | 80   |
| user-service       | Python FastAPI + PostgreSQL            | 8001 |
| product-service    | Python FastAPI + PostgreSQL            | 8002 |
| order-service      | Python FastAPI + PostgreSQL            | 8003 |
| nginx-gateway      | Nginx (API Gateway)                    | 80   |
| postgres           | PostgreSQL 16                          | 5432 |

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Ports 80 available on host

### Run

```bash
# Clone and enter directory
cd sneakerhead

# Start all services
docker-compose up --build -d

# Seed products (run once after first boot)
docker exec -it sneakerhead-product-service python -m app.seed

# Visit http://localhost
```

### Stop

```bash
docker-compose down
```

### Full reset (including data)

```bash
docker-compose down -v
```

## Environment Variables

All configuration is in `.env` at the project root. Key variables:

| Variable                     | Description                       |
|------------------------------|-----------------------------------|
| `POSTGRES_USER`              | PostgreSQL username               |
| `POSTGRES_PASSWORD`          | PostgreSQL password               |
| `USER_DATABASE_URL`          | User service DB connection        |
| `PRODUCT_DATABASE_URL`       | Product service DB connection     |
| `ORDER_DATABASE_URL`         | Order service DB connection       |
| `JWT_SECRET`                 | JWT signing secret                |
| `JWT_ALGORITHM`              | JWT algorithm (HS256)             |
| `VITE_API_URL`               | Frontend API base URL             |
| `GATEWAY_PORT`               | Nginx gateway host port           |
| `LOG_LEVEL`                  | Logging level (info/debug/warning)|

## API Documentation

Each backend service exposes Swagger docs:
- User Service:    `http://user-service:8001/docs`
- Product Service: `http://product-service:8002/docs`
- Order Service:   `http://order-service:8003/docs`

(Accessible from within the Docker network or via port-forward)

## Health Checks

All services expose `GET /health`:
```json
{ "status": "ok", "service": "<name>", "version": "1.0.0" }
```

## JWT Authentication

SneakerHead uses **JSON Web Tokens (JWT)** for stateless authentication across all backend services.
Tokens are issued exclusively by `user-service` and validated independently by `product-service`
and `order-service` using the shared `JWT_SECRET` — no inter-service call needed per request.

### Token Types

| Token | Expiry (default) | Purpose |
|---|---|---|
| **Access Token** | 30 minutes | Authenticate API requests (`type: access`) |
| **Refresh Token** | 7 days | Obtain new access token without re-login (`type: refresh`) |

### JWT Payload (Claims)

```json
{
  "sub":      "550e8400-e29b-41d4-a716-446655440000",
  "email":    "user@example.com",
  "is_admin": false,
  "exp":      1714300800,
  "type":     "access"
}
```

### Authentication Flow

```
1. POST /api/v1/users/login  → user-service verifies bcrypt password
2. user-service returns:     access_token (30 min) + refresh_token (7 days)
3. Client sends header:      Authorization: Bearer <access_token>
4. Any service decodes JWT:  verifies HS256 signature, checks exp + type == access
5. user-service additionally: confirms user is still active in DB
6. Request proceeds or 401  Unauthorized returned
```

### Refresh Flow

```
POST /api/v1/users/refresh
  Body: { "refresh_token": "<token>" }
  → Returns new access_token (refresh_token unchanged until expiry)
```

### Security Notes

- **Algorithm**: `HS256` — symmetric HMAC-SHA256, shared secret across services
- **Password hashing**: `bcrypt` via `passlib` — salted, adaptive cost factor
- **Token type guard**: `type` claim prevents refresh tokens being used as access tokens
- **Admin guard**: `is_admin` claim checked server-side; never trusted from client input
- **Kubernetes**: `JWT_SECRET` injected as a K8s Secret — never hardcoded in images

---

## Kubernetes Readiness

This application is designed for zero-change Kubernetes deployment:
- All config via environment variables
- Service discovery by name (same in Docker Compose and K8s)
- Stateless services with JWT auth
- Non-root container users
- Database migrations on startup
- Health check endpoints for liveness/readiness probes

## Project Structure

```
sneakerhead/
├── frontend-service/    # React SPA served via Nginx
├── product-service/     # Product catalog API
├── order-service/       # Cart & order management API
├── user-service/        # Auth & user management API
├── nginx-gateway/       # API Gateway configuration
├── init-db/             # Database initialization script
├── docker-compose.yml   # Orchestration
├── .env                 # Environment configuration
└── README.md
```

## License

MIT
