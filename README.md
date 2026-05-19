# Otaku Mandado

Otaku Mandado is a small e-commerce platform built around **timed Japanese-import drops** ("mandados") and a **persistent shop**, aimed at otaku buyers in Mexico. It is a two-service monorepo:

- `backend/` — Rails 8.1 API-only app (PostgreSQL, Devise + JWT, Cloudinary, RubyLLM, SolidQueue / SolidCache / SolidCable).
- `frontend/` — React 19 SPA built with Vite 8 and Tailwind CSS v4.

The two run side-by-side in development via the root [`Procfile`](Procfile).

---

## Table of contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
  - [1. Clone and install](#1-clone-and-install)
  - [2. Environment variables](#2-environment-variables)
  - [3. Database](#3-database)
  - [4. Run both services](#4-run-both-services)
  - [5. Seeded accounts](#5-seeded-accounts)
- [API surface](#api-surface)
- [Domain model](#domain-model)
- [Key concepts](#key-concepts)
  - [Sale phases and the landing page](#sale-phases-and-the-landing-page)
  - [Reservation flow and order grouping](#reservation-flow-and-order-grouping)
  - [Soft deletes](#soft-deletes)
  - [JPY → MXN conversion](#jpy--mxn-conversion)
  - [Cloudinary image uploads](#cloudinary-image-uploads)
  - [AI-generated item metadata](#ai-generated-item-metadata)
  - [Authentication and roles](#authentication-and-roles)
- [Frontend routing](#frontend-routing)
- [Testing](#testing)
- [Linting and security scanners](#linting-and-security-scanners)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Highlights

- **Timed drops ("mandados")**: each `Sale` has a `start_time` + `duration` (hours). The landing page shows a live countdown driven by the server-reported `phase` (`before` / `during` / `after`).
- **Persistent Shop**: a single `Sale` named `"Shop"` (see `Sale::SHOP_NAME`) backs the always-on catalog featured in the landing carousel.
- **Reservation-style orders**: placing an order flips an item from `available` → `reserved`; cancelling it flips it back if no other kept order holds it.
- **Order grouping**: a client's pending orders share one human-readable `order_number` (`ORD-DDMMYY-{user_id}-{id}`) so a single checkout groups multiple line items.
- **Auto-translated, auto-filled items**: admins drop images into a Cloudinary upload widget, and the server uses Anthropic Claude (via `ruby_llm`) to populate `name`, `brand`, and a Spanish `description`.
- **Yen-priced, peso-shown**: admins enter prices in JPY; the server converts to MXN with a 1-hour-cached Frankfurter exchange rate and stores both.
- **Admin/client RBAC**: enforced server-side in controllers and via `Item#viewable_by?` / `Item#reservable_by?`.
- **Soft deletes** everywhere via the shared `SoftDeletable` concern (`deleted_at` timestamp, `Model.kept`, `record.soft_discard!`).

---

## Architecture

```
┌─────────────────┐        JSON / JWT         ┌────────────────────────┐
│   React SPA     │ ───────────────────────▶ │  Rails API (api_only)  │
│  Vite + Tailwind│ ◀─────────────────────── │  Devise + JWT          │
└────────┬────────┘                          └───────┬────────────────┘
         │ Cloudinary direct upload                  │
         │ (unsigned preset)                         │ Active Record
         ▼                                           ▼
   ┌──────────────┐                            ┌─────────────┐
   │  Cloudinary  │ ◀─── public_ids ────────── │ PostgreSQL  │
   └──────────────┘     stored in items.image  └─────────────┘
         ▲
         │ vision URL
         │
   ┌──────────────────────────────────────────┐
   │ Anthropic Claude (via ruby_llm + schema) │
   └──────────────────────────────────────────┘
```

The frontend uploads images directly to Cloudinary using an unsigned preset. It then hands the resulting `public_id`s to the backend, which persists placeholder items and asks Claude to fill in `name` / `brand` / `description` from the Cloudinary URL.

Prices are entered in JPY; on save, `Item#sync_mx_price_from_price` calls `Currency::JpyToMxnConverter` (Frankfurter API, 1-hour `Rails.cache` TTL) and stores `mx_price`.

---

## Tech stack

### Backend (`backend/`)

- **Ruby** 3.3.5, **Rails** 8.1 (API-only)
- **PostgreSQL** primary + Solid* secondary DBs (`solid_cache`, `solid_queue`, `solid_cable`)
- **Devise** + **devise-jwt** (JTI-matcher revocation strategy)
- **Cloudinary** for image storage and CDN
- **ruby_llm** + **ruby_llm-schema** for vision/structured-output LLM calls (Anthropic Claude Haiku 4.5 by default)
- **rack-cors** for cross-origin SPA requests
- **dotenv-rails** in development/test
- **Puma** behind **Thruster** in production
- **Kamal** for container deploy
- **brakeman**, **bundler-audit**, **rubocop-rails-omakase**

### Frontend (`frontend/`)

- **React** 19, **react-dom** 19
- **Vite** 8 with `@vitejs/plugin-react`
- **Tailwind CSS** v4 via `@tailwindcss/vite`
- **ESLint** 10 with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- No router yet — uses hash-based routing in `frontend/src/utils/hashRoute.js`

---

## Repository layout

```
otaku_mandado/
├── Procfile                     # foreman: backend + frontend dev processes
├── backend/                     # Rails 8.1 API
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── users/           # Devise sessions + registrations (JSON)
│   │   │   ├── v1/              # versioned public/admin endpoints
│   │   │   └── concerns/        # OptionalAuthentication
│   │   ├── models/              # User, Sale, Item, Order + SoftDeletable concern
│   │   └── services/
│   │       ├── ai/              # ProcessImageMetadataService (LLM vision)
│   │       ├── currency/        # JpyToMxnConverter (Frankfurter)
│   │       └── nav_visibility.rb
│   ├── config/                  # routes.rb, cors.rb, ruby_llm.rb, devise.rb, deploy.yml…
│   ├── db/
│   │   ├── migrate/             # AR migrations
│   │   ├── schema.rb            # users / sales / items / orders
│   │   └── seeds.rb             # fixture sale + shop + users
│   ├── test/                    # Minitest suites
│   └── Dockerfile               # production image
└── frontend/                    # React 19 + Vite SPA
    ├── src/
    │   ├── api.js               # fetch wrappers + JWT helpers
    │   ├── App.jsx              # hash-route dispatch
    │   ├── components/
    │   │   ├── navbar/          # nav + nav links + visibility hook
    │   │   ├── landing/         # InfoCard, ItemCarousel
    │   │   ├── sale/            # ProductCard, ItemUploadModal, EditablePrice
    │   │   ├── item/            # ItemDetailPanel, ItemDisplayCase
    │   │   ├── orders/          # OrderGroupCard, OrderStatusSelect
    │   │   ├── accounts/        # AccountCard
    │   │   ├── layout/          # Footer, PageBackground
    │   │   └── ui/              # ConfirmDialog, PillLink
    │   ├── utils/               # hashRoute, countdown, cloudinaryUpload
    │   └── main.jsx
    ├── public/                  # static assets (logo, icons)
    ├── vite.config.js
    └── eslint.config.js
```

---

## Prerequisites

- **Ruby** 3.3.5 (matching `backend/.ruby-version`)
- **Bundler** (`gem install bundler`)
- **Node.js** 20+ and **npm**
- **PostgreSQL** 14+ running locally
- **foreman** (optional, recommended) — `gem install foreman`
- A **Cloudinary** account (cloud name, unsigned upload preset)
- An **Anthropic** API key (used by the AI metadata service; admin item uploads will fail without it)

---

## Local setup

### 1. Clone and install

```bash
git clone <repo-url> otaku_mandado
cd otaku_mandado

# Backend
cd backend
bundle install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Environment variables

Create the two `.env` files below. **Do not commit real keys.**

**`backend/.env`**

```bash
# Anthropic — used by ruby_llm for vision-based item metadata.
# Get one at https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

# Cloudinary — used by Item#image_urls to build CDN URLs and by the
# AI metadata service to feed Claude a vision URL.
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Optional: comma-separated list of origins allowed by CORS.
# Defaults to "http://localhost:5173,http://localhost:3000".
# FRONTEND_ORIGINS=http://localhost:5173
```

**`frontend/.env`**

```bash
VITE_API_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_upload_preset>
# Optional: folder prefix applied to direct-uploaded item images.
# VITE_CLOUDINARY_UPLOAD_FOLDER=otaku_mandado/items
```

In Cloudinary, create an **unsigned upload preset** matching `VITE_CLOUDINARY_UPLOAD_PRESET` so the SPA can upload directly from the browser.

### 3. Database

```bash
cd backend
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed
```

`db/seeds.rb` is idempotent for users but **destructive for orders/items/sales** (it deletes them all before reseeding the fixture sale and shop). Run it only in development.

The seed creates:

- One timed `Sale` named `"Seed Sale"` starting 2 days from now, duration 3 hours, with 45 items.
- One persistent `Sale` named `"Shop"` with 12 items (a mix of available / reserved / purchased statuses).
- Four users (see below).

### 4. Run both services

From the repo root:

```bash
foreman start
```

This boots `rails server -p 3000` and `vite` (default port `5173`) together. Visit the SPA at <http://localhost:5173>.

Equivalently you can run each process by hand:

```bash
# terminal 1
cd backend && bin/rails server -p 3000

# terminal 2
cd frontend && npm run dev
```

### 5. Seeded accounts

| Email                | Password   | Role   |
| -------------------- | ---------- | ------ |
| `admin@example.com`  | `password` | admin  |
| `client1@example.com`| `password` | client |
| `client2@example.com`| `password` | client |
| `client3@example.com`| `password` | client |

Use the sign-in modal in the navbar. Admin views unlock additional pages (Schedule Sale, View Orders, View Accounts).

---

## API surface

All endpoints are JSON. Authenticated routes require an `Authorization: Bearer <jwt>` header, which the frontend stores in `localStorage` under `auth_token`.

### Auth (Devise + devise-jwt)

| Method | Path              | Notes                                                   |
| ------ | ----------------- | ------------------------------------------------------- |
| POST   | `/users`          | Register. Returns JWT in `Authorization` response header.|
| POST   | `/users/sign_in`  | Sign in. Returns JWT in `Authorization` response header.|
| DELETE | `/users/sign_out` | Revokes the JWT (JTI matcher).                          |
| GET    | `/me`             | Current user payload (id, email, role).                 |

### v1 — public

| Method | Path                                | Notes                                                                 |
| ------ | ----------------------------------- | --------------------------------------------------------------------- |
| GET    | `/v1/landing_sale`                  | Featured timed drop for the landing page + countdown timing.          |
| GET    | `/v1/shop_sale`                     | Persistent shop sale + items (used by the carousel and the shop page).|
| GET    | `/v1/sale_pages/:id`                | Public drop page (items, phase, `starts_at`, `ends_at`). Yen price hidden.|
| GET    | `/v1/item_pages/:sale_id/:id`       | Public item detail. Visibility gated by `Item#viewable_by?`; sends JWT when available so order owners see their reserved items.|

### v1 — authenticated

| Method | Path                                   | Roles    | Notes                                                                                 |
| ------ | -------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| GET    | `/v1/nav_context`                      | any      | Drives the navbar's visibility of "Current Sale" / "Upcoming Sale" / admin pages.     |
| GET    | `/v1/sales/:id`                        | admin    | Sale + items, includes yen `price`.                                                   |
| POST   | `/v1/sales`                            | admin    | Create a timed drop.                                                                  |
| PATCH  | `/v1/sales/:id`                        | admin    | Update name / `start_time` / `duration`.                                              |
| DELETE | `/v1/sales/:id` (or member `delete`)   | admin    | Soft-delete a sale; cascades a soft-discard to its items.                             |
| POST   | `/v1/sales/:sale_id/items`             | admin    | Body: `{ public_ids: [...] }`. Creates placeholder items, then runs AI metadata.      |
| PATCH  | `/v1/sales/:sale_id/items/:id`         | admin    | Update an item; `price` is JPY (server recalculates `mx_price`).                      |
| DELETE | `/v1/sales/:sale_id/items/:id`         | admin    | Soft-delete an item.                                                                  |
| GET    | `/v1/orders`                           | any      | Clients: own orders. Admins: every user's orders (includes `user` field).             |
| POST   | `/v1/orders`                           | client   | Body: `{ order: { item_id } }`. Reserves the item.                                     |
| PATCH  | `/v1/orders/:id`                       | varies   | Update fulfillment `status`. Clients only on their own; admins on any.                |
| DELETE | `/v1/orders/:id`                       | varies   | Soft-discard the order line; releases the item if no other kept order holds it.       |
| GET    | `/v1/accounts`                         | admin    | All users with `pending_orders`, `pending_orders_count`, `total_spent` (MXN).         |

### Health check

| Method | Path  | Notes                                                |
| ------ | ----- | ---------------------------------------------------- |
| GET    | `/up` | Rails health endpoint — 200 if the app booted OK.    |

---

## Domain model

```
User (1) ── (n) Order (n) ── (1) Item (n) ── (1) Sale
```

| Table  | Key fields                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------- |
| users  | `email`, `encrypted_password`, `jti` (JWT revocation), `role` (`admin` / `client`), `total_spent`   |
| sales  | `name`, `start_time`, `duration` (hours), `deleted_at`                                              |
| items  | `sale_id`, `name`, `brand`, `description`, `price` (JPY), `mx_price` (MXN), `status`, `image` jsonb, `deleted_at` |
| orders | `user_id`, `item_id`, `order_number`, `status`, `deleted_at`                                        |

- `Item::STATUSES = ["reserved", "purchased", "available"]`
- `Order::STATUSES = ["pending", "payment fulfilled", "items purchased", "items sent", "items received"]`
- `User::ROLES = ["admin", "client"]` (also enforced by a DB check constraint)
- `Item#image` is JSONB holding up to **2 Cloudinary `public_id` strings**.

---

## Key concepts

### Sale phases and the landing page

A `Sale` has `starts_at` / `ends_at` (computed from `start_time` + `duration`). `Sale#phase_at(time)` returns one of:

- `"before"` — countdown to opening.
- `"during"` — the drop is live.
- `"after"` — the drop has closed.

`Sale.next_for_landing` prefers an actively-running drop; otherwise it returns the first upcoming drop whose start is no more than 5 hours in the past. The frontend renders the appropriate copy + countdown via `DigitTimer` and `utils/countdown.js`.

`Sale.current_for_nav(role)` decides whether the navbar's **Current Sale** link is visible. Clients see it from 1 hour before opening until end-of-drop; admins also keep it visible for 1 hour after the drop closes.

### Reservation flow and order grouping

- Creating an order requires a `kept` item and the signed-in user.
- `Order#mark_item_reserved` (after-create) flips `available` → `reserved`. It deliberately leaves `purchased` alone.
- A user cannot create a second active order on the same item (`no_duplicate_active_order_for_user_item`).
- All of a user's `pending` orders share one `order_number`. New orders inherit the existing pending number; after the row is persisted, `finalize_order_number` rewrites `TMP-…` to `ORD-{DDMMYY}-{user_id}-{id}` (the date comes from the sale's `start_time`).
- Soft-discarding a kept order (`DELETE /v1/orders/:id`) releases the item back to `available` if no other kept order holds it.
- When an admin flips an order to `payment fulfilled`, `Order#credit_user_total_spent` atomically increments `users.total_spent` by the item's `mx_price`. This drives the `total_spent` column on the View Accounts page.

### Soft deletes

Models that include `SoftDeletable` (`Sale`, `Item`, `Order`) expose:

- `Model.kept` — scope where `deleted_at IS NULL`.
- `record.soft_discard!` — sets `deleted_at = Time.current`.
- `record.restore!` — clears `deleted_at`.

Discarding a `Sale` cascades a soft-discard to its kept items (`Sale#discard_items_when_sale_discarded`).

### JPY → MXN conversion

`Item#price` is the canonical JPY value. On save (`before_save` `sync_mx_price_from_price`), `Currency::JpyToMxnConverter` fetches the latest JPY→MXN rate from `https://api.frankfurter.dev/v1/latest?from=JPY&to=MXN`, caches it for 1 hour under `Rails.cache["currency/jpy_mxn_rate"]`, and writes `mx_price` rounded to the nearest 10 pesos. If the rate is unreachable, the save aborts with a validation error on `:price`.

Inject a rate explicitly with `Currency::JpyToMxnConverter.convert_yen(amount, rate: 0.12)` (useful in tests).

### Cloudinary image uploads

- The frontend uploads files directly to Cloudinary via the unsigned preset configured in `VITE_CLOUDINARY_UPLOAD_PRESET` (see `frontend/src/utils/cloudinaryUpload.js`).
- Cloudinary returns a `public_id`; the SPA POSTs the `public_id`s to `POST /v1/sales/:sale_id/items`.
- `Item#image_urls` builds full CDN URLs through `Cloudinary::Utils.cloudinary_url`. If `CLOUDINARY_URL` is missing the helper falls back to raw `public_id`s (useful for tests).

### AI-generated item metadata

`Ai::ProcessImageMetadataService` runs in the `POST /v1/sales/:sale_id/items` action:

1. Persist a placeholder `Item` for each incoming `public_id` so we have an id.
2. For each item, send the Cloudinary URL to Anthropic Claude via `ruby_llm.chat.with_schema(ItemSchema)`.
3. The schema asks for `name`, `brand`, Spanish `description`, and an `error`/`error_message` pair.
4. Update the item with the structured response.

The default model is `claude-haiku-4-5` (`backend/config/initializers/ruby_llm.rb`). Errors per image are returned in the response under `errors`.

### Authentication and roles

- **devise-jwt** issues a JWT on `sign_up` / `sign_in` in the `Authorization` response header.
- Tokens are revoked via the **JTI matcher** strategy (`User#jti`), so logging out actually invalidates the token server-side.
- `User.role` is checked in controllers (e.g. `OrdersController`, `AccountsController`) and in `Item#viewable_by?` / `Item#reservable_by?` to gate visibility on the public item page.
- `OptionalAuthentication` (controller concern) lets the public item page upgrade to user-scoped visibility when a JWT is present without requiring it.

---

## Frontend routing

`frontend/src/App.jsx` uses **hash-based routing** (`utils/hashRoute.js`) until react-router is added. Supported routes:

| Hash                      | Page                |
| ------------------------- | ------------------- |
| `#` / `#landing`          | `LandingPage`       |
| `#current-sale`           | `SalePage` (current drop) |
| `#upcoming-sale`          | `SalePage` (next drop)    |
| `#browse-shop`            | `SalePage` for the Shop   |
| `#sale-{id}`              | `SalePage` for a specific sale |
| `#item-{saleId}-{itemId}` | `ItemViewPage`      |
| `#schedule-sale`          | `ScheduleSalePage` (admin) |
| `#view-orders`            | `OrdersPage` (admin) |
| `#your-orders`            | `OrdersPage` (client) |
| `#view-accounts`          | `AccountsPage` (admin) |

All API calls live in `frontend/src/api.js`. Authenticated calls go through `authFetch`, which reads the JWT from `localStorage.auth_token`.

---

## Testing

The backend uses **Minitest** (Rails default).

```bash
cd backend
bin/rails test               # models, services, controllers, integration
bin/rails test:system        # (none yet — add as needed)
```

Test files live under `backend/test/{models,services,controllers,integration}`. Currency conversion stubs are convenient via `Currency::JpyToMxnConverter.convert_yen(amount, rate: 0.12)`.

The frontend currently has no test runner configured. ESLint is the main quality gate.

---

## Linting and security scanners

```bash
# Backend
cd backend
bundle exec rubocop          # rubocop-rails-omakase
bundle exec brakeman --quiet # static security analysis
bundle exec bundler-audit check --update

# Frontend
cd frontend
npm run lint
```

---

## Deployment

The backend ships with a production-grade [`Dockerfile`](backend/Dockerfile) (Ruby 3.3.5-slim base, jemalloc, libvips, Thruster + Puma) and a [Kamal](https://kamal-deploy.org) config under `backend/config/deploy.yml` / `backend/.kamal/`.

A typical Kamal flow:

```bash
cd backend
bin/kamal setup    # first-time deploy
bin/kamal deploy   # subsequent deploys
```

Required production environment variables (in addition to the dev `.env`):

- `RAILS_MASTER_KEY` (matches `backend/config/master.key`)
- `BACKEND_DATABASE_PASSWORD`
- `ANTHROPIC_API_KEY`
- `CLOUDINARY_URL`
- `FRONTEND_ORIGINS` (comma-separated list of allowed SPA origins)

The frontend is a static Vite build:

```bash
cd frontend
npm run build     # outputs frontend/dist/
npm run preview   # local preview of the built bundle
```

`VITE_API_URL` must point at the deployed backend.

---

## Troubleshooting

- **`Item save fails with "could not convert to Mexican pesos"`** — `Currency::JpyToMxnConverter` couldn't reach Frankfurter. Check network egress, or pass an explicit rate in tests.
- **AI metadata says "Invalid LLM response format"** — usually a missing/invalid `ANTHROPIC_API_KEY`, or the upstream model returned non-structured content. Items still save with empty `name`/`brand`/`description`; admins can edit them by hand.
- **Cloudinary uploads return 401** — make sure `VITE_CLOUDINARY_UPLOAD_PRESET` is configured as **unsigned** in your Cloudinary dashboard.
- **CORS errors from the SPA** — set `FRONTEND_ORIGINS` to your SPA origin(s). The default allows `http://localhost:5173` and `http://localhost:3000`.
- **Devise sign-out returns 401** — the JWT was already revoked or expired. Clearing `localStorage.auth_token` and re-logging in resets the client.
- **Seeded data disappeared** — `db/seeds.rb` deletes all `Order`, `Item`, and `Sale` rows at the top. Re-run `bin/rails db:seed` to rebuild them.

