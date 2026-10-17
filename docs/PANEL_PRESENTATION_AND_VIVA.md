# 🎓 Prerna Store — Examination Panel Presentation & Viva Q&A Guide

## 1. 7–10 Minute Live Panel Demonstration Script

### ⏱️ Minute 0:00 – 1:30: Project Introduction & Architecture
- **Opening**: "Good morning respected professors and panel members. Today we present **Prerna Store**, a hyper-local, Blinkit-style quick-commerce grocery platform engineered to deliver groceries within 15 minutes."
- **Architecture Highlight**: "Prerna Store is built on an enterprise monorepo using **Next.js 14 App Router** for the client storefront, **NestJS** for a modular, type-safe RESTful API, and **PostgreSQL with Prisma ORM** for ACID-compliant transactional consistency."
- **Point to**: Show Swagger API at `http://localhost:4001/api/docs` and live Storefront at `http://localhost:3000`.

### ⏱️ Minute 1:30 – 3:30: Customer Workflow & 208-Product Catalog
- **Storefront**: Show the 208 realistic grocery products across 14 categories (Dairy, Fresh Fruits, Spices, Bakery).
- **Search & Filter**: Search `milk` or `bread`, showing instant PostgreSQL-backed search results with realistic INR prices.
- **Login as Customer**: Click **Customer** (`customer@gmail.com` / `2026@prerna`).
- **Cart & Checkout**:
  - Add 2 items to the cart.
  - Open cart slide-over; note that quantities and subtotals are calculated on the backend.
  - Proceed to checkout, select delivery address, choose **Test Online Payment**, and click **Place Order**.
  - **Explain**: "At this exact moment, an atomic PostgreSQL transaction verified stock availability and reserved the items, preventing negative inventory." Show newly created Order `#PRN-...` in status `PENDING`.

### ⏱️ Minute 3:30 – 5:00: Merchant (Shopkeeper) Order Fulfillment
- **Login as Merchant**: Switch to **Merchant** (`merchant@gmail.com` / `2026@prerna`).
- **Dashboard**: Show that the merchant sees the customer's new incoming order for **Sunrise Fresh Market**.
- **Action**:
  - Click **Accept Order** (`CONFIRMED`).
  - Click **Start Packing** (`PREPARING`).
  - Click **Mark Ready for Pickup** (`READY_FOR_PICKUP`).
- **Inventory Check**: Show that stock for the ordered item has decremented correctly in the merchant inventory table.

### ⏱️ Minute 5:00 – 6:30: Admin Dispatch & Rider Assignment
- **Login as Admin**: Switch to **Admin** (`admin@gmail.com` / `2026@prerna`).
- **Metrics**: Show live platform metrics: Total Revenue, Total Orders, Active Stores, and Audit Log count.
- **Dispatch**: Locate the `READY_FOR_PICKUP` order and dispatch it to rider **Amit Kumar** (`deliverypartner@gmail.com`). Status moves to `ASSIGNED`.

### ⏱️ Minute 6:30 – 8:00: Delivery Partner Doorstep Handover
- **Login as Rider**: Switch to **Delivery Rider** (`deliverypartner@gmail.com` / `2026@prerna`).
- **Rider Portal**: Show the assigned order details and store pickup location.
- **Action**:
  - Click **Pick Up Order** (`PICKED_UP`).
  - Click **Out for Delivery** (`OUT_FOR_DELIVERY`).
  - Click **Confirm Delivery Handover** (`DELIVERED`).
- **Customer Verification**: Switch back to Customer view; show the live order timeline marked `DELIVERED` with green checkmarks.

### ⏱️ Minute 8:00 – 10:00: Codebase Verification & Q&A Transition
- **Run Automated Tests**: Open terminal and run `npx tsx scripts/test-e2e.ts`.
- **Show Result**: "All 32 automated tests covering authentication, RBAC, stock concurrency, and state transitions pass with 100% success."
- **Concluding Statement**: "We are now ready for your questions."

---

## 2. University Viva Questions & Model Answers

### Q1: Why did you choose a separate NestJS backend instead of handling everything inside Next.js API routes?
**Answer**: "A dedicated NestJS backend provides true enterprise separation of concerns. NestJS utilizes a modular architecture with Dependency Injection, custom Guards for Role-Based Access Control, standard Exception Filters, and automatic Swagger OpenAPI generation. This ensures our business logic, inventory validation, and state machine transitions remain completely isolated from UI rendering and can scale independently."

### Q2: How does Prerna Store prevent race conditions when two customers buy the last available item simultaneously?
**Answer**: "We enforce atomic concurrency control using Prisma's interactive transactions (`prisma.$transaction`). Inside the transaction, we read the current `availableQty`, verify that it is greater than or equal to the requested quantity, and decrement it in the same atomic block. If two requests arrive concurrently, PostgreSQL serializes the row updates; the first transaction succeeds, while the second encounters insufficient stock and triggers a rollback, throwing an HTTP 400 Bad Request without allowing negative inventory."

### Q3: What is the difference between Authentication and Authorization in your system?
**Answer**: "Authentication verifies *who* the user is, implemented using Bcrypt password comparison and signed JSON Web Tokens (JWT). Authorization determines *what* that user is permitted to do, implemented using our custom NestJS `RolesGuard` and `@Roles()` decorator. For example, a customer is authenticated, but if they attempt to call `/api/v1/admin/metrics`, the `RolesGuard` extracts their role claim from the JWT, recognizes they lack `Role.ADMIN`, and rejects the request with HTTP 403 Forbidden."

### Q4: How is sensitive data protected? Are database credentials exposed to the frontend?
**Answer**: "No database credentials or secret keys are ever exposed to the frontend. All environment secrets (`DATABASE_URL`, `JWT_SECRET`) reside exclusively on the server in `.env`. The frontend only communicates with the backend over HTTP via `NEXT_PUBLIC_API_URL`. Passwords are encrypted before database insertion using Bcrypt with 10 salt rounds; plaintext passwords are never stored."

### Q5: Why do you store `productName` and `unitPrice` redundantly in `OrderItem` when they already exist in `Product`?
**Answer**: "This is deliberate database denormalization for financial snapshotting and data integrity. If a merchant updates a product's price or description tomorrow, historical orders must reflect the exact price the customer agreed to pay at the time of purchase. Storing the price and name snapshot directly inside `OrderItem` guarantees financial auditability."

### Q6: What happens if a shopkeeper tries to edit another store's inventory?
**Answer**: "Our `InventoryService` enforces store ownership authorization. When a shopkeeper attempts an inventory update, the backend queries `StoreStaff` to verify that the authenticated `userId` from the JWT token is mapped to the `storeId` of the target product. If there is a mismatch, the backend immediately throws an HTTP 403 Forbidden exception."

### Q7: What are the 8 stages in your order state machine? Can a user skip steps?
**Answer**: "The 8 stages are: `PENDING` -> `CONFIRMED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `ASSIGNED` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`. The backend validates all status changes against a transition map; jumping from `PENDING` directly to `DELIVERED` is strictly blocked and returns an HTTP 400 Bad Request."

### Q8: How did you implement client state management?
**Answer**: "We utilized Zustand for client state (`useAuthStore` and `useCartStore`). Zustand offers a minimalistic, boilerplate-free alternative to Redux that supports localStorage persistence. When a customer refreshes the browser, their JWT token and active cart are automatically hydrated without redundant API calls."

### Q9: How do you verify that 200+ distinct products actually exist in the database?
**Answer**: "Our seeder script imports 208 curated grocery items from `prisma/catalog-data.ts`. We verify this by running `npx tsx scripts/verify-panel-accounts.ts`, which queries `prisma.product.count()` directly against PostgreSQL and queries the `/api/v1/products?limit=250` endpoint, confirming 209 active items."

### Q10: How would you scale Prerna Store if production order volume increased 100x?
**Answer**: "Because our NestJS API is stateless (using JWTs rather than server-side session stores), we can horizontally scale multiple NestJS instances behind an Nginx or AWS Application Load Balancer. For the database, we would introduce Read Replicas for high-volume catalog queries (`GET /products`), utilize Redis for caching hot categories and search results, and use RabbitMQ or Redis BullMQ for asynchronous order processing and rider notifications."
