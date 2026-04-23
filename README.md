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
