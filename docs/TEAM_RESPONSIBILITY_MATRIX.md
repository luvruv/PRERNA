# 👥 Prerna Store — Three-Teammate Responsibility Matrix

This matrix divides the engineering deliverables among three team members with balanced effort, clear ownership boundaries, and precise file-level accountability for university project submission and viva defense.

---

## 1. Team Responsibilities Summary

| Teammate | Core Focus | Ownership Boundary | Primary Deliverables |
| :--- | :--- | :--- | :--- |
| **Teammate 1** | **Frontend & API Integration** | `apps/web/` | All 21 Next.js App Router routes, Tailwind CSS styling, Zustand client state, Axios API integration, responsive UX. |
| **Teammate 2** | **Backend & Business Logic** | `apps/api/` | NestJS controllers, services, JWT Passport auth, RBAC guards, 8-stage order state machine, atomic checkout transactions. |
| **Teammate 3** | **Database, System Integrity & QA** | `prisma/` & `scripts/` | Prisma schema, PostgreSQL constraints, 208-product seed script, automated E2E test suite, and panel demonstration materials. |

---

## 2. Granular Ownership & File Mapping

### 👤 Teammate 1 — Frontend & API Integration
- **Key Files Owned**:
  - `apps/web/src/app/page.tsx`: Customer storefront (Hero, Categories, Catalog).
  - `apps/web/src/app/login/page.tsx`: Dual demo switcher & authentication form.
  - `apps/web/src/app/search/page.tsx`: Live keyword search, price filters, category chips.
  - `apps/web/src/app/products/[slug]/page.tsx`: Product detail views with stock badges.
  - `apps/web/src/app/cart/page.tsx`: Cart slide-overs and line-item quantity steppers.
  - `apps/web/src/app/checkout/page.tsx`: Delivery address selection & payment method choice.
  - `apps/web/src/app/orders/[id]/page.tsx`: Real-time order progress timeline.
  - `apps/web/src/app/shopkeeper/page.tsx`: Merchant inventory dashboard & order queue.
  - `apps/web/src/app/delivery/page.tsx`: Rider delivery portal (pickup to delivery).
  - `apps/web/src/app/admin/page.tsx`: Administrator dashboard & rider dispatch.
  - `apps/web/src/lib/store/`: `useAuthStore.ts` & `useCartStore.ts`.
- **Viva Defense Topics**:
  - React Server Components vs. Client Components (`'use client'`).
  - Zustand state persistence and hydration in Next.js 14.
  - Handling responsive layouts, empty states, and error toasts with Tailwind CSS.

---

### 👤 Teammate 2 — Backend & Business Logic
- **Key Files Owned**:
  - `apps/api/src/auth/`: JWT token signing, Bcrypt verification, Passport strategy.
  - `apps/api/src/common/guards/roles.guard.ts`: Role-Based Access Control (RBAC).
  - `apps/api/src/products/products.service.ts`: Category filtering, search logic.
  - `apps/api/src/inventory/inventory.service.ts`: Inventory bounds, restock movements.
  - `apps/api/src/cart/cart.service.ts`: Server-side cart recalculation.
  - `apps/api/src/orders/orders.service.ts`: Atomic checkout transaction (`prisma.$transaction`) and 8-stage state machine validator.
  - `apps/api/src/delivery/delivery.service.ts`: Rider status transitions and history.
  - `apps/api/src/admin/admin.service.ts`: High-level metrics aggregator.
  - `apps/api/src/main.ts`: Swagger OpenAPI documentation configuration.
- **Viva Defense Topics**:
  - Dependency Injection and modular architecture in NestJS.
  - Protecting REST endpoints with JWT guards and custom `@Roles()` decorators.
  - Enforcing atomic concurrency during checkout to prevent negative stock.

---

### 👤 Teammate 3 — Database, System Integrity & QA
- **Key Files Owned**:
  - `prisma/schema.prisma`: 14 relational models, foreign keys, compound indexes, enums.
  - `prisma/catalog-data.ts`: 14 categories and 208 distinct realistic grocery products.
  - `prisma/seed.ts`: Idempotent database seeder for panel accounts and sample orders.
  - `scripts/test-e2e.ts`: 32 automated test cases covering authentication, inventory, race conditions, and dispatch.
  - `scripts/verify-panel-accounts.ts`: Health check script verifying panel accounts and DB metrics.
  - `docs/`: Complete project documentation suite, ER diagram, and setup guides.
- **Viva Defense Topics**:
  - Entity-Relationship diagram and schema normalization.
  - Database indexing strategy for high-performance product search.
  - Handling race conditions and transactional rollbacks in PostgreSQL.
  - Automated testing methodology and CI/CD verification.
