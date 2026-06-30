# axum-shop

A REST API for an e-commerce backend built with **Rust** (Axum, Tower, SQLx) and designed to pair with a **Next.js** frontend.

## Features

- **Authentication** — register, login, logout, and current-user profile via JWT (HTTP-only cookie or `Authorization: Bearer` header)
- **Categories** — public read; admin-only create, update, and delete
- **Products** — paginated catalog with search and filters; admin-only create, update, delete, and image upload
- **OpenAPI / Swagger** — interactive API docs at [`/swagger-ui`](http://127.0.0.1:8080/swagger-ui)
- **Static uploads** — product images served from `/uploads`

## Tech stack

| Layer | Tools |
|-------|-------|
| Web framework | [Axum](https://github.com/tokio-rs/axum) 0.8, Tower, Tower-HTTP |
| Database | PostgreSQL 18, [SQLx](https://github.com/launchbadge/sqlx) |
| Auth | Argon2 password hashing, JWT (`jsonwebtoken`) |
| API docs | [utoipa](https://github.com/juhaku/utoipa) + Swagger UI |
| Runtime | Tokio |

## Prerequisites

- [Rust](https://rustup.rs/) (edition 2024)
- [Docker](https://www.docker.com/) and Docker Compose (for PostgreSQL and Redis)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) for migrations

```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
```

## Quick start

### 1. Clone and configure

```bash
git clone <repository-url>
cd axum-shop
cp .env.example .env
```

Edit `.env` if you need different credentials or ports.

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts **PostgreSQL** (port `5432`) and **Redis** (port `6379`). Redis is included for future use; the API currently uses PostgreSQL only.

### 3. Run database migrations

```bash
cd server
export $(grep -v '^#' ../.env | xargs)
sqlx migrate run
```

### 4. Start the API server

```bash
cd server
cargo run
```

The server listens on `http://127.0.0.1:8080` by default.

### 5. Start the frontend

```bash
cd client
cp .env.local.example .env.local
pnpm install
pnpm dev
```

The storefront runs at `http://localhost:3000`.

### 6. Explore the API

| Resource | URL |
|----------|-----|
| Swagger UI | http://127.0.0.1:8080/swagger-ui |
| OpenAPI JSON | http://127.0.0.1:8080/api-docs/openapi.json |
| Uploaded files | http://127.0.0.1:8080/uploads/ |

You can also import [`axum-shop.postman_collection.json`](./axum-shop.postman_collection.json) into Postman. Set `base_url` to `http://127.0.0.1:8080/api`.

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/db_name` |
| `JWT_SECRET` | Secret used to sign JWTs | `jwt_secret` |
| `JWT_EXPIRED_IN` | Token lifetime (e.g. `60m`, `1h`) | `60m` |
| `HOST` | Bind address | `127.0.0.1` |
| `PORT` | Bind port | `8080` |
| `POSTGRES_USER` | Docker Compose Postgres user | — |
| `POSTGRES_PASSWORD` | Docker Compose Postgres password | — |
| `POSTGRES_DB` | Docker Compose database name | — |
| `SQLX_OFFLINE` | Skip live DB during `cargo build` when `true` | unset |
| `NEXT_PUBLIC_API_URL` | Backend URL for the Next.js client | `http://127.0.0.1:8080` |

> **Compile-time SQL checking:** SQLx validates queries against the database at build time. Either keep Postgres running with `DATABASE_URL` set, or run `cargo sqlx prepare` and commit the `.sqlx/` cache, then set `SQLX_OFFLINE=true`.

## API overview

All routes are prefixed with `/api`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Create a new account |
| `POST` | `/auth/login` | — | Sign in; sets `token` HTTP-only cookie |
| `GET` | `/auth/logout` | ✓ | Clear session cookie |
| `GET` | `/auth/me` | ✓ | Current user profile |

### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/categories` | — | List all categories |
| `GET` | `/categories/{id}` | — | Get one category |
| `POST` | `/categories` | Admin | Create category |
| `PUT` | `/categories/{id}` | Admin | Update category |
| `DELETE` | `/categories/{id}` | Admin | Delete category |

### Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products` | — | Paginated list (`query`, `category_id`, `min_price`, `max_price`, `page`, `pageSize`) |
| `GET` | `/products/{id}` | — | Get one product |
| `POST` | `/products` | Admin | Create product |
| `PUT` | `/products/{id}` | Admin | Update product |
| `DELETE` | `/products/{id}` | Admin | Delete product |
| `POST` | `/products/upload` | Admin | Upload image (`multipart/form-data`) |

### Authentication

Protected routes accept either:

1. **Cookie** — `token` set automatically after `POST /api/auth/login`
2. **Bearer header** — `Authorization: Bearer <jwt>`

In Swagger UI, click **Authorize** and use the `bearer_auth` scheme with your JWT, or rely on the cookie after logging in from the same browser session.

Admin-only routes require a user with role `admin` in the database.

To promote a user to admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Frontend

The Next.js client lives in [`client/`](client/) and uses **pnpm**.

| Route | Description |
|-------|-------------|
| `/` | Product catalog with search, filters, pagination |
| `/products/{id}` | Product detail page |
| `/login`, `/register` | Authentication |
| `/account` | User profile |
| `/admin/products` | Admin product management |
| `/admin/categories` | Admin category management |

Auth uses HTTP-only cookies set by the backend. All API calls from the browser use `credentials: "include"` against `NEXT_PUBLIC_API_URL`.

```bash
cd client
cp .env.local.example .env.local
pnpm install
pnpm dev    # http://localhost:3000
pnpm build  # production build
```

## Project structure

```
axum-shop/
├── docker-compose.yml          # PostgreSQL + Redis
├── axum-shop.postman_collection.json
├── .env.example
├── client/                     # Next.js frontend (pnpm)
│   ├── app/                    # App Router pages
│   ├── components/
│   ├── contexts/
│   └── lib/                    # API client & types
└── server/
    ├── Cargo.toml
    ├── Makefile
    ├── migrations/             # SQLx migrations
    └── src/
        ├── main.rs             # Entry point, CORS, middleware
        ├── routes.rs           # Route definitions + Swagger UI
        ├── openapi.rs          # OpenAPI spec
        ├── handlers/           # Request handlers
        ├── models/             # DTOs and DB types
        ├── jwt_auth.rs         # Auth middleware
        ├── config.rs
        ├── error.rs
        └── state.rs
```

## Development

From the `server/` directory:

```bash
# Run with auto-reload (requires cargo-watch)
make start-server

# Apply migrations
make migrate-up

# Revert last migration
make migrate-down
```

Enable debug logging:

```bash
RUST_LOG=server=debug,tower_http=debug cargo run
```

CORS is configured for `http://localhost:3000` (Next.js dev server).

## Error responses

Errors return JSON in this shape:

```json
{
  "status": 404,
  "error": "Category not found"
}
```
