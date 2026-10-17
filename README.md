# 🛒 Prerna Store — Blinkit-Style Quick-Commerce Platform

A production-grade, Blinkit-style quick-commerce grocery platform engineered with a high-performance **NestJS** backend, **Next.js 14 App Router** frontend, and **PostgreSQL** persistence managed via **Prisma ORM**.

---

## 🎓 University Examination Panel Quick Links & Demo Accounts

### Official Examination Demo Accounts (Password: `2026@prerna`)
| Role | Email | Password | Access Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `2026@prerna` | Platform analytics, store management, rider dispatch |
| **Customer** | `customer@gmail.com` | `2026@prerna` | Browse 208 products, cart, checkout, live order tracking |
| **Merchant** | `merchant@gmail.com` | `2026@prerna` | Store owner for Sunrise Fresh Market, restock inventory, pack orders |
| **Delivery Partner** | `deliverypartner@gmail.com` | `2026@prerna` | EV Scooter rider (`DL 01 EX 2026`), pickup parcel, doorstep delivery |

*(Note: Legacy dev accounts with `Prerna@123` e.g. `admin@prernastore.local` remain active for automated test regression).*

### 📚 Project Documentation Suite (`docs/`)
- [**Architecture & Technology Inventory**](file:///c:/Users/jaind/Projects/PRERNA/docs/ARCHITECTURE.md): Monorepo design, technology choices, folder tree, and file-by-file reference.
- [**Database & System Design**](file:///c:/Users/jaind/Projects/PRERNA/docs/DATABASE_DESIGN.md): PostgreSQL schema, Mermaid ER diagram, indexes, constraints, and atomic transactions.
- [**Functional & Non-Functional Requirements**](file:///c:/Users/jaind/Projects/PRERNA/docs/REQUIREMENTS.md): 15 Functional Requirements and 7 Non-Functional Requirements.
- [**End-to-End Business Workflows & Testing**](file:///c:/Users/jaind/Projects/PRERNA/docs/WORKFLOWS_AND_TESTING.md): Workflows A–G, sequence diagrams, and 32 passing test cases.
- [**Setup & Startup Guide**](file:///c:/Users/jaind/Projects/PRERNA/docs/SETUP_AND_STARTUP_GUIDE.md): Windows PowerShell commands, prerequisites checklist, and troubleshooting.
- [**Panel Presentation Script & Viva Q&A**](file:///c:/Users/jaind/Projects/PRERNA/docs/PANEL_PRESENTATION_AND_VIVA.md): 7–10 minute demonstration walkthrough and 10 technical viva answers.
- [**Three-Teammate Responsibility Matrix**](file:///c:/Users/jaind/Projects/PRERNA/docs/TEAM_RESPONSIBILITY_MATRIX.md): Clear division of frontend, backend, and database deliverables.

---

## 📌 Architecture & Technology Stack

```
                     ┌───────────────────────────────────┐
                     │     Next.js 14 App Router (Web)   │
                     │  Zustand • TanStack Query • RHF   │
                     └─────────────────┬─────────────────┘
                                       │ HTTP / REST (JWT)
                                       ▼
                     ┌───────────────────────────────────┐
                     │         NestJS Backend API        │
                     │  RBAC Guards • Class-Validator    │
                     │        Swagger / OpenAPI          │
                     └─────────────────┬─────────────────┘
                                       │ Prisma Client
                                       ▼
                     ┌───────────────────────────────────┐
                     │        PostgreSQL Database        │
                     │    Atomic Transactions & Locks    │
                     └───────────────────────────────────┘
```

- **Frontend (`apps/web`)**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack React Query v5, Zustand (Auth & Cart state), Lucide React.
- **Backend (`apps/api`)**: NestJS 10, TypeScript, Passport JWT, Bcrypt password hashing, Class-Validator DTOs, Swagger/OpenAPI documentation.
- **Database & Data Layer**: PostgreSQL, Prisma ORM 6 with strict relations, cascading integrity, transactional inventory deduction, and immutable audit logs.
- **Demo Catalog**: 208 distinct realistic grocery and household products across 14 categories.

---

## 🚀 Instant Startup Commands

```powershell
# 1. Install dependencies
npm install

# 2. Push schema & seed 208 products + 4 panel accounts
npx prisma db push --schema=prisma/schema.prisma
npx tsx prisma/seed.ts

# 3. Start Frontend (3000) & Backend API (4001) concurrently
npm run dev

# 4. Run automated E2E test suite (32 tests)
npx tsx scripts/test-e2e.ts
```

- **Storefront URL**: `http://localhost:3000`
- **Backend API URL**: `http://localhost:4001/api/v1`
- **Swagger Documentation**: `http://localhost:4001/api/docs`
