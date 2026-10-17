# 🏛️ Prerna Store — Comprehensive Architecture & Codebase Guide

## 1. Executive Summary & Purpose
**Prerna Store** is a production-grade, Blinkit-style quick-commerce hyper-local grocery platform developed for university evaluation. It solves the last-mile delivery challenge by enabling customers to browse hyper-local merchant inventory, order groceries with guaranteed sub-15 minute delivery, and track orders across an 8-stage state machine. The system natively supports four distinct roles:
1. **Customer**: Discover products, manage cart, place orders, and track deliveries.
2. **Shopkeeper (Merchant)**: Manage catalog, inventory stock bounds, accept orders, and prepare packages.
3. **Delivery Partner**: Claim assignments, navigate pick-up to doorstep, and confirm delivery.
4. **Administrator**: Oversee platform metrics, audit logs, merchant approvals, and rider dispatch.

---

## 2. Real Architecture & Technology Stack Inventory

| Component | Technology | Version | Exact Repository Usage |
| :--- | :--- | :--- | :--- |
| **Monorepo Architecture** | npm Workspaces | v10+ | Root `package.json` orchestrates `apps/api` (NestJS) and `apps/web` (Next.js). |
| **Backend Framework** | NestJS | v10.4.15 | `apps/api/src/main.ts` — Modular architecture with dependency injection, guards, interceptors, and pipes. |
| **Backend Runtime** | Node.js (TypeScript) | Node v20+ / TS v5.7 | Clean separation of routers, controllers, DTOs, services, and entities. |
| **Frontend Framework** | Next.js (App Router) | v14.2.23 | `apps/web/src/app` — React Server Components & Client Components with layout hierarchy. |
| **Database Engine** | PostgreSQL | v15 / v16 | Native Windows service or Docker container (`prerna_store`). |
| **Object-Relational Mapping (ORM)** | Prisma ORM | v6.3.1 | `prisma/schema.prisma` — Type-safe queries, relational schema migrations, connection pooling. |
| **API Architecture** | RESTful HTTP/JSON | HTTP/1.1 | Standard prefix `/api/v1` with consistent envelope format `{ success, data, message, timestamp }`. |
| **API Documentation** | Swagger / OpenAPI | v7.4.2 | Interactive API portal served at `http://localhost:4001/api/docs`. |
| **Authentication & Session** | JWT + Passport | v10.0.0 | Stateless Bearer Tokens signed with HMAC-SHA256, Bcrypt password hashing (10 salt rounds). |
| **Role Authorization** | Custom RBAC Guards | - | `@Roles(...)` decorator + `RolesGuard` validating roles against JWT claims. |
| **Client State Management** | Zustand | v5.0.3 | `useAuthStore.ts` & `useCartStore.ts` — Lightweight, persistent client-side store with local storage sync. |
| **Styling & Design System** | Tailwind CSS + Vanilla CSS | v3.4.17 | Custom warm aesthetic (Amber, Saffron, Cardamom color palette) without generic templates. |
| **Icons & Micro-animations** | Lucide React | v0.475.0 | Crisp, semantic SVG iconography across all user interfaces. |
| **Concurrency Control** | Prisma `$transaction` | - | Atomic updates for checkout, stock reservation, and status transitions preventing race conditions. |

---

## 3. Directory Structure & Layer Responsibilities

```
PRERNA/
├── apps/
│   ├── api/                           # NestJS Backend API Application
│   │   ├── src/
│   │   │   ├── auth/                  # Authentication, JWT strategy, login/register
│   │   │   ├── common/                # Shared decorators, guards, exception filters, interceptors
│   │   │   ├── prisma/                # Prisma client service wrapper & module
│   │   │   ├── products/              # Product browsing, category filtering, search
│   │   │   ├── stores/                # Store directory & merchant store profiles
│   │   │   ├── inventory/             # Stock reservation, replenishment & movement audit logs
│   │   │   ├── cart/                  # Database-backed cart & item quantity management
│   │   │   ├── orders/                # 8-stage state machine, checkout transaction & lifecycle
│   │   │   ├── delivery/              # Rider assignments, status updates & history
│   │   │   ├── admin/                 # High-level platform analytics & dispatch overrides
│   │   │   ├── app.module.ts          # Root dependency injection container
│   │   │   └── main.ts                # Application bootstrap, Swagger setup & global pipes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                           # Next.js 14 App Router Frontend
│       ├── public/                    # Static brand assets & logos
│       ├── src/
│       │   ├── app/                   # App Router directory (21 routes)
│       │   │   ├── page.tsx           # Customer Storefront (Hero, Categories, Featured Products)
│       │   │   ├── layout.tsx         # Root responsive layout with Header & Footer
│       │   │   ├── login/             # Dual demo switcher & credential authentication
│       │   │   ├── register/          # Customer account registration
│       │   │   ├── search/            # Live catalog search, category chips & price sorting
│       │   │   ├── products/[slug]/   # Dynamic product detail page with inventory badge
│       │   │   ├── stores/            # Store directory and store detail pages
│       │   │   ├── cart/              # Slide-over & page cart with quantity steppers
│       │   │   ├── checkout/          # Address selector, payment choice & order placement
│       │   │   ├── orders/            # Customer order history & real-time tracking timeline
│       │   │   ├── shopkeeper/        # Merchant Dashboard (stock edits, order acceptance)
│       │   │   ├── delivery/          # Delivery Partner Dashboard (accept, pickup, deliver)
│       │   │   └── admin/             # Administrator Dashboard (metrics, store/rider dispatch)
│       │   ├── components/            # Reusable UI building blocks (Header, ProductCard, etc.)
│       │   └── lib/                   # Axios API client, Zustand stores & TypeScript types
│       ├── package.json
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── prisma/                            # Database Schema & Migrations
│   ├── schema.prisma                  # 14 Relational Models, Enums & Indexes
│   ├── catalog-data.ts                # 14 Categories & 208 Realistic Grocery Products
│   └── seed.ts                        # Idempotent database seeder with 4 panel accounts
│
├── scripts/                           # Quality Assurance & Test Verification
│   ├── test-e2e.ts                    # 32 Automated End-to-End API tests
│   └── verify-panel-accounts.ts       # Verification of panel accounts & DB statistics
│
├── docs/                              # Project Documentation Suite
├── .env                               # Active environment configuration
├── .env.example                       # Clean template for team distribution
├── docker-compose.yml                 # PostgreSQL container definition
└── package.json                       # Monorepo workspaces definition
```

---

## 4. Key Architectural Decisions

### 4.1 Client-Side vs Server-Side Execution
- **Server Execution**: Next.js App Router executes server components for the initial HTML shell, eliminating layout shift and optimizing SEO. NestJS handles all relational queries, business logic, authorization, and transactions.
- **Client Execution**: Zustand stores on the frontend handle interactive state (e.g., active cart item counts, search input debouncing, and authentication tokens) without round-trips.

### 4.2 Database Access & Security
- **No Direct Browser Access**: The browser client communicates exclusively with the NestJS API over HTTP/JSON (`/api/v1`). Database credentials never touch the client bundle.
- **Data Snapshotting**: Order items store a snapshot of the product name, unit price, and subtotal at the moment of order placement. If a merchant changes product prices later, existing order history remains financially accurate.

### 4.3 Atomic Concurrency Control
- In high-velocity grocery ordering, two users may attempt to buy the last carton of milk simultaneously. Prerna Store executes checkout within a Prisma interactive transaction (`prisma.$transaction`).
- The inventory level is checked, decremented, and verified inside the atomic transaction block. If available quantity is insufficient, the transaction rolls back cleanly, returning HTTP 400 without negative stock.
