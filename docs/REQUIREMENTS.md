# 📋 Prerna Store — Functional & Non-Functional Requirements

## 1. Functional Requirements (FR)

| Req ID | Module | Description | Associated Entities / Endpoints | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Auth | User registration with email uniqueness, phone, and Bcrypt hashing | `POST /auth/register`<br>`User` | High | **VERIFIED** |
| **FR-02** | Auth | Role-based JWT authentication returning user profile and access token | `POST /auth/login`<br>`User` | High | **VERIFIED** |
| **FR-03** | Auth | Role-Based Access Control (RBAC) guard blocking unauthorized endpoints | `RolesGuard`<br>`@Roles(...)` | Critical | **VERIFIED** |
| **FR-04** | Catalog | Category and product browsing with pagination and keyword search | `GET /products`<br>`Category`, `Product` | High | **VERIFIED** |
| **FR-05** | Catalog | Dynamic product detail views with high-res imagery, discounts, and stock badges | `GET /products/:slug`<br>`ProductImage` | Medium | **VERIFIED** |
| **FR-06** | Cart | Persistent database-backed shopping cart synchronized across browser reloads | `POST /cart/items`<br>`Cart`, `CartItem` | High | **VERIFIED** |
| **FR-07** | Address | Customer multiple delivery address management (Home, Office) with default flag | `POST /customers/addresses`<br>`Address` | Medium | **VERIFIED** |
| **FR-08** | Checkout | Server-side total calculation, delivery fee rules, and atomic stock reservation | `POST /orders/checkout`<br>`Order`, `Inventory` | Critical | **VERIFIED** |
| **FR-09** | Payment | Test payment simulation with instant transaction references and COD support | `POST /orders/:id/pay`<br>`Payment` | High | **VERIFIED** |
| **FR-10** | Merchant | Shopkeeper store inventory dashboard with quantity restock controls | `POST /inventory/adjust`<br>`InventoryMovement` | High | **VERIFIED** |
| **FR-11** | Merchant | Store order acceptance and preparation pipeline (`CONFIRMED`, `PREPARING`, `READY`) | `PATCH /orders/:id/status`<br>`OrderStatusHistory` | High | **VERIFIED** |
| **FR-12** | Admin | Admin dispatch assigning delivery partners to ready orders | `POST /admin/dispatch`<br>`DeliveryAssignment` | High | **VERIFIED** |
| **FR-13** | Delivery | Rider portal for claiming, picking up, and completing doorstep deliveries | `PATCH /delivery/:id/status`<br>`DeliveryStatusHistory`| High | **VERIFIED** |
| **FR-14** | Customer | Live timeline tracking order progress from kitchen/shelf to front door | `GET /orders/:id/track`<br>`Order` | High | **VERIFIED** |
| **FR-15** | Admin | Real-time platform metrics (total orders, GMV revenue, active stores, inventory) | `GET /admin/metrics`<br>`AuditLog` | Medium | **VERIFIED** |

---

## 2. Non-Functional Requirements (NFR)

| Req ID | Quality Dimension | Standard / Acceptance Target | Implementation in Prerna Store | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-01** | **Security** | Passwords must never be stored in plain text; secrets must not leak to client. | Bcrypt hashing with 10 salt rounds; JWT expiration; `.env` separation. | **VERIFIED** |
| **NFR-02** | **Data Integrity** | Stock levels must never be negative; historical receipts must never mutate. | Prisma `$transaction` with pre-decrement verification; OrderItem snapshots. | **VERIFIED** |
| **NFR-03** | **Performance** | Catalog search and product detail responses must return under 200ms. | Database indexing on `slug`, `categoryId`, and `storeId`; lean JSON envelopes. | **VERIFIED** |
| **NFR-04** | **Usability** | Interface must be fully responsive across mobile (390px) and desktop (1280px+). | Tailwind CSS responsive grids, slide-over sheets, sticky bottom bars on mobile. | **VERIFIED** |
| **NFR-05** | **Scalability** | Stateless backend architecture allowing horizontal API clustering. | Stateless JWT authentication; connection pooling in Prisma. | **VERIFIED** |
| **NFR-06** | **Testability** | Automated regression tests verifying critical user paths. | 32 automated End-to-End tests in `scripts/test-e2e.ts` with 100% pass rate. | **VERIFIED** |
| **NFR-07** | **Maintainability**| Clear modular separation of concerns with strong TypeScript typings. | NestJS modules with DTOs and Prisma generated types; zero `any` shortcuts. | **VERIFIED** |
