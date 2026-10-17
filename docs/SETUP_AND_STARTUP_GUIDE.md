# 🚀 Prerna Store — Setup, Terminal Commands & Startup Guide

## 1. Prerequisites & Software Installation Checklist

| Software | Minimum Version | Purpose | Mandatory? | Windows PowerShell Verification Command |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js LTS** | v20.x or v22.x | JavaScript runtime for Next.js & NestJS | **Yes** | `node -v` |
| **npm** | v10.x+ | Monorepo workspaces & dependency management | **Yes** | `npm -v` |
| **PostgreSQL** | v15.x or v16.x | Primary relational database | **Yes** | `psql --version` or verify Windows service |
| **Git** | v2.40+ | Version control | **Yes** | `git --version` |
| **VS Code** | Latest | Recommended IDE | Optional | `code -v` |
| **Docker Desktop** | Latest | Container runtime if PostgreSQL is containerized | Optional | `docker compose version` |

---

## 2. Environment Configuration (`.env`)

In the repository root (`c:\Users\jaind\Projects\PRERNA`), copy `.env.example` to `.env`:

```env
# Database Connection (Direct local PostgreSQL on port 5432)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prerna_store?schema=public"

# Backend API Configuration
PORT=4001
API_PREFIX=api/v1
JWT_SECRET="prerna_super_secret_jwt_key_university_demo_2026_secured"
JWT_EXPIRATION="7d"

# Frontend Configuration
NEXT_PUBLIC_API_URL="http://localhost:4001/api/v1"
```

---

## 3. Exact Step-by-Step Startup Procedure

### Step 1: Open Repository in PowerShell
```powershell
cd c:\Users\jaind\Projects\PRERNA
```

### Step 2: Install Monorepo Dependencies
```powershell
npm install
```

### Step 3: Initialize Database Schema & Seed Data
Push the Prisma schema to PostgreSQL and seed 14 categories, 208 products, and the 4 university examination accounts:
```powershell
npx prisma db push --schema=prisma/schema.prisma
npx tsx prisma/seed.ts
```

### Step 4: Start the Full-Stack Application
You can run both API (port 4001) and Frontend (port 3000) concurrently with a single command:
```powershell
npm run dev
```

Alternatively, open two separate PowerShell windows:
- **Terminal 1 (Backend API)**:
  ```powershell
  npm run dev:api
  ```
- **Terminal 2 (Frontend Storefront)**:
  ```powershell
  npm run dev:web
  ```

---

## 4. Port Allocations & Application URLs

| Service | Local URL | Documentation / Endpoints |
| :--- | :--- | :--- |
| **Next.js Frontend** | `http://localhost:3000` | Main storefront, login, customer cart, role dashboards |
| **NestJS Backend API** | `http://localhost:4001` | REST API routes under `/api/v1` |
| **Swagger Interactive Docs** | `http://localhost:4001/api/docs` | Live interactive OpenAPI sandbox to test endpoints |
| **Prisma Studio (GUI)** | `npm run db:studio` | Visual database manager at `http://localhost:5555` |

---

## 5. Verification Commands
To quickly verify that all systems, database counts, and role accounts are functioning properly:

```powershell
# 1. Run the 32-step automated End-to-End test suite:
npx tsx scripts/test-e2e.ts

# 2. Verify the 4 university panel login credentials and database counts:
npx tsx scripts/verify-panel-accounts.ts
```

---

## 6. How to Gracefully Stop & Restart

### Stopping the Servers:
- In the active PowerShell terminal where `npm run dev` is running, press **`Ctrl + C`**, then type **`Y`** and press **`Enter`**.

### Restarting after a PC Reboot:
1. Ensure the PostgreSQL service is running (in Windows Services or Docker).
2. Open PowerShell in `c:\Users\jaind\Projects\PRERNA`.
3. Run `npm run dev`. Your data and seeded accounts will persist in PostgreSQL.
