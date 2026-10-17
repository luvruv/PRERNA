# 🔄 Prerna Store — End-to-End Business Workflows & Verification

## 1. End-to-End Business Lifecycle (Workflows A – G)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant Web as 🌐 Next.js Frontend
    participant API as 🚀 NestJS Backend
    participant DB as 🐘 PostgreSQL (Prisma)
    actor Merchant as 🏪 Shopkeeper
    actor Admin as 🛡️ Admin
    actor Rider as 🛵 Delivery Partner

    %% Workflow A
    Note over Merchant,DB: Workflow A: Inventory Restocking
    Merchant->>Web: Updates stock quantity for Store 1 product
    Web->>API: PATCH /inventory/:productId (RESTOCK)
    API->>DB: Increments availableQty, logs InventoryMovement
    DB-->>Web: Returns updated inventory level

    %% Workflow B & C
    Note over Customer,DB: Workflow B & C: Customer Browses, Adds to Cart & Places Order
    Customer->>Web: Adds items to cart, selects address, chooses Test Payment
    Web->>API: POST /orders/checkout
    activate API
    API->>DB: [ATOMIC TX] Verify stock, decrement inventory, create Order (#PRN-...)
    DB-->>API: Order created with status: PENDING
    API->>DB: Record Payment (TEST_PAYMENT / COMPLETED)
    deactivate API
    API-->>Web: Order confirmation screen & tracking link

    %% Workflow D
    Note over Merchant,DB: Workflow D: Merchant Prepares Order
    Merchant->>Web: Opens Merchant Dashboard, sees incoming PENDING order
    Merchant->>Web: Clicks "Accept Order" -> status: CONFIRMED
    Merchant->>Web: Clicks "Mark Prepared" -> status: PREPARING -> READY_FOR_PICKUP
    Web->>API: PATCH /orders/:id/status
    API->>DB: Updates order status history

    %% Workflow E
    Note over Admin,DB: Workflow E: Admin Dispatches Rider
    Admin->>Web: Opens Admin Dashboard, sees READY_FOR_PICKUP order
    Admin->>Web: Assigns order to Amit Kumar (deliverypartner@gmail.com)
    Web->>API: POST /admin/dispatch
    API->>DB: Creates DeliveryAssignment, updates order to ASSIGNED

    %% Workflow F
    Note over Rider,Customer: Workflow F: Delivery Partner Doorstep Fulfillment
    Rider->>Web: Opens Rider Portal, sees assigned delivery
    Rider->>Web: Clicks "Pick Up Parcel" -> status: PICKED_UP
    Rider->>Web: Clicks "Out for Delivery" -> status: OUT_FOR_DELIVERY
    Rider->>Web: Clicks "Complete Handover" -> status: DELIVERED
    Web->>API: PATCH /delivery/:id/status
    API->>DB: Sets order status to DELIVERED, records deliveredAt timestamp
    API-->>Customer: Live tracking updates to DELIVERED with green checkmark

    %% Workflow G
    Note over Customer,Admin: Workflow G: Real-Time State & Timeline Persistence
    Customer->>Web: Refreshes page at any time
    Web->>API: GET /orders/:id/track
    API->>DB: Fetches complete statusHistory timeline
    DB-->>Web: Renders full milestone history from order placement to delivery
```

---

## 2. Automated Test Execution Evidence

All business paths and role access boundaries are validated with the automated test suite in [`scripts/test-e2e.ts`](file:///c:/Users/jaind/Projects/PRERNA/scripts/test-e2e.ts).

### Test Results Summary: **32 Passed, 0 Failed (100% Pass Rate)**

| Category | Test Case | Expected Behavior | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & RBAC** | Customer Login | Valid credentials return JWT token and role `CUSTOMER` | **PASS** | Access token received |
| **Auth & RBAC** | Shopkeeper Login | Valid credentials return JWT token and role `SHOPKEEPER` | **PASS** | Access token received |
| **Auth & RBAC** | Delivery Partner Login | Valid credentials return JWT token and role `DELIVERY_PARTNER` | **PASS** | Access token received |
| **Auth & RBAC** | Admin Login | Valid credentials return JWT token and role `ADMIN` | **PASS** | Access token received |
| **Auth & RBAC** | Customer Admin Barrier | Customer calling `/admin/metrics` is rejected | **PASS** | HTTP 403 Forbidden |
| **Auth & RBAC** | Customer Merchant Barrier | Customer calling `/shopkeeper/dashboard` is rejected | **PASS** | HTTP 403 Forbidden |
| **Catalog** | Search `?q=milk` | Real search against PostgreSQL products table | **PASS** | 9 matching products |
| **Inventory** | Negative Stock Guard | Deducting stock below 0 must be rejected | **PASS** | HTTP 400 Bad Request |
| **Store Security** | Store Ownership Isolation | Shopkeeper 2 modifying Store 1 inventory is rejected | **PASS** | HTTP 403 Forbidden |
| **Cart** | Database-Backed Cart | Adding items persists to database cart across sessions | **PASS** | Calculated server-side |
| **Concurrency** | Race Condition on Stock | Two customers buying last 1 item simultaneously | **PASS** | 1 succeeds, 1 rejected, stock = 0 |
| **Order Machine** | Invalid State Jump | Jumping from `PENDING` directly to `DELIVERED` | **PASS** | HTTP 400 Bad Request |
| **Order Machine** | Merchant Progression | `PENDING` -> `CONFIRMED` -> `PREPARING` -> `READY` | **PASS** | Database transitions saved |
| **Dispatch** | Admin Rider Assignment | Order transitions to `ASSIGNED` with rider relation | **PASS** | Assignment created |
| **Delivery Guard** | Unassigned Rider Access | Rider B attempting to update Rider A's parcel | **PASS** | HTTP 403 Forbidden |
| **Delivery** | Doorstep Handover | Rider completes `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED` | **PASS** | Final status DELIVERED |
| **Audit Logs** | Platform Auditing | Lifecycle events recorded in administrative audit log | **PASS** | Verified in DB |
