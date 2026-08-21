# E-commerce

A full-stack storefront with catalog, cart, checkout, orders, and an admin area. Identity is handled by Keycloak, so the same login backs both the customer storefront and the admin surface. Payment runs through a mock gateway behind a clean interface so a real provider can drop in.

## Features

- Catalog with categories, filtering, search, and pagination
- Persistent per-user cart with server-side stock checks
- Checkout with address capture, server-computed totals, and a mock payment gateway
- Orders with a guarded status lifecycle
- Admin product management and order status board, gated by realm role
- Keycloak authentication with customer and admin roles

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Remix, TypeScript, Tailwind CSS |
| Backend | Laravel, REST API |
| Database | MySQL |
| Identity | Keycloak (OpenID Connect) |
| Tests | PHPUnit on the backend, Vitest on the frontend |

## Architecture

The project is split into `fe` and `be`, each using a feature-based layout.

```
be/app/Features    Auth, Catalog, Cart, Checkout, Orders, Admin
fe/app             lib (auth, api, oidc, money), routes, features, components
```

MySQL is the source of truth. The Laravel API validates Keycloak access tokens against the realm JWKS and maps realm roles to permissions. The Remix app runs the OpenID Connect code flow, keeps tokens in an httpOnly cookie session, and proxies API calls server side with the bearer token. Checkout calls a `PaymentGateway` interface; the shipped `MockGateway` always approves. See `PLAN/architecture.md` for the data model and order lifecycle.

## Running with Docker

Requires Docker and Docker Compose.

```
cp .env.example .env
docker compose up --build
```

- Storefront: http://localhost:3000
- API: http://localhost:8000/api
- Keycloak: http://localhost:8080 (admin / admin)
- MySQL: localhost:3306

The realm `shop` imports on startup with two users, both with password `password`:

- `shopadmin` has the admin and customer roles
- `shopper` has the customer role

## Local development

Backend:

```
cd be
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Frontend:

```
cd fe
cp .env.example .env
npm install
npm run dev
```

## Tests

```
cd be && php artisan test
cd fe && npm test
```

## API summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | public | Health check |
| GET | /api/categories | public | List categories |
| GET | /api/products | public | List active products, filter and paginate |
| GET | /api/products/{slug} | public | Product detail |
| GET | /api/cart | customer | View cart |
| POST | /api/cart/items | customer | Add item |
| PUT | /api/cart/items/{productId} | customer | Update quantity |
| DELETE | /api/cart/items/{productId} | customer | Remove item |
| POST | /api/checkout | customer | Place an order |
| GET | /api/orders | customer | List own orders |
| GET | /api/orders/{order} | customer | Order detail |
| POST | /api/admin/products | admin | Create product |
| PUT | /api/admin/products/{product} | admin | Update product |
| DELETE | /api/admin/products/{product} | admin | Delete product |
| GET | /api/admin/orders | admin | List all orders |
| PATCH | /api/admin/orders/{order}/status | admin | Change order status |

## Order lifecycle

`pending -> paid -> fulfilled -> completed`, with `cancelled` reachable from `pending` and `paid`. Transitions are enforced on the server.
