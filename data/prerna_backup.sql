--
-- PostgreSQL database dump
--

\restrict sipACUKzApStmRBqavRoSEicIBTw8UatdtjQSSpkBsXDhCcP9qCESaW8ZDLVSVC

-- Dumped from database version 15.19 (Debian 15.19-1.pgdg13+2)
-- Dumped by pg_dump version 15.19 (Debian 15.19-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: prerna
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."DeliveryStatus" OWNER TO prerna;

--
-- Name: InventoryMovementType; Type: TYPE; Schema: public; Owner: prerna
--

CREATE TYPE public."InventoryMovementType" AS ENUM (
    'RESTOCK',
    'ORDER_RESERVE',
    'ORDER_CANCEL',
    'ADJUSTMENT'
);


ALTER TYPE public."InventoryMovementType" OWNER TO prerna;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: prerna
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO prerna;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: prerna
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'COD',
    'TEST_PAYMENT'
);


ALTER TYPE public."PaymentMethod" OWNER TO prerna;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: prerna
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO prerna;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: prerna
--

CREATE TYPE public."Role" AS ENUM (
    'CUSTOMER',
    'SHOPKEEPER',
    'DELIVERY_PARTNER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO prerna;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text DEFAULT 'Home'::text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "postalCode" text NOT NULL,
    latitude double precision,
    longitude double precision,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "addressType" text DEFAULT 'HOME'::text,
    "buildingName" text,
    colony text,
    "deliveryInstructions" text,
    "houseNumber" text,
    landmark text
);


ALTER TABLE public."Address" OWNER TO prerna;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "previousState" text,
    "newState" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO prerna;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO prerna;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO prerna;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO prerna;

--
-- Name: DeliveryAssignment; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."DeliveryAssignment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "deliveryPartnerId" text NOT NULL,
    status public."DeliveryStatus" DEFAULT 'ASSIGNED'::public."DeliveryStatus" NOT NULL,
    "currentLat" double precision,
    "currentLng" double precision,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pickedUpAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryAssignment" OWNER TO prerna;

--
-- Name: DeliveryPartner; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."DeliveryPartner" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "vehicleType" text DEFAULT 'Motorcycle'::text,
    "vehicleNumber" text,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "currentLat" double precision,
    "currentLng" double precision,
    "lastLocationAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryPartner" OWNER TO prerna;

--
-- Name: DeliveryStatusHistory; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."DeliveryStatusHistory" (
    id text NOT NULL,
    "assignmentId" text NOT NULL,
    status public."DeliveryStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DeliveryStatusHistory" OWNER TO prerna;

--
-- Name: DriverLocation; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."DriverLocation" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    heading double precision DEFAULT 0,
    speed double precision DEFAULT 0
);


ALTER TABLE public."DriverLocation" OWNER TO prerna;

--
-- Name: DriverLocationHistory; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."DriverLocationHistory" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "orderId" text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    heading double precision DEFAULT 0,
    speed double precision DEFAULT 0,
    "batteryStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DriverLocationHistory" OWNER TO prerna;

--
-- Name: Inventory; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Inventory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "availableQty" integer DEFAULT 0 NOT NULL,
    "reservedQty" integer DEFAULT 0 NOT NULL,
    "lowStockThreshold" integer DEFAULT 10 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Inventory" OWNER TO prerna;

--
-- Name: InventoryMovement; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."InventoryMovement" (
    id text NOT NULL,
    "inventoryId" text NOT NULL,
    quantity integer NOT NULL,
    type public."InventoryMovementType" NOT NULL,
    reason text,
    "referenceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InventoryMovement" OWNER TO prerna;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    type text,
    data text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO prerna;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "customerId" text NOT NULL,
    "storeId" text NOT NULL,
    "addressId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod" DEFAULT 'COD'::public."PaymentMethod" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    subtotal double precision NOT NULL,
    "deliveryFee" double precision DEFAULT 25.0 NOT NULL,
    tax double precision DEFAULT 0.0 NOT NULL,
    discount double precision DEFAULT 0.0 NOT NULL,
    total double precision NOT NULL,
    "specialInstructions" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO prerna;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "productName" text NOT NULL,
    "unitPrice" double precision NOT NULL,
    quantity integer NOT NULL,
    subtotal double precision NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO prerna;

--
-- Name: OrderStatusHistory; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."OrderStatusHistory" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    "changedById" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderStatusHistory" OWNER TO prerna;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    email text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO prerna;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    method public."PaymentMethod" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    amount double precision NOT NULL,
    "transactionRef" text,
    "rawResponse" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO prerna;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "storeId" text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price double precision NOT NULL,
    mrp double precision NOT NULL,
    unit text DEFAULT '1 unit'::text NOT NULL,
    sku text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO prerna;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO prerna;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO prerna;

--
-- Name: Store; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."Store" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "postalCode" text NOT NULL,
    phone text,
    email text,
    "bannerUrl" text,
    "logoUrl" text,
    rating double precision DEFAULT 4.8 NOT NULL,
    latitude double precision DEFAULT 28.4595,
    longitude double precision DEFAULT 77.0266,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deliveryRadiusKm" double precision DEFAULT 10.0
);


ALTER TABLE public."Store" OWNER TO prerna;

--
-- Name: StoreStaff; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."StoreStaff" (
    id text NOT NULL,
    "storeId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'MANAGER'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StoreStaff" OWNER TO prerna;

--
-- Name: User; Type: TABLE; Schema: public; Owner: prerna
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    phone text,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO prerna;

--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Address" (id, "userId", label, street, city, state, "postalCode", latitude, longitude, "isDefault", "createdAt", "updatedAt", "addressType", "buildingName", colony, "deliveryInstructions", "houseNumber", landmark) FROM stdin;
cc0c503a-5c43-4131-8155-a383741eab3c	b09cf1b7-d197-4264-b32a-e22ffda3ee6f	Home	Flat 402, Sunshine Heights, Sector 14, Gurgaon	Gurugram	Haryana	122001	\N	\N	t	2026-10-19 18:37:52.607	2026-10-19 18:37:52.607	HOME	\N	\N	\N	\N	\N
fb49fb18-b0c5-449e-895b-0b2dd14fcc0f	70ee4ac9-dec0-4d90-a3dd-3002c24fc33a	Home	B-12, Green Park Main, New Delhi	Gurugram	Haryana	122001	\N	\N	t	2026-10-19 18:37:52.615	2026-10-19 18:37:52.615	HOME	\N	\N	\N	\N	\N
5adb22b6-2d3d-4467-b25a-088c78a1280a	7532cd02-bc66-44ee-a3b0-66b75cecaa7d	Home	Plot 45, DLF Phase 2, Gurgaon	Gurugram	Haryana	122001	\N	\N	t	2026-10-19 18:37:52.622	2026-10-19 18:37:52.622	HOME	\N	\N	\N	\N	\N
fdd051ce-7499-477f-a5aa-3a19889aee4e	235dbf4c-9127-4a13-af49-e5b831692de0	Home	Flat 101, Palm Grove, Noida Sector 62	Gurugram	Haryana	122001	\N	\N	t	2026-10-19 18:37:52.629	2026-10-19 18:37:52.629	HOME	\N	\N	\N	\N	\N
de7b9bbc-a16c-4d09-96dd-8b93c236630e	8e47de19-da0b-4c34-a0dd-3a8f8cf44b04	Home	C-7, Indirapuram, Ghaziabad	Gurugram	Haryana	122001	\N	\N	t	2026-10-19 18:37:52.634	2026-10-19 18:37:52.634	HOME	\N	\N	\N	\N	\N
04edcaf7-ab7f-4b15-b118-3b4d557bf3ec	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Home	Flat 502, DLF Cyber City Towers, Sector 25	Gurugram	Haryana	122002	\N	\N	f	2026-10-19 18:37:52.641	2026-10-19 19:38:00.724	HOME	\N	\N	\N	\N	\N
40056614-6135-48bf-9597-3b4d5c12501b	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Office	Unit 401, Tech Horizon Park, Golf Course Road	Gurugram	Haryana	122003	\N	\N	f	2026-10-19 18:37:52.641	2026-10-19 19:38:00.724	HOME	\N	\N	\N	\N	\N
8d923f00-c3d4-4888-b18d-ab721254d8ed	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Home	A-2 ANUPAM NAGAR ,NEAR SOPIA SCHOOL\nNEAR CANARA BANK JAIPUR ROAD AJMER	Gurugram	Haryana	122001	\N	\N	t	2026-10-19 19:38:00.765	2026-10-19 19:38:00.765	HOME	\N	\N	\N	\N	\N
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."AuditLog" (id, "userId", action, "entityType", "entityId", "previousState", "newState", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Cart" (id, "userId", "createdAt", "updatedAt") FROM stdin;
c03dfeec-12d3-468e-87c3-e1f1f2afaa50	b09cf1b7-d197-4264-b32a-e22ffda3ee6f	2026-10-19 18:37:52.607	2026-10-19 18:37:52.607
5a80bf64-122b-4642-835f-6d3520f75214	70ee4ac9-dec0-4d90-a3dd-3002c24fc33a	2026-10-19 18:37:52.615	2026-10-19 18:37:52.615
cd2b4835-2a03-49db-bb41-529d6aef041a	7532cd02-bc66-44ee-a3b0-66b75cecaa7d	2026-10-19 18:37:52.622	2026-10-19 18:37:52.622
a23000bd-3a2a-46bc-9ae5-12aa0c4b29e7	235dbf4c-9127-4a13-af49-e5b831692de0	2026-10-19 18:37:52.629	2026-10-19 18:37:52.629
b0597e6c-1f5f-475e-9210-33fb330450c1	8e47de19-da0b-4c34-a0dd-3a8f8cf44b04	2026-10-19 18:37:52.634	2026-10-19 18:37:52.634
f8e007f1-d8c2-4622-97ed-9fb848ebc7d4	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-19 18:37:52.641	2026-10-19 18:37:52.641
115580a0-b998-4302-a433-8bfefafba391	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-19 19:38:08.032	2026-10-19 19:38:08.032
fc5677d6-c303-4e66-bcd2-c912ed3dfb91	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-19 19:38:33.373	2026-10-19 19:38:33.373
daa3b0a8-9450-4824-a079-ff325e5aac38	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-20 04:14:06.997	2026-10-20 04:14:06.997
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."CartItem" (id, "cartId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
39e35f6f-b037-4ebd-9e3e-1c9063e57908	115580a0-b998-4302-a433-8bfefafba391	243e32da-8600-4fe2-94cd-50c65a022a4c	2	2026-10-23 15:14:23.779	2026-10-23 15:14:24.143
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Category" (id, name, slug, description, "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
1474106f-d095-43a6-9912-5a1abde4d8da	Fresh Fruits	fresh-fruits	Sweet, juicy and farm-picked fresh fruits	https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80	t	1	2026-10-19 18:37:52.663	2026-10-19 18:37:52.663
43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Vegetables	fresh-vegetables	Crisp green farm-fresh veggies	https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80	t	2	2026-10-19 18:37:52.665	2026-10-19 18:37:52.665
8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Dairy, Bread & Eggs	dairy-breakfast	Milk, butter, paneer, curd, fresh breads & farm eggs	https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80	t	3	2026-10-19 18:37:52.666	2026-10-19 18:37:52.666
63c0bb5c-7c15-4952-90db-d101d12bc1cd	Bakery & Breads	bakery-breads	Fresh oven breads, buns, croissants and cookies	https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80	t	4	2026-10-19 18:37:52.668	2026-10-19 18:37:52.668
c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Atta, Rice & Dal	atta-rice-dal	Whole wheat flour, basmati rice, pulses & grains	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80	t	5	2026-10-19 18:37:52.67	2026-10-19 18:37:52.67
7559014f-ee25-454b-b263-1109fd55aa5b	Cooking Oils & Ghee	cooking-oils-ghee	Refined sunflower oils, mustard oil, and pure desi ghee	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80	t	6	2026-10-19 18:37:52.671	2026-10-19 18:37:52.671
4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Masalas & Spices	masalas-spices	Pure ground spices, whole garam masalas & salts	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80	t	7	2026-10-19 18:37:52.672	2026-10-19 18:37:52.672
c99c2fef-e49d-48dd-aa8e-713b955eb610	Snacks & Munchies	snacks-munchies	Chips, namkeen, roasted nuts & savory bites	https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=400&q=80	t	8	2026-10-19 18:37:52.673	2026-10-19 18:37:52.673
1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Cold Drinks & Juices	cold-drinks-juices	Refreshing sodas, juices, and cold coolers	https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80	t	9	2026-10-19 18:37:52.674	2026-10-19 18:37:52.674
1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Tea, Coffee & Drinks	tea-coffee-health	Assam tea, instant coffee, and chocolate health drinks	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80	t	10	2026-10-19 18:37:52.676	2026-10-19 18:37:52.676
40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Instant & Frozen Foods	instant-foods	Noodles, pasta, ready meals & frozen peas	https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80	t	11	2026-10-19 18:37:52.677	2026-10-19 18:37:52.677
d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Biscuits & Cookies	biscuits-cookies	Glucose biscuits, butter cookies & cream treats	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80	t	12	2026-10-19 18:37:52.678	2026-10-19 18:37:52.678
fd456cf9-aea2-48fd-8637-2312b672b412	Personal Care	personal-care	Soaps, shampoos, toothpaste, lotions & grooming	https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80	t	13	2026-10-19 18:37:52.679	2026-10-19 18:37:52.679
0f8f596d-bf6f-4fe2-8946-612c733a9d41	Household & Cleaning	household-cleaning	Detergent powders, floor cleaners & dishwash liquids	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80	t	14	2026-10-19 18:37:52.68	2026-10-19 18:37:52.68
\.


--
-- Data for Name: DeliveryAssignment; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."DeliveryAssignment" (id, "orderId", "deliveryPartnerId", status, "currentLat", "currentLng", "assignedAt", "pickedUpAt", "deliveredAt", notes, "createdAt", "updatedAt") FROM stdin;
2cf86776-4bb9-4958-aa47-a8e467f8c5a8	fdd9f347-a831-4b1a-92c2-df7a49d29e19	b2d08fdb-4b42-4c6d-875f-2515d11a9f3a	DELIVERED	\N	\N	2026-10-19 15:48:53.807	2026-10-19 15:52:53.807	2026-10-19 16:05:53.807	\N	2026-10-19 18:37:53.809	2026-10-19 18:37:53.809
3aa14429-be3a-4cec-8b1d-73a65d58bf3b	95cd705b-9570-47ed-af39-41ff04e6a1ec	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.4595	77.0266	2026-10-19 19:38:19.291	2026-10-19 19:38:19.98	2026-10-19 19:38:20.871	\N	2026-10-19 19:38:19.293	2026-10-19 19:38:20.873
30e2dcc1-6987-4495-a4d6-297cf14c56c7	8a2d5719-341d-4b98-a62d-2a8a392b28a1	00c32926-47ed-4ee2-bb41-664520ff44cc	OUT_FOR_DELIVERY	28.24556119552049	76.81286507355928	2026-10-20 23:51:17.971	2026-10-20 23:51:36.672	\N	\N	2026-10-20 23:51:17.972	2026-10-23 15:19:38.477
1fdfc6c9-f8c4-4270-8d86-4ed97a099669	e813102e-1581-4e12-8ee4-32526adadaad	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.3123800914171	76.88059617376271	2026-10-20 01:56:15.853	2026-10-20 01:56:19.195	2026-10-20 01:56:29.088	\N	2026-10-20 01:56:15.854	2026-10-20 01:56:29.09
3c816f50-73ee-4dda-bc9a-9b91108cd12e	3d8f9363-4e76-48af-bafb-5f7eb64571ed	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.3123800914171	76.88059617376271	2026-10-19 19:38:21.776	2026-10-19 19:38:22.452	2026-10-20 01:56:38.338	\N	2026-10-19 19:38:21.778	2026-10-20 01:56:38.34
f4671369-9045-4103-899a-80b06ba87a14	2a432ae1-f9a5-40df-89f1-bebac422b4e7	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.3123800914171	76.88059617376271	2026-10-20 02:42:55.165	2026-10-20 02:43:07.084	2026-10-20 02:43:15.283	\N	2026-10-20 02:42:55.167	2026-10-20 02:43:15.284
1c46240a-1683-48c1-94b5-a8d3886bcf10	cbed899d-a070-4f94-987e-300169f94f33	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.24541914473845	76.81294726821115	2026-10-20 02:43:16.626	2026-10-20 02:49:30.601	2026-10-20 02:49:33.038	\N	2026-10-20 02:43:16.628	2026-10-20 02:49:33.039
4de281ee-58ae-49a5-99fc-ac18f349a094	7211dfa3-2f01-4284-a3fa-9b122cf1490d	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.24541914473845	76.81294726821115	2026-10-20 02:49:34.183	2026-10-20 02:49:34.866	2026-10-20 02:49:35.825	\N	2026-10-20 02:49:34.185	2026-10-20 02:49:35.826
bc82621d-2ffe-488f-af70-2ec665b78ed2	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.24769391365444	76.81322783283792	2026-10-21 09:27:44.001	2026-10-21 09:28:24.766	2026-10-21 09:28:55.052	\N	2026-10-21 09:27:44.003	2026-10-21 09:28:55.053
0c0d2ea4-b3fc-42f9-b564-7362ba4e7248	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	00c32926-47ed-4ee2-bb41-664520ff44cc	DELIVERED	28.24551316493947	76.81291931410327	2026-10-20 06:38:33.104	2026-10-20 06:38:53.175	2026-10-20 06:39:32.916	\N	2026-10-20 06:38:33.105	2026-10-20 06:39:32.917
\.


--
-- Data for Name: DeliveryPartner; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."DeliveryPartner" (id, "userId", "vehicleType", "vehicleNumber", "isAvailable", "currentLat", "currentLng", "lastLocationAt", "createdAt", "updatedAt") FROM stdin;
b2d08fdb-4b42-4c6d-875f-2515d11a9f3a	e5a7ff9c-0a5a-4e61-a120-c4aa49e8baee	Two Wheeler	Hero Splendor (DL 04 AB 1234)	t	\N	\N	\N	2026-10-19 18:37:52.573	2026-10-19 18:37:52.573
bf778f88-ed13-4b52-a382-cf348dec8b11	cb274aab-da3a-4ec9-a330-96c8658d5d79	Two Wheeler	Honda Activa (DL 05 CD 5678)	t	\N	\N	\N	2026-10-19 18:37:52.584	2026-10-19 18:37:52.584
72590b6e-db38-4861-8877-b9fbdf54fd8b	adc3435d-39f1-4e1d-b290-977e41c63f4c	Two Wheeler	Bajaj Pulsar (DL 08 EF 9012)	t	\N	\N	\N	2026-10-19 18:37:52.588	2026-10-19 18:37:52.588
ec2d6c23-dadc-4645-bb67-ead8c48a65f8	eb184b6a-a09c-42c7-ba82-056652ef6100	Two Wheeler	TVS Jupiter (DL 03 GH 3456)	t	\N	\N	\N	2026-10-19 18:37:52.593	2026-10-19 18:37:52.593
d42aa10c-c14c-426e-9854-cb844a13d27a	092a7c69-0963-467f-b613-1193d0dc06f1	Two Wheeler	Ather 450X (DL 09 IJ 7890)	t	\N	\N	\N	2026-10-19 18:37:52.598	2026-10-19 18:37:52.598
00c32926-47ed-4ee2-bb41-664520ff44cc	11df1583-048f-4692-99cf-cb05179c6dfb	EV Scooter	DL 01 EX 2026	t	28.24556119552049	76.81286507355928	2026-10-23 15:19:38.473	2026-10-19 18:37:52.602	2026-10-23 15:19:38.475
\.


--
-- Data for Name: DeliveryStatusHistory; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."DeliveryStatusHistory" (id, "assignmentId", status, notes, "createdAt") FROM stdin;
bd60f83e-dda2-4d53-9978-3efaea267fb3	2cf86776-4bb9-4958-aa47-a8e467f8c5a8	ASSIGNED	Order assigned	2026-10-19 18:37:53.809
626a6f5b-d0de-4730-976a-45669d66ebb4	2cf86776-4bb9-4958-aa47-a8e467f8c5a8	PICKED_UP	Picked up from store	2026-10-19 18:37:53.809
84e2e2ae-2608-49f1-b6a3-e92ccd764423	2cf86776-4bb9-4958-aa47-a8e467f8c5a8	OUT_FOR_DELIVERY	Out for delivery	2026-10-19 18:37:53.809
f1b7eaf5-99e0-4302-9ad2-a97b1f7d90fd	2cf86776-4bb9-4958-aa47-a8e467f8c5a8	DELIVERED	Successfully handed over	2026-10-19 18:37:53.809
ec1ae2b1-0503-4439-ada4-529e0595ad22	3aa14429-be3a-4cec-8b1d-73a65d58bf3b	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-19 19:38:19.293
635591a1-2496-4b1f-8a07-9139732570a0	3aa14429-be3a-4cec-8b1d-73a65d58bf3b	PICKED_UP	Rider picked up package at store	2026-10-19 19:38:19.981
7eae37d4-7ffc-4448-a791-7e8fb89113ee	3aa14429-be3a-4cec-8b1d-73a65d58bf3b	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-19 19:38:20.479
92c1d6c9-74f3-4a97-ba36-5df937b39742	3aa14429-be3a-4cec-8b1d-73a65d58bf3b	DELIVERED	Delivered at doorstep and payment completed	2026-10-19 19:38:20.873
adc98c72-5821-459c-950a-a989a9421aca	3c816f50-73ee-4dda-bc9a-9b91108cd12e	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-19 19:38:21.778
855ea766-5cd3-4a36-96b6-bdad25dc4123	3c816f50-73ee-4dda-bc9a-9b91108cd12e	PICKED_UP	Rider picked up package at store	2026-10-19 19:38:22.454
0f90be2e-df90-4ed2-9e9f-ceb4fb080568	1fdfc6c9-f8c4-4270-8d86-4ed97a099669	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-20 01:56:15.854
8e44db75-9edf-4780-96d8-0d423acd0f52	1fdfc6c9-f8c4-4270-8d86-4ed97a099669	PICKED_UP	Rider picked up package at store	2026-10-20 01:56:19.197
81fbdbca-6477-4b0b-b8b4-2dcf8eb33c2c	1fdfc6c9-f8c4-4270-8d86-4ed97a099669	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 01:56:23.386
e6e292de-58e1-4817-b513-545a859a0d03	1fdfc6c9-f8c4-4270-8d86-4ed97a099669	DELIVERED	Delivered at doorstep and payment completed	2026-10-20 01:56:29.09
ba0347cd-92c5-49f1-a03d-6368b3d885cf	3c816f50-73ee-4dda-bc9a-9b91108cd12e	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 01:56:33.682
55bdf064-1113-4307-9c55-509abebc92bc	3c816f50-73ee-4dda-bc9a-9b91108cd12e	DELIVERED	Delivered at doorstep and payment completed	2026-10-20 01:56:38.34
73dd2e4a-0ec3-464a-a9f2-69d26fa1c212	f4671369-9045-4103-899a-80b06ba87a14	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-20 02:42:55.167
6c64816a-7abe-4764-8636-b5ae06117449	f4671369-9045-4103-899a-80b06ba87a14	PICKED_UP	Rider picked up package at store	2026-10-20 02:43:07.086
b3349266-52e0-43f4-b56b-9248b4910579	f4671369-9045-4103-899a-80b06ba87a14	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 02:43:08.132
c626fe11-75ee-4f40-9e09-92124f2817e1	f4671369-9045-4103-899a-80b06ba87a14	DELIVERED	Delivered at doorstep and payment completed	2026-10-20 02:43:15.284
7b302aec-8f15-4b6a-b654-5ee4ffdb5ec7	1c46240a-1683-48c1-94b5-a8d3886bcf10	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-20 02:43:16.628
09585bc0-71c2-42a3-a30a-bf98fb0a81b6	1c46240a-1683-48c1-94b5-a8d3886bcf10	PICKED_UP	Rider picked up package at store	2026-10-20 02:49:30.603
6ada3c95-63ea-4c6a-904a-5d0c6a047746	1c46240a-1683-48c1-94b5-a8d3886bcf10	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 02:49:32.347
c1c6e048-7d0b-40dc-94e1-757e462d6ab3	1c46240a-1683-48c1-94b5-a8d3886bcf10	DELIVERED	Delivered at doorstep and payment completed	2026-10-20 02:49:33.039
3be6aae4-c59a-4d1a-8e6f-934d9dee2a11	4de281ee-58ae-49a5-99fc-ac18f349a094	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-20 02:49:34.185
f2e5101a-c4a6-4ea5-ac3d-68e0ec462aee	4de281ee-58ae-49a5-99fc-ac18f349a094	PICKED_UP	Rider picked up package at store	2026-10-20 02:49:34.868
7219b755-2595-4195-9416-10d2b745ccda	4de281ee-58ae-49a5-99fc-ac18f349a094	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 02:49:35.353
fb6d2df2-e0cc-4bcf-9776-fabf783ecc34	4de281ee-58ae-49a5-99fc-ac18f349a094	DELIVERED	Delivered at doorstep and payment completed	2026-10-20 02:49:35.826
b220d488-5f40-49b7-a1e4-0e7cfa66a2f5	0c0d2ea4-b3fc-42f9-b564-7362ba4e7248	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-20 06:38:33.105
5cbc33ad-cb2b-4f45-8367-fc3d960335e8	0c0d2ea4-b3fc-42f9-b564-7362ba4e7248	PICKED_UP	Rider picked up package at store	2026-10-20 06:38:53.176
14dbb93f-ba09-4465-aeef-3e2851dd4a2d	0c0d2ea4-b3fc-42f9-b564-7362ba4e7248	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 06:39:00.124
855902d8-5901-4e8d-aa37-f9331b665ff0	0c0d2ea4-b3fc-42f9-b564-7362ba4e7248	DELIVERED	Delivered with OTP 9447	2026-10-20 06:39:32.917
0268abd1-143d-4560-af51-f8f4dd60e04b	30e2dcc1-6987-4495-a4d6-297cf14c56c7	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-20 23:51:17.972
9671a917-f102-475f-a12a-c425f31d900b	30e2dcc1-6987-4495-a4d6-297cf14c56c7	PICKED_UP	Rider picked up package at store	2026-10-20 23:51:36.673
9f9a10f6-2f91-4a12-af6b-df02040a6427	30e2dcc1-6987-4495-a4d6-297cf14c56c7	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-20 23:51:37.688
efe45f79-ee2e-4fe8-8466-73cd2fb83205	bc82621d-2ffe-488f-af70-2ec665b78ed2	ASSIGNED	Accepted by rider Prerna Panel Delivery Partner	2026-10-21 09:27:44.003
866d55cc-8ddb-43df-8bcd-539c2238c2d7	bc82621d-2ffe-488f-af70-2ec665b78ed2	PICKED_UP	Rider picked up package at store	2026-10-21 09:28:24.768
50a3fd25-4bb3-4d53-8521-25c950b6141f	bc82621d-2ffe-488f-af70-2ec665b78ed2	OUT_FOR_DELIVERY	Rider on way to doorstep	2026-10-21 09:28:26.26
4e3e04e5-033a-443a-a06d-b7bc2d025262	bc82621d-2ffe-488f-af70-2ec665b78ed2	DELIVERED	Delivered with OTP 3063	2026-10-21 09:28:55.053
\.


--
-- Data for Name: DriverLocation; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."DriverLocation" (id, "driverId", latitude, longitude, "updatedAt", heading, speed) FROM stdin;
\.


--
-- Data for Name: DriverLocationHistory; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."DriverLocationHistory" (id, "driverId", "orderId", latitude, longitude, heading, speed, "batteryStatus", "createdAt") FROM stdin;
9a5b0ce1-386e-46cd-8bc5-33d85b91443a	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24529292833387	76.81307375506425	0	0	\N	2026-10-20 06:38:33.573
9620efc4-d464-4c0f-b883-e53612fc74b0	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24529292833387	76.81307375506425	0	0	\N	2026-10-20 06:38:40.004
e9f2d17b-6157-43d6-92dc-981fe6ea8f73	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24529292833387	76.81307375506425	0	0	\N	2026-10-20 06:38:41.212
9d3348bd-2da0-4a8d-8ab7-f407aef5f3c6	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24529292833387	76.81307375506425	0	0	\N	2026-10-20 06:38:41.279
0ea9cabf-67ef-42b4-8a2e-1d1df1503607	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:48.537
7228519b-639b-4756-b1f7-dac5b47d2e13	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:48.537
bd4b22a9-4635-4a02-a4b4-320d6692723d	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:48.6
ccce6ff6-f99d-490f-95ed-2746a8bd6987	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:48.643
ef17a107-f040-4d51-8dbd-9842da730e91	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:52.686
158d4ad3-63a4-4583-9e03-6adde10e3941	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:53.238
b1f6136d-cd56-4031-b327-176d3f2b4e36	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24527595698463	76.81306418215866	0	0	\N	2026-10-20 06:38:53.293
1b56af73-c8bd-496e-8939-486fb7fe363c	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:02.837
0d55fd92-b100-4d45-b2d9-7fbaf70545e1	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:04.189
dac9b1b9-cff1-4a11-93a9-38704e4c9205	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:04.284
53849697-0dcc-4393-96d7-1d3f12ddba53	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:07.458
d7ab92d3-8d9d-410d-b84c-8cd631677e46	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:08.218
aaba88a0-c626-49d4-92ac-b45c8a532123	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:09.708
321d5359-4bb5-4884-bb6f-21155661c246	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:30.798
503256e2-1740-4aee-a97b-75341a96bdde	11df1583-048f-4692-99cf-cb05179c6dfb	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:32.231
00ad558e-ceef-4cd0-808e-88bb7f9b2ca4	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24551316493947	76.81291931410327	0	0	\N	2026-10-20 06:39:32.966
eda384ec-613e-4ca3-a524-e134cb360f3e	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24540746134458	76.81294600904027	0	0	\N	2026-10-20 06:39:34.058
b5f59e95-6f92-4c42-a9a8-4bb178a3584f	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24560212781935	76.81293419283153	0	0	\N	2026-10-20 12:51:08.906
720e4a64-3ebc-464e-9341-e02205a2f811	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24560212781935	76.81293419283153	0	0	\N	2026-10-20 12:51:08.906
27127788-748c-4b09-9a28-1c387a75f9e9	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24571511002488	76.81287184534011	0	0	\N	2026-10-20 13:00:11.638
0c7ae8e7-8f00-4a04-9cab-ca8578e30973	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24547299992106	76.81290475674331	0	0	\N	2026-10-20 23:50:32.675
32f4d42e-eb6d-486c-b0f7-a3659002abac	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24537341842996	76.81297347019327	0	0	\N	2026-10-20 23:50:38.696
2a18d226-dbb8-4714-9e58-74d708530249	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24537341842996	76.81297347019327	0	0	\N	2026-10-20 23:50:38.699
5b95100c-b59b-4561-a16e-0b49bd25c563	11df1583-048f-4692-99cf-cb05179c6dfb	\N	28.24545975619164	76.81286584985612	0	0	\N	2026-10-20 23:51:16.357
a76b3788-4afd-40b0-b99e-b9ee212ffd1f	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24545975619164	76.81286584985612	0	0	\N	2026-10-20 23:51:18.045
3b3c82a0-8002-4093-85d9-cf8f7213bc0f	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24545975619164	76.81286584985612	0	0	\N	2026-10-20 23:51:18.147
6079d0d5-291b-4d2b-8f10-319a7001924a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24545975619164	76.81286584985612	0	0	\N	2026-10-20 23:51:22.123
00050e93-9930-4fb9-b92d-3b7a94c714e0	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542239136827	76.81295619546944	0	0	\N	2026-10-20 23:51:37.835
0b87c5b0-20d0-4e1e-9023-7fc74d9ffd69	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542239136827	76.81295619546944	0	0	\N	2026-10-20 23:51:42.028
c3e10102-14ab-41df-a0f6-d95ebb36e537	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542239136827	76.81295619546944	0	0	\N	2026-10-20 23:51:46.54
3d2e5293-c279-4ee9-a076-c95e15114a18	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24541171072584	76.81305803805267	0	0	\N	2026-10-21 00:09:31.304
5842a6f8-78c6-45b8-ade9-e1e13ad4410d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24541171072584	76.81305803805267	0	0	\N	2026-10-21 00:09:33.238
e2407365-df6b-4dd4-82ba-b7ba63d9efea	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24541171072584	76.81305803805267	0	0	\N	2026-10-21 00:09:33.451
cfe5bfd7-8795-47ea-9bef-aec19d79207d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24541171072584	76.81305803805267	0	0	\N	2026-10-21 00:09:37.394
350e87d2-7349-494a-a282-901532857697	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:38.937
058aee26-9131-4246-83f5-f5e5838b173b	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:38.938
006c67fb-71cc-4fa3-9ddb-c8c2a4e98441	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:41.352
3b756f2a-a6de-4b45-96e3-efe7da1f4d40	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:41.353
a4b78cab-3715-48d2-a0cf-05cabcdf70d7	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:41.431
2650a442-8bd5-4931-8674-fc3de6185085	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:41.432
f667449c-8731-4766-b73d-78a2d7606305	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:45.418
7179b7c9-b345-4874-98e1-a9ce7986025a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:52.44
de4f8349-775b-4d44-a9bf-3405d4198b15	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:53.423
492b5443-adb3-459e-b50e-fef1439adea7	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:53.468
92b53505-3415-4ea9-9543-6d899d18ba76	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:59.636
203cc65e-4b03-4d5a-8359-1cb4c670fe99	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:18:01.444
2113b482-8427-414c-a41a-d9dbf826e879	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2454758073102	76.81294342282928	0	0	\N	2026-10-21 00:18:06.73
2d74318c-e55f-4ed0-b431-55679340e009	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2454758073102	76.81294342282928	0	0	\N	2026-10-21 00:18:09.467
3ed7fe55-1cb8-4688-a037-8cb4d685dc0c	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2454758073102	76.81294342282928	0	0	\N	2026-10-21 00:18:09.514
8e8f9a39-a681-4c07-a862-2ca641447da7	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:41.159
4e13d258-714f-4416-9ae1-7db1e9f9048a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:41.159
f0bf3991-2392-45a1-9a46-b07a9dd6d29e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:42.072
2890fd9f-10d0-4bc9-b644-fc9e5f4282c4	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:42.076
41407b88-90b6-432f-880d-ac4ddb36faf7	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:42.198
d988fe3d-8f61-428b-a93e-c55be8eea7c0	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:42.203
50711af0-cc59-43a5-b06c-b3c488cb7703	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:44.188
d5b8406a-ac80-4faf-9886-5dc4aa115a2a	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:44.343
91c36e10-2c47-4d07-a6be-7d494bba2031	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:44.346
af55021b-17c6-4210-a339-546934646268	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:48.3
cc35b3b0-915c-48c5-8748-b8e04751cd0c	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24762971503329	76.81329637098496	0	0	\N	2026-10-21 09:27:48.303
3b544dda-cb54-44e6-a449-30e1023e359a	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:27:59.237
f8148530-1d1b-4ae5-8534-0c47b34f7f7d	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:27:59.239
3c0e0e0d-8abd-4410-b2df-c2fd053a9669	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:00.26
f8f162d8-3f71-4185-9599-6733e2aad06b	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:00.261
666fb628-de2a-477a-a3cb-3bdc7c46a035	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:00.353
12318c11-923d-46d5-aaf6-1d928123c791	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:00.355
3c9f8d81-2724-445e-a24b-6ef849db79de	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:04.407
12414c9f-a7d0-4d79-8f1d-d19e94978ec6	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:04.409
55e80605-7c75-4446-9325-e390f0d84ff2	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:08.514
c3bdeaf1-ddca-4b7d-8a2c-93872cf08fed	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24766502302571	76.8132708061892	0	0	\N	2026-10-21 09:28:08.516
02097128-92d1-4c0a-be44-b5e9502706c1	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:14.477
3634ce09-ba7d-46c1-8117-9fb8d7c7edb9	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:14.481
3fdb9a55-bdc7-4793-9f20-2f9ad76ccf53	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:16.375
b93c42d5-78c4-4976-a76a-5a43d02b9c75	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:16.375
01217532-bb73-4950-8138-171cdd6baa8a	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:16.455
1d44900b-a87e-4bbb-90d2-c26550c592a3	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:16.455
fe610719-084d-4bde-a567-ddde370e9b91	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:20.511
ac1b66b9-9504-47b2-97a7-d14db1b756b3	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24765732187554	76.8132513114682	0	0	\N	2026-10-21 09:28:20.511
08227b2f-3edd-4efa-baa4-ec1a816b964f	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:27.66
1ecdc454-77be-486a-968f-c59f1ac37da0	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:27.662
9c106259-6fbb-4d3d-b16b-fbcc57646293	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:33.845
a2d103ba-5d53-418e-a0d0-54a7637b19e1	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:33.847
83460683-35b5-4790-9389-9e922e983647	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:34.381
0919c96a-f6ec-4f0c-bca8-1ee1c91b2f2a	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:34.382
9b040bf6-406e-4936-bf13-5dc1012cc4b4	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:34.546
b9c6a8aa-7097-46cb-9b87-4c6cc4e16343	11df1583-048f-4692-99cf-cb05179c6dfb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	28.24769391365444	76.81322783283792	0	0	\N	2026-10-21 09:28:34.547
db26d914-631e-4603-b54c-88a7e007aec8	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2476996202076	76.8132617750645	0	0	\N	2026-10-21 09:28:55.44
3030b9f7-7c59-4916-b3b2-5867c2d60940	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2476996202076	76.8132617750645	0	0	\N	2026-10-21 09:28:55.445
401fadb4-f125-465e-928e-71fc593df87e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2476996202076	76.8132617750645	0	0	\N	2026-10-21 09:28:59.272
54790232-b717-4997-8608-d115e613d473	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2476996202076	76.8132617750645	0	0	\N	2026-10-21 09:28:59.272
d7cb388d-b09f-4873-b2e1-9413c6ec393f	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2476996202076	76.8132617750645	0	0	\N	2026-10-21 09:29:03.28
db5bb4bc-c41c-4bd3-9c5f-5fabbd893785	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2476996202076	76.8132617750645	0	0	\N	2026-10-21 09:29:03.285
0189bb1f-acd3-47d0-b0d3-1ab2ebaaf180	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24764948775924	76.81325132739718	0	0	\N	2026-10-21 09:29:09.417
a14ff5ad-0cb0-4cd8-9f6d-fd32c32cf9b2	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24764948775924	76.81325132739718	0	0	\N	2026-10-21 09:29:09.42
d8ca6f48-80cf-4ad3-8d7a-f175c8ba06c7	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24764948775924	76.81325132739718	0	0	\N	2026-10-21 09:29:11.389
e8523994-6eea-468c-8462-b7f2326d9935	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24764948775924	76.81325132739718	0	0	\N	2026-10-21 09:29:11.284
f1714737-4435-485d-8554-84ac27ea1a7e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24764948775924	76.81325132739718	0	0	\N	2026-10-21 09:29:11.289
01f755f2-c60e-4969-9d2b-9207de5a48b1	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24764948775924	76.81325132739718	0	0	\N	2026-10-21 09:29:11.39
318711e8-ca0b-40fb-b990-8bc306ab126b	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:09.293
dd203859-38e3-4694-9bf6-b18964a7e87e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:10.352
af046766-5e2d-434e-9a9d-f72596abc8d2	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:10.465
4cc47531-9355-4020-ad58-9c4b3345c143	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:14.458
f993945f-6889-44eb-a754-e1ef3ca16d93	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:18.482
eb6898cb-a6e1-4dc4-a1f5-a84580e385f9	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:22.528
5e5154a7-bd78-47f2-a9b8-4426b904ede7	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:09.297
22c3867c-52c1-4126-9a68-e64fa685ca35	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:10.353
e68ad0c8-9194-44ed-9fa8-035ca1e9bf3e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:10.466
959b7a47-1a79-440a-a32f-ddf30ff27d76	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:14.458
7e48b7d9-b09d-4e78-923f-edcddf2f8726	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24569772371345	76.8128003337119	0	0	\N	2026-10-23 15:12:18.481
de870c16-98e2-4142-af24-4bff47dd2eee	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:22.526
f660a831-34ec-48f6-b980-5d1a06d4df20	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:26.493
1002a680-e0a4-40aa-824e-a13078389ee2	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:33.031
f7b87a82-0df9-4ff9-8491-119554b7b62f	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:36.896
f4fdda0d-9cbe-48e3-8869-b597263ea411	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24574125705667	76.81267882076814	0	0	\N	2026-10-23 15:12:38.009
29b78cb8-52ca-4660-9076-a92b3b42985c	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:35.355
13f8fed2-d6aa-4973-a200-9dd1ac09e700	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:36.96
51a89fa0-356f-4c8c-b251-c1fe8162f1bf	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:37.066
76fb1418-a729-4968-84c6-b0e53da7f6b1	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:41.039
aaffa84c-1aec-44e6-a106-a8afd81e8bf4	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:45.077
7a1c2e32-26c8-4823-b7db-e7659abca772	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:26.494
1c59e714-de52-49b9-b940-b7ee346adc90	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:33.033
8a0b1cff-3b06-4a58-8731-e7b794787ade	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24581034505671	76.81261075742094	0	0	\N	2026-10-23 15:12:36.896
194aef14-7470-4695-9658-df6f1bf59290	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24574125705667	76.81267882076814	0	0	\N	2026-10-23 15:12:38.01
84b12471-494f-4c36-86d3-bb04c7f78438	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:35.376
39aa26e9-5a70-40db-a624-352fde590af4	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:36.961
55c86c2d-c1b5-4d3d-9ca9-0d67315d7c24	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:37.066
042ffd95-8e43-44f4-a39d-99910aa1cd79	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:41.04
78d09685-925b-44e5-9cfe-f09953f9a57d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24532735420132	76.81298458813927	0	0	\N	2026-10-23 15:13:45.076
a7fde0fc-da56-419e-996f-87f0f4e3e4f3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:49.113
dc6521d4-625d-4e62-9fce-4458e7942a33	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:55.703
e38aa998-c04b-4287-b14c-61acc7d2f89a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:57.082
1853b3d3-5c39-43db-8cbf-ecdffcc7ecae	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:57.168
5599af98-4d42-4b88-9a37-250be07080a5	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24543748017823	76.81292995094057	0	0	\N	2026-10-23 15:14:02.2
a6ed4014-9079-4eac-a953-60e95285719d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:49.118
8ae69795-93af-48bb-94cf-0d2472690f0e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:55.703
dc5358bf-42d0-4a09-aec4-2174063d14b3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:57.082
ff8b455e-2c8b-4dfd-a1bb-0e92f9b7f7d5	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2455334475172	76.81284997588673	0	0	\N	2026-10-23 15:13:57.168
349405a5-6bbc-49c1-88ba-23240c6e258e	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24543748017823	76.81292995094057	0	0	\N	2026-10-23 15:14:02.199
ed054ba1-8259-452b-83c1-38f41f757881	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24556981677472	76.81293942345567	0	0	\N	2026-10-23 15:15:11.348
b785635b-d141-4a84-b9f8-5056e68b2b23	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24556981677472	76.81293942345567	0	0	\N	2026-10-23 15:15:11.35
1dce9d8c-30d3-490b-809d-5e40f8302502	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24556981677472	76.81293942345567	0	0	\N	2026-10-23 15:15:14.042
cddf512a-3d5a-49f3-9ec4-4b4dfcdc623d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24556981677472	76.81293942345567	0	0	\N	2026-10-23 15:15:14.045
aa97b765-ff57-44b8-bebf-5e4deee974c0	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:20.084
45b6c4e7-7e80-477e-bf58-9412f59f3027	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:21.678
9989b0db-3d8f-420d-9c6a-c86f743dfd52	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:21.788
fb76674f-db18-4380-bf72-265f93612c61	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:25.784
093b44ab-5bde-4e06-944d-63014efd8358	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:29.885
7737202a-9e21-40b5-818b-6e2393ccdd55	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:52.716
dbd2a30e-8f89-4760-86fe-ade80b761e09	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:53.852
cea7b85a-6a80-4f7a-acc8-dddc46d7bd93	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:53.921
87838ad7-629f-4d90-b939-7c605b4c5972	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:57.95
0eb4179c-2c25-4940-8e9a-20704f50a530	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:14.393
664bdf1c-857a-46f3-898e-625cda2b64cc	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:15.909
7af60387-095a-4d0d-b6b4-1185c3d75c11	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:19.937
770593bd-4aa5-4b87-9775-bd56bf6603bc	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:23.967
4dfcde8e-99cc-4552-bb82-23ab63b898ec	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:20.083
61164f24-492c-47c4-96bb-93ee7a84f658	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:21.678
7bc64bbb-b04d-4324-960b-fce4decadca0	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:21.788
53d9229e-d6dc-4220-943e-a202a818ed80	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:25.784
63d00470-d09e-4cf0-95f0-55fcc2634210	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560568890029	76.81284383748829	0	0	\N	2026-10-23 15:15:29.885
246afaba-5c7f-4d34-8623-227080154903	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:52.716
beef54fb-e5b3-4030-9bac-216c5d0f9d5a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:53.854
85203d20-ae44-4621-99b6-41edee5c7c00	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:53.921
a57f1264-7343-4750-9513-1c0abdee74a4	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24560456641916	76.8129035872976	0	0	\N	2026-10-23 15:15:57.95
ab5a79f0-c73b-4747-8cd8-e8033cdc15ef	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:14.393
4ed815f3-8de8-4d44-959e-037372a26187	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:15.852
f0542844-98ed-4338-a19d-33607388e9f6	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:15.854
4e590350-c9b6-4cf8-9259-be0709673938	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:15.909
f76a5daa-8d34-4a17-8258-5d9e8be7cf6a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:19.939
1c9a4453-f841-4ae5-a3a0-b1f5b8c4e619	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24564620216192	76.81287169787277	0	0	\N	2026-10-23 15:16:23.966
9bcf99e5-cca4-44b2-830e-897ee6ebf2b3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:47.964
a8c24e23-323b-4fa3-972e-dc1193024f53	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:47.963
cef762ec-45a3-48ee-947d-83578f3c58aa	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:47.979
ee366023-b292-4114-b8c6-8f83b8882444	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:48.059
78f47133-74c5-4b70-8065-ba49d70d19d9	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:53.358
c5e990c5-292a-4de6-8c0f-05469b839bb6	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:56.002
9cb9b602-5d1b-41d2-851b-c1c8332bd03b	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:56.076
b19a34e2-2229-4a4d-ad91-72d5c7515629	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:47.967
7bc9fe68-f702-4e4f-b1e2-22870baa51b3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:48.059
bbf7a5d1-efa8-4229-8af0-bf96260039bc	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:53.358
73c00279-7421-4d3c-a7b4-909ca0efe73a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:56
8ea675e5-d6ad-4afd-abf5-41994fb2629d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24550296735398	76.81298858707359	0	0	\N	2026-10-23 15:16:56.073
a406aa5c-34be-431a-9b43-5fb3184e7060	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:52.025
b16ac522-581b-4a0a-86d8-27f21d200ee1	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:53.151
641c738d-1767-46dc-85f3-072c0198ce4c	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:53.254
e4dfcf4d-ef6b-4f13-bf9c-170927de6914	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:57.227
e937b9a1-7b41-4fc3-af50-80a6930ca773	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:19:08.951
d9b0206d-da03-4cb3-8a6a-3d71b6c8cc51	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:19:09.216
06a3c7e6-472d-4094-890f-0d8f01daaa1d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:12.022
6c4cc32f-253a-4a95-9afd-ecdfe5efd76a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:13.243
b9334c86-4d13-4778-8ff8-828b1d7bf26f	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:13.327
6ac56eda-8a64-4c98-8778-1cb9801218f5	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:17.303
4553f64d-2a26-4c3d-b623-106716dc0fa3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:21.335
00d963ce-08ff-42cf-8025-b62eac90495d	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24551617967546	76.81289190612416	0	0	\N	2026-10-23 15:19:25.37
2c660c2c-9ca3-4292-bf2f-72462bf7f860	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24551617967546	76.81289190612416	0	0	\N	2026-10-23 15:19:25.371
71bcdc41-b157-4c25-9271-0bd015dbf896	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24551617967546	76.81289190612416	0	0	\N	2026-10-23 15:19:29.357
7a9e8a55-c1dc-48c1-b470-185f6de45495	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24551617967546	76.81289190612416	0	0	\N	2026-10-23 15:19:33.418
5dcdb242-bc30-4696-9dd2-228795dd18b6	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24556119552049	76.81286507355928	0	0	\N	2026-10-23 15:19:38.476
5bbb4fcb-ee76-4cf4-89fb-d67d5371972b	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:52.028
b91ef904-1d6d-4c47-9536-b43e74c328c6	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:53.152
c8a05699-bd8a-481f-8356-b576b1eae758	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:53.254
44fa9377-a19f-45aa-8d38-99c362eeaf7a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:18:57.227
653ed801-1f59-4b89-a098-5b0ba74cbe24	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:19:08.952
df8e7652-c2f2-48db-a1a3-d2c770ca50b4	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24577384966368	76.81274235420831	0	0	\N	2026-10-23 15:19:09.216
d96c1885-55be-4fe5-ae25-5cdda7ca3f5b	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:12.023
b9733f9c-9d79-4c6d-9f0a-7a6ccc0c17ba	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:13.242
cc9ded5f-4327-49f0-864b-e5d9753e056b	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:13.328
1b975366-e72c-462d-bf34-29f6f525f2a6	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:17.304
0b7fcb0d-a23f-4973-b7d6-db81ab97e953	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24578544890493	76.81264219143628	0	0	\N	2026-10-23 15:19:21.334
e30f7dd9-7513-4725-a905-66ad75212701	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24551617967546	76.81289190612416	0	0	\N	2026-10-23 15:19:29.357
6cef2873-faec-440c-9cfd-1108f4d2c5d9	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24551617967546	76.81289190612416	0	0	\N	2026-10-23 15:19:33.417
253931ff-bec6-4f16-b1ef-cba2a0d17b9a	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24556119552049	76.81286507355928	0	0	\N	2026-10-23 15:19:38.476
c615d2a1-fefc-4e8c-879d-229443eb40f1	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24544372986286	76.81295429093093	0	0	\N	2026-10-21 00:17:45.425
3a8b83a0-cc61-4460-af52-e67ddbbf9d35	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:52.44
10bd68bd-56b6-4777-9de9-a28136190be3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:53.421
2a3e0da7-bbce-4151-bb81-d253f3f138d3	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:53.467
ab766507-5834-4390-8530-58ac6e385beb	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:17:59.639
d9978828-8983-4204-aa78-05c9e06d4ab9	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.24542313131434	76.81297454821248	0	0	\N	2026-10-21 00:18:01.442
def75462-aa42-4646-acd6-6ff458204873	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2454758073102	76.81294342282928	0	0	\N	2026-10-21 00:18:06.73
d0050e9d-7cfb-47c4-889b-71efe3e7aa22	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2454758073102	76.81294342282928	0	0	\N	2026-10-21 00:18:09.468
45e3a6e1-a8c8-4c99-a806-e4613bb4b7b8	11df1583-048f-4692-99cf-cb05179c6dfb	8a2d5719-341d-4b98-a62d-2a8a392b28a1	28.2454758073102	76.81294342282928	0	0	\N	2026-10-21 00:18:09.514
\.


--
-- Data for Name: Inventory; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Inventory" (id, "productId", "availableQty", "reservedQty", "lowStockThreshold", "updatedAt") FROM stdin;
e90325e8-472a-4688-b65c-03c74c3c9924	a651883d-dddb-4b0c-86da-3d0ab7f662db	45	0	10	2026-10-19 18:37:52.682
c7448b68-f6bd-490e-9fa6-b7c0f719f2d5	48a2d932-eea5-4c71-987d-a88114e62c39	80	0	10	2026-10-19 18:37:52.692
8489407c-8a3e-45ec-8e77-2ac279f15f0f	9941ab22-31bd-4009-bdae-dc08be66b8d8	35	0	10	2026-10-19 18:37:52.697
a62ff125-d92d-485c-b03d-9f296f48290c	cd1419d5-f3b5-4a9b-ad77-b5f4cc738400	30	0	10	2026-10-19 18:37:52.703
de640b46-963c-448b-8607-d717bd463743	c55e5714-3c24-4ac4-8a5d-3ab9edfabd1d	25	0	10	2026-10-19 18:37:52.708
eb778587-eb7b-4dfd-be41-0fc7643b75f2	b2ab66d7-09c4-4cfb-93b1-dc6362c570fa	20	0	10	2026-10-19 18:37:52.714
ee5dd87f-967e-453d-bb17-73572ede5894	ea2a5cbf-5c3f-42a4-96dc-a11e7cc938df	15	0	10	2026-10-19 18:37:52.72
f3e442e9-e888-47bf-9141-e18631152bd1	69df3b08-19ed-4eed-b50e-66b23aa8e681	40	0	10	2026-10-19 18:37:52.725
dd7978c4-4485-4ed4-9b8f-eaf86bf1c9d0	6d3c8686-bf0b-4035-a0fa-ee31c574fad4	22	0	10	2026-10-19 18:37:52.731
3dcae9f0-f03d-4041-adad-f3c505cc3ffa	bc55e1ad-b6bb-44ff-aeba-84001584dd2e	28	0	10	2026-10-19 18:37:52.738
da5f9c05-3d1c-4296-bc54-8d16f0e64f21	41a268b8-f6c3-4f0f-a4dd-ab90a1080bff	30	0	10	2026-10-19 18:37:52.745
8449b68a-6e5b-4de7-96bc-04ad67d82b01	e999e1a8-eb98-4712-8fe3-a158742c7bbf	35	0	10	2026-10-19 18:37:52.75
63c38bc0-96cf-4cc8-b63e-e035e6868fab	01a2ab5c-c35b-48df-a5b6-637ea000d3d9	12	0	10	2026-10-19 18:37:52.756
ab5a5730-bf30-4437-b947-01441bdaf332	d7b79eeb-1516-4bd7-be6e-530d5aa17664	18	0	10	2026-10-19 18:37:52.762
3bca99ac-9b49-491b-886e-7f41a84c3988	d7ed3810-76c9-4296-b4ff-e824e752d03a	24	0	10	2026-10-19 18:37:52.769
55aa7f53-b174-438f-8d69-10f3bdff4564	5e4186da-b4d0-4c74-a48a-9170f8dab89f	8	0	10	2026-10-19 18:37:52.775
d7b45ca5-54fa-4db6-ad62-7278a3153e4f	df86cd8e-b135-401c-96fb-13326a5f11d3	120	0	10	2026-10-19 18:37:52.78
192b562e-0571-467e-8cb5-673ec9c1939b	b3514a8b-3040-4906-9f00-0dbb1df8ff23	150	0	10	2026-10-19 18:37:52.786
d4aa7e06-cc10-40bb-9779-257bb1d06e39	bb30627d-a4e1-41c5-9f30-7cfcd1c96a39	90	0	10	2026-10-19 18:37:52.792
72203962-8674-4dea-8e91-0588ffe25563	47d67654-23b1-4ea9-9805-cef38180f1d5	45	0	10	2026-10-19 18:37:52.797
0bc1f1e9-508a-42e1-a7c2-6846f92c77cb	0e1e430f-fd78-4aac-89d0-af903dc3bf9d	40	0	10	2026-10-19 18:37:52.802
40d118a6-43d1-45d9-9478-7f8e695071bd	08f97677-4e96-480e-8178-f930eff362ae	60	0	10	2026-10-19 18:37:52.807
41089d35-0c86-449c-a64d-256d7f2befde	437b0a39-18a8-4d6f-8098-7b21745bfcef	35	0	10	2026-10-19 18:37:52.813
46d9e0b4-96b4-4f25-b76a-1bf5fdfcb51f	7a43b8d4-4337-4a6b-a458-08845abcbb12	38	0	10	2026-10-19 18:37:52.817
c0c848f1-ff01-4f00-b23e-ca55fa17a895	35d4ce5b-f6f1-45d2-abf9-fe5a9faf6d4a	50	0	10	2026-10-19 18:37:52.823
29ed9c59-3c4f-49ee-894d-dd52bb5a7235	b6984c5c-37ed-4c5f-9f8c-5bd0b3b6c723	40	0	10	2026-10-19 18:37:52.828
143e63a8-f0ee-4401-aa9b-f1b2888bf405	365fe12b-a759-45a1-93e2-0edf8fa2975a	30	0	10	2026-10-19 18:37:52.834
b356ebf7-988b-44e2-9057-6c6b9122d436	eb5fd2b3-b823-4685-a5d3-20656c99196c	45	0	10	2026-10-19 18:37:52.84
c944cf4a-c74f-4e1c-8561-adcd6f8ef207	05f9d474-e1b4-448e-a4e6-a59c328a1743	36	0	10	2026-10-19 18:37:52.845
4bb15ba6-1c79-48c7-9a97-262ff714112c	1a21fb45-4968-408b-80e3-25bef8f57213	55	0	10	2026-10-19 18:37:52.851
24c4712e-737a-4056-a23f-9bfd4662b288	f14b7d90-4a21-4ef0-adf5-d9284004d24a	70	0	10	2026-10-19 18:37:52.857
703ebf94-dafe-432d-b589-4b844e95af43	c160d9ea-8fc4-48a6-80ff-bdc2622ad5bc	65	0	10	2026-10-19 18:37:52.863
82751970-819b-46c8-895f-8db2d1ab3cc1	fecc47fb-2523-4cee-a95b-2eda5212c770	26	0	10	2026-10-19 18:37:52.869
7d111b91-8646-451d-97a6-f3a3db74549d	5012a008-cb7d-47fd-9c15-4bc49b4957ff	20	0	10	2026-10-19 18:37:52.874
7e0522fa-e618-4afc-a147-e4080fc81f5a	8e360a4e-fdb7-4ac5-85d3-0edfb702c247	30	0	10	2026-10-19 18:37:52.879
7a710e36-b46f-429e-9da7-33cc4b36b23d	75a1c505-a1f6-42c2-9bd0-f0b7f1100c7c	32	0	10	2026-10-19 18:37:52.884
f152ae95-93b2-4c87-a622-0730b938f48e	aa6f4370-611e-4977-b80a-eb6a4912bd2a	110	0	10	2026-10-19 18:37:52.889
328f5808-2f37-4b5c-8848-2bf24168fcba	37a9546b-9185-4b3c-8d87-decb471ba112	95	0	10	2026-10-19 18:37:52.895
0cf5d3f6-b49d-414d-8371-da514411f2da	c618f820-2ad5-4b53-84f4-5164277f82ad	75	0	10	2026-10-19 18:37:52.9
09071ab9-1008-4860-963a-cb5aa58d3cf3	33a214ab-0f00-45bc-b17c-a8fd4e9fd4d3	50	0	10	2026-10-19 18:37:52.905
0b5775e2-65a9-4e2d-86df-e06efd729b10	0fa6ef38-aa48-4134-bbd0-b53be4e196fb	65	0	10	2026-10-19 18:37:52.91
e18670c5-8666-4600-a38b-5df531c56cf8	2444af02-1267-4672-9821-13d22a974744	45	0	10	2026-10-19 18:37:52.919
1592a1d2-6b74-42a9-ae37-61a61d0b23ff	7cbaf302-5d85-4ffa-b96b-67f76ee128e7	85	0	10	2026-10-19 18:37:52.925
309a7e3e-0243-4315-8c82-e405988ed168	c9dbe7ec-94f3-49f3-ba7a-681e6a8619f1	35	0	10	2026-10-19 18:37:52.93
980cb42f-c40f-4d2e-b5b2-8237008c88bf	d3ac5ace-f9f7-4887-b16f-c69dfda58e18	90	0	10	2026-10-19 18:37:52.936
365b3df9-8290-4423-b7aa-d30c30839718	0475cf7d-0a0f-4edd-beb3-09da04901502	55	0	10	2026-10-19 18:37:52.941
0f4c520a-78f0-42ac-a4d1-5e965f455fdd	e72efdf2-cd2d-48de-992f-48eaa4b8cc0e	60	0	10	2026-10-19 18:37:52.98
64708ea6-8b17-4de1-bb47-15c32e3f0729	d088fb18-4843-4589-9213-60fd1a07f2ac	55	0	10	2026-10-19 18:37:52.985
438b2920-3aaa-4b86-aad1-5a2103792a92	e31b332e-3ebc-41a4-8f1a-bbdcaa9f940f	35	0	10	2026-10-19 18:37:52.99
3b9d3d73-dfc5-4bfd-992e-14a8c5b9ac94	cee5075c-62cd-4cde-86c5-a00367c08484	40	0	10	2026-10-19 18:37:52.995
2d722326-0e7c-490c-bcec-80933da4a7c3	7074ec46-2b5a-4a17-84fe-084994a4a9d2	50	0	10	2026-10-19 18:37:53
ca6f2950-1029-4edd-bed7-207bd746f82f	ef8a59ef-b653-4e89-b4b5-2bc55554e982	25	0	10	2026-10-19 18:37:53.005
8de61a9c-57e6-414d-ab0a-6c8f57ccbaed	b7a787a7-1706-45b5-a594-fee77bc9a682	65	0	10	2026-10-19 18:37:53.01
d4beee44-fe2c-4b43-910f-8418a95df976	a91a4c89-da68-480d-a1cb-066fb10f9719	45	0	10	2026-10-19 18:37:53.015
ef55e197-d95c-4d0a-be3c-4c460deed90e	ba487692-123f-47c7-b0ee-1133e7ddf5c8	35	0	10	2026-10-19 18:37:53.02
49142434-5b3a-4436-9740-88bfb7d2a9a1	bc6d1e46-9be2-4df3-bc0a-17ea06ddf235	30	0	10	2026-10-19 18:37:53.025
0688178e-c7b6-41f9-95e4-829df0ac5354	6d3738ca-aa1d-43b3-95a3-94168a56dced	15	0	10	2026-10-19 18:37:53.03
444ce072-a49f-4804-ac61-28dc6e2d5084	6fa8e816-f665-4bfc-87bf-c90563e3f635	18	0	10	2026-10-19 18:37:53.036
774a59bb-0989-491a-91ef-53d8828eedc9	c7a41a64-2748-40ad-a38f-871513bbe531	22	0	10	2026-10-19 18:37:53.041
cb1fe111-426b-462f-b3db-772edac0b2fd	ccb4186e-1f7d-47bd-a665-bac126e16837	22	0	10	2026-10-21 09:25:13.784
fe74f9d8-eae2-4af2-bc88-db14d1ee4f8e	3f6d065b-8473-4fca-94e4-0b891204198a	59	0	10	2026-10-21 09:25:13.822
22511127-8bfd-456f-a293-285a24a11219	029b8cbe-5996-400e-a576-06b1ab82d3e8	20	0	10	2026-10-19 18:37:53.048
2eab7967-d2b3-4f0f-94b6-db7ec57153bc	02ce6e43-cb68-45fe-aff3-2798df163050	80	0	10	2026-10-19 18:37:53.053
fc882089-76b5-4bc0-8eaf-0eae6b8d8274	d3c30fd3-1994-4524-90e3-abb5f9609098	45	0	10	2026-10-19 18:37:53.058
be685e8d-ed26-42b1-8042-14f93c85310c	cee8074c-b468-4409-b052-497c50848ae5	40	0	10	2026-10-19 18:37:53.063
4c8f39bd-2151-4217-8432-5b163fa6bd92	db3674eb-e3c8-4006-91d5-20e51890f3eb	75	0	10	2026-10-19 18:37:53.069
b4d2ffb0-3bfe-471f-9e5b-81d88467f88d	82ca3881-c9c9-4e4c-866e-ef496d619359	65	0	10	2026-10-19 18:37:53.074
c6cbfddb-d81c-43ad-b4b0-5adb8c3dd934	edba199b-8bc1-48b4-b59d-103dd11b8dc1	55	0	10	2026-10-19 18:37:53.079
a9ac2fb1-9b52-420b-9919-8e6e50b9ac53	85fafba3-0007-46e7-b6bd-caf312b7b7ef	50	0	10	2026-10-19 18:37:53.084
936cd708-8204-4cd6-8646-45a6778e443a	ea487ec6-f206-4a1f-bbce-3305be1bd80e	45	0	10	2026-10-19 18:37:53.088
b1328c99-5bfe-4631-bae7-8156b99549e1	d5dce57d-e9be-4778-908c-f88022903cd9	55	0	10	2026-10-19 18:37:53.093
e9a06ede-0a93-42d4-8f9a-ef18224cadbf	98820aa8-20af-4408-a4bd-516a1b6b39e1	40	0	10	2026-10-19 18:37:53.098
d8ea51de-be91-49e7-8aba-cda78a3d1374	4199cc23-15e8-45e8-89f9-1c811fc5f266	45	0	10	2026-10-19 18:37:53.103
ebfd9bbc-f947-438d-ba10-04a198f3d45a	18a5b661-421c-47cb-a20e-ee71f9643b65	65	0	10	2026-10-19 18:37:53.107
890189e9-0050-413d-8218-7cd6048151a6	975b636e-e7a8-4f85-83ae-56d35d4f4b76	60	0	10	2026-10-19 18:37:53.116
d4576bc0-490b-4bbe-b3de-b1ea729c1e27	c4a4e602-60b4-4e4c-9f4c-943f5780f4d8	50	0	10	2026-10-19 18:37:53.121
5df69f88-5a85-4868-a3bc-6f4533911e91	66d45283-fc18-4838-b4da-03be5e9b43c1	45	0	10	2026-10-19 18:37:53.126
16cb7fe8-0896-421e-920d-06de3d459fdb	0aec9277-a957-4878-8cd4-7e75ef419854	40	0	10	2026-10-19 18:37:53.131
21fb446e-20f7-4b74-956f-353a4e986d9b	dd221e2b-8d29-459b-ab0a-0a57827e5ffb	35	0	10	2026-10-19 18:37:53.136
1c0780e2-2e55-493a-8714-014ea92f5a6d	bad1fae6-ffa9-4d4a-9e82-51f5a01c8972	30	0	10	2026-10-19 18:37:53.141
ed3f0ff4-a50f-4915-a612-c0ac2bbdb98a	58c61396-06cd-4424-bb6b-e751a18be72a	70	0	10	2026-10-19 18:37:53.146
e929a3ae-fee7-40a0-8e14-5010ac3dd979	3265a2a7-4f86-4f16-8170-c299d44fd5a1	65	0	10	2026-10-19 18:37:53.151
a961f5df-d269-4823-b9e9-c9a3ac27441a	18ebe3cb-0dcd-4591-abb6-f21bf70416fd	50	0	10	2026-10-19 18:37:53.156
786772c4-d8f9-4160-90d3-b91615e64f5a	5e3d0d18-b89a-4768-9ab9-e8c2ea88d521	45	0	10	2026-10-19 18:37:53.161
e3a508ad-b837-48bb-971a-f585abd2c014	4ffda3f7-cd58-4df0-a7e4-60088d12602e	35	0	10	2026-10-19 18:37:53.166
42acf343-27f5-4dab-8596-11b4b952cca8	3b1ddd5f-7b15-4e1f-b085-7c45485a7f03	50	0	10	2026-10-19 18:37:53.171
9996acd6-0c04-4f91-ae93-a51d01c7ae8b	9c77e34f-becc-44b6-aebd-907c22daee62	40	0	10	2026-10-19 18:37:53.177
1bca8efa-c345-429f-ad90-40299db7aca4	6869c586-fd6c-4bdf-9aa0-c9edd9cf2d6b	30	0	10	2026-10-19 18:37:53.182
de072645-6565-4782-82c4-6fdcaae33546	049911c3-7af4-4a00-a3c1-b200b248e91b	25	0	10	2026-10-19 18:37:53.188
ea281e91-ee9b-41a0-952a-9d4989f17113	637127d4-5684-431a-8b9a-10d812e13bb3	20	0	10	2026-10-19 18:37:53.193
7dbe6076-3e85-4041-80c0-7c11816f73a6	39be6d4d-f3c2-4d3f-b359-ddbecdd8aefa	30	0	10	2026-10-19 18:37:53.198
60784628-12f3-4c48-a41b-34feb88ebe6f	6110916e-6788-4abf-8c2d-3a1ac860e922	35	0	10	2026-10-19 18:37:53.203
bb3d6b1e-ee39-4f1b-aa52-1384ea8f4df8	4e9f0860-4838-4955-aa8b-f65119d7dcb8	85	0	10	2026-10-19 18:37:53.209
d6c42b33-5ba3-4e15-99df-710834b973b1	10a705b8-3342-405d-9085-bfe95b42556d	90	0	10	2026-10-19 18:37:53.214
20ab0a0c-026c-440e-8ab2-3a6f0cea8536	f56fd32b-34ff-4cdc-9e26-ba5eabfa714c	80	0	10	2026-10-19 18:37:53.22
6326e0e4-b0eb-4f0b-9fb6-c354e7a37018	f391d2b0-9f28-4afc-af27-6289ee841d42	75	0	10	2026-10-19 18:37:53.225
400179f0-d6e2-4f19-88e7-10f0aa0e7445	a1eed8de-e2aa-4878-a53c-a8ae56691a3d	55	0	10	2026-10-19 18:37:53.23
7fadd34a-f87a-4d39-99a6-f08f2a095392	246ed21a-73de-4bb8-83c9-7339890a1e20	140	0	10	2026-10-19 18:37:53.235
d14e4bbb-c159-472e-828f-9b79a89818d1	8e146d98-0984-464a-8f82-8336e2cde221	60	0	10	2026-10-19 18:37:53.24
cd2ced73-d728-4d74-ad7c-8ba46a53b7e3	32ecb7ab-1a13-46f1-9058-c937beaabcf1	70	0	10	2026-10-19 18:37:53.245
f606dee9-0126-48c3-84a8-2f77fac430c5	ff107b83-7b03-4a4c-97d3-ed0195017d71	65	0	10	2026-10-19 18:37:53.251
eec05600-174b-4294-9bc5-480bd278d1e1	68d1f3f2-2605-4a7e-8cce-919acd7d496c	40	0	10	2026-10-19 18:37:53.255
5c06a27a-8512-4d8b-9a60-0f3c3e07370f	98fcd9ef-5b4a-4fa4-ab4d-d2b211902ab0	35	0	10	2026-10-19 18:37:53.261
d8991e0e-89c5-4719-860c-6801f8e9e31c	445fbf4b-5b7a-4545-af70-5d13cb7ab912	45	0	10	2026-10-19 18:37:53.266
5c52ae7c-60a9-4a4a-a289-24ab84c5cf3b	650d6531-6bf5-4658-af45-96380dff7eaf	60	0	10	2026-10-19 18:37:53.271
d1361102-6a5b-47b7-b9f9-f04d821aa651	8e72f8b6-4b8a-45cb-a1ed-2f7cf6f9d57b	50	0	10	2026-10-19 18:37:53.276
7cd4d186-ffc4-4810-bedd-51b3609153f2	6d81e72c-c896-4a1e-a370-37778688c9d1	65	0	10	2026-10-19 18:37:53.282
78cb0a0d-da1f-4227-9ef4-e5e897503722	ec58bce6-62e2-4413-a6ee-48786551fccd	120	0	10	2026-10-19 18:37:53.287
eb093d29-426d-4922-9490-7f2c01dd48e0	2175cd0b-9a10-430a-9dc1-d3bb87b9d3d1	110	0	10	2026-10-19 18:37:53.292
0fc34993-ab1e-472b-9ff2-1f4f865bf2ff	a7cef11c-134f-4a42-96fe-bd8f74ce3e01	130	0	10	2026-10-19 18:37:53.297
b2b787d2-4de4-4dd8-af4c-a2ab04ff0c7d	c15b0d89-0eaf-46df-9b2d-d4ea728544ac	50	0	10	2026-10-19 18:37:53.302
73bfcb2e-c2a5-4e58-94eb-d57d2f55b58f	6eb4e151-d37f-4209-92fc-240b1d90519e	95	0	10	2026-10-19 18:37:53.307
c357700a-3965-46ab-94fa-7f18c32ada50	fbe3fdfe-4746-4eb8-9475-995e9741ba22	75	0	10	2026-10-19 18:37:53.312
9a11d2fb-62bd-41b3-a9eb-d788c627f25e	f20d5f5a-191e-417e-9b68-137894d321ef	65	0	10	2026-10-19 18:37:53.317
8eaa99e1-c269-40e8-8d0b-3dee4f0df3c4	46248518-85db-4268-bb75-a08992059587	80	0	10	2026-10-19 18:37:53.322
2ac1b5dd-c3a2-402c-9da3-6a144320cbb5	fa8439c6-9e25-4b37-86e9-15bce306684d	35	0	10	2026-10-19 18:37:53.328
1ca21b94-28fa-4323-879f-37d790dab402	6ab06c08-1d02-4c15-a393-9497179150bf	40	0	10	2026-10-19 18:37:53.333
19871942-771b-413e-a21d-e948c72669ea	b86019fc-2d69-45e5-91f7-1b1f4756026b	35	0	10	2026-10-19 18:37:53.338
9f99fe64-c51b-4552-8f11-7d549d261f9d	328ee321-9b71-412e-a0f1-154c50f7eb53	55	0	10	2026-10-19 18:37:53.343
bdb54615-5645-4136-8f8a-15d5cd161c64	e208e44c-0ed3-4d40-aee6-ba649b586f75	70	0	10	2026-10-19 18:37:53.348
f2aa7ed7-2882-456c-b48d-af19076d39a7	941d7c6a-b7c8-4765-9c57-d51e2faf7329	45	0	10	2026-10-19 18:37:53.353
45e08854-99fb-4f36-b883-196232435f58	d25bde92-9f72-4b38-8639-9aebbb56f650	35	0	10	2026-10-19 18:37:53.358
3004bcfe-e51a-4917-b021-e2ff16ac52b6	50223ac9-c606-4cf8-910a-b801ff2edfad	30	0	10	2026-10-19 18:37:53.363
21e820be-54bf-454d-a000-d5dcf8276dc6	aac5610e-12e4-4917-9980-89b937980a8e	95	0	10	2026-10-19 18:37:53.368
51f3646c-d026-483d-8f55-9631904acc75	361c4a7a-9997-4e19-86f7-e35e631dbb41	100	0	10	2026-10-19 18:37:53.374
64261194-7cf2-4b3e-9915-28739cc1eb67	4bea3880-65e4-46b2-ad72-37ae9b1ec841	85	0	10	2026-10-19 18:37:53.379
766a6500-d437-4de5-9044-07e3d8e3c699	ebcec839-e427-47bc-8dc0-e50fc5429ec4	65	0	10	2026-10-19 18:37:53.384
a10a0877-baa1-4739-bd2e-366703ae5d6a	d49288b5-2fe7-415a-99a9-07b9202fde46	45	0	10	2026-10-19 18:37:53.389
51fe2b3f-aeea-4f8f-a6f6-9a53a08a8ec2	9b3bd756-c45e-4222-a102-b979c7a18c95	50	0	10	2026-10-19 18:37:53.394
a3cd58d1-078d-43f6-a86e-8b12bec84469	87846887-5a68-458b-9107-46b0868dd993	70	0	10	2026-10-19 18:37:53.399
387fc02d-1829-4068-9b17-19ba0d70ac89	352668c0-2552-4c07-b43b-0945ec8d47c2	60	0	10	2026-10-19 18:37:53.404
ccd7adcd-aadb-431a-b1da-f179a6a66d03	d4cd1b9f-52f6-4a43-943e-4d7a1bbe7ade	55	0	10	2026-10-19 18:37:53.409
c5da3e28-b874-4581-a0f4-3a72957517be	c0ec7bbd-9e35-4e65-a7a9-12a5eb7f083e	65	0	10	2026-10-19 18:37:53.415
916ca4db-429a-4ba5-9135-d04da47e579e	9bf8e7b1-1ba3-45ca-b40f-d7b2d50a1273	70	0	10	2026-10-19 18:37:53.42
8303583c-d4b7-4fa3-97ec-228aaedcc251	9398e221-8176-4fb9-afa1-3875fe5b0978	40	0	10	2026-10-19 18:37:53.425
89fac30a-d57b-4963-b5cf-ab0a8f17276b	0e5bf48c-6b37-4fd8-af0a-14e9187f80a8	45	0	10	2026-10-19 18:37:53.431
8221c082-0400-43d7-b293-74f951688341	c8de6971-d906-446d-9771-8126cd3b8c86	55	0	10	2026-10-19 18:37:53.437
a19a8ecb-5e01-4223-889f-cf0b90550870	402f5ae6-40f7-43d0-a74e-dc98799e579f	65	0	10	2026-10-19 18:37:53.442
6e42d2b5-45fd-4dbe-9880-28f2c95a0dd3	162ed9c8-1a4e-420e-b540-096a3d5fee8e	75	0	10	2026-10-19 18:37:53.447
418471f7-3b0d-4e35-8531-0a243a0beb7d	437d6c7f-656a-44c3-8580-983d634856ff	45	0	10	2026-10-19 18:37:53.476
a0c629fa-5caa-4651-a771-97dfa799b133	952b9dd4-6425-4a8c-9846-5014604330f4	40	0	10	2026-10-19 18:37:53.481
2e616453-10a1-4856-b49b-b2a54cf35316	4423347b-36d6-4cbc-88b5-bd452c2ae7ca	50	0	10	2026-10-19 18:37:53.486
3b17893b-ace8-4e09-b9d3-77818233a2a0	20bd5201-44e0-4f6d-aff5-529462b5c3d4	30	0	10	2026-10-19 18:37:53.491
8ca8aba0-a394-42e2-8122-3ff1ad105984	770aa128-df2a-4406-a2e8-a6110baf37ba	25	0	10	2026-10-19 18:37:53.496
ba996bbc-5eff-471c-9b64-6f0eea461610	1d71a949-43dd-424a-ac94-687625bd2992	35	0	10	2026-10-19 18:37:53.501
36e30f7b-00cc-43ce-b09e-d5f9bef8e2ce	c95626aa-957e-4fd1-aba9-56d64750a302	110	0	10	2026-10-19 18:37:53.505
ecfca35b-f8b1-435d-a877-32348ba40bb0	19d10f5f-97b5-4dc7-b72c-bb83c3acf760	85	0	10	2026-10-19 18:37:53.51
56bf42c1-7d91-4c55-ae4f-0e268aea0e4c	e8a31b6e-4cdc-44b6-a3e7-79dc08fe6e4a	75	0	10	2026-10-19 18:37:53.515
46823506-7f5b-4fc4-a2cd-7a1eb4480f83	62700de7-5083-4d36-ab30-29b4d18dafb6	60	0	10	2026-10-19 18:37:53.52
4160e648-ecc8-4eda-b2dc-077cf30a4745	05236ba1-fcb1-4e1a-890d-2c82cb562a58	55	0	10	2026-10-19 18:37:53.526
43a36e7d-bbe7-45b0-8920-c7ef1bfe7401	85186dde-07bf-4e06-8f95-a18fdf4cb7e2	65	0	10	2026-10-19 18:37:53.531
fa06704c-211a-477c-ae01-2b3674f87f71	987a9d6a-24b5-4ec6-aa45-be8c3ba18f04	45	0	10	2026-10-19 18:37:53.537
85a47228-0b12-4c40-a2fa-2b6b3da29c5b	81aa45de-f5f2-45c3-8333-50f6b584f087	40	0	10	2026-10-19 18:37:53.543
72bf46d6-fb62-48dc-9e83-43384d159408	ae70cdef-cc06-4579-90e9-8f964b0bdea1	50	0	10	2026-10-19 18:37:53.548
817b41bf-76d1-4fe3-a07d-eb0feaf25c33	b5abaa5a-0fac-43c4-92a6-cb8ce0d1f474	45	0	10	2026-10-19 18:37:53.553
520548f7-adf1-4841-b648-c2ccc515b0a0	f93aa39a-0835-4629-8244-a2b5082536c2	35	0	10	2026-10-19 18:37:53.558
7c5edf35-2680-446d-a8a2-e5b94d70ac53	4454c902-6a5f-4f7b-b14a-72a34d20c1d6	30	0	10	2026-10-19 18:37:53.563
9daa8c58-3dfa-4add-998d-0b4b789f3afb	c3677ff6-9ec1-4dd5-b94b-2249084c98c3	55	0	10	2026-10-19 18:37:53.569
a9e2fbe4-d3db-4d5f-ab40-2b2576bf763e	be29c303-414c-4369-ad7d-4d0410167ed5	40	0	10	2026-10-19 18:37:53.574
f167b3b2-8b52-416e-a7aa-215440ecf3c2	881bf9a3-f656-4c81-98b4-9f2ee67e20c0	90	0	10	2026-10-19 18:37:53.579
f30c3b7e-8607-4ac0-a486-9f1113ca5f63	351fea53-2f19-4fc3-9234-7e166e0457d4	80	0	10	2026-10-19 18:37:53.584
86c2bf07-e8cd-4546-ac86-f1e266e6f764	a786e66c-0f43-48af-a177-f6e28d077163	85	0	10	2026-10-19 18:37:53.589
26a159c7-6e32-44f5-9f59-c31fcffbfb31	b5bfa8a3-685f-414a-9a47-b41154725547	65	0	10	2026-10-19 18:37:53.594
796544d2-a76d-40b1-a094-0030110b52db	6e00fa18-6995-4993-a87a-23f26f684e92	75	0	10	2026-10-19 18:37:53.599
92f4ccac-16fb-4906-9803-794c1abd4955	ec52943b-1bb6-4075-bdf2-0d539ae5d202	70	0	10	2026-10-19 18:37:53.604
5d7b21de-f188-4a1b-be97-8e6c8f0cc5e2	e948d4e7-ed66-4b39-a8d0-2c5d04cf91ec	65	0	10	2026-10-19 18:37:53.609
866b4ee0-8345-4393-a2d6-1c1f1200ff38	34f20b70-e2c3-4ba8-bbfe-bc2a1a4a170d	50	0	10	2026-10-19 18:37:53.615
772d51c9-8791-49c6-ab0e-00857ca7896f	7015fcf4-fbf3-4ad9-be41-b95c292a3b3c	45	0	10	2026-10-19 18:37:53.619
01b008bb-48e1-404d-91d1-bdc39060bfb9	7babb798-02c3-4eac-a6b4-e9685a7afc0e	40	0	10	2026-10-19 18:37:53.625
4d36fd05-6172-4ab3-a7dd-4206452948d6	65336cd2-b1ab-4a08-bdd7-8c7861259df0	35	0	10	2026-10-19 18:37:53.63
4ca278e8-370f-43f5-86ed-cd15620e025b	ac489902-99c0-4699-8462-a08481adf77a	25	0	10	2026-10-19 18:37:53.635
f68ec395-bf2d-4811-bab7-739dcd9c8f89	ec4d8a96-6c32-42ee-b1c0-0c86e36d57f4	85	0	10	2026-10-19 18:37:53.639
f7c0ad50-76d2-442d-bb01-a566e6a26c51	cd2ba2f4-7563-4d54-9f90-1e6f204ecb02	70	0	10	2026-10-19 18:37:53.645
86a940e9-f7cb-4197-9575-9c940999cf2a	ef811048-02eb-45f7-aaf6-477b7f902630	80	0	10	2026-10-19 18:37:53.65
fe3a1fab-ce8a-4072-bb18-0743f1afadf7	73deb8d0-b534-4cdf-ae50-0910eb29c9af	50	0	10	2026-10-19 18:37:53.655
e18d0907-09f9-47cf-8f3c-3a8a25be5ea9	6c6759fd-fca1-427f-91c5-c76a6ef99ed5	55	0	10	2026-10-19 18:37:53.659
dfbbbafe-8cba-4e49-8c0b-bfa0ba6dd69b	fa011695-2193-4d49-a58b-db00a1969009	95	0	10	2026-10-19 18:37:53.665
c46c8af9-6959-4c8c-af1e-e8a2715b4c65	537d3db3-8bd3-45cc-9477-1c279da938d4	60	0	10	2026-10-19 18:37:53.672
be5aec92-fbc1-4da4-af4a-f6deacba91eb	5fd0c658-a1c8-4e88-a655-2e982bcfc4bf	65	0	10	2026-10-19 18:37:53.678
500d87a4-db4f-4db5-9a05-50e54f9ea4d3	1d81a3ef-6776-4ba3-94f3-b1429e357452	45	0	10	2026-10-19 18:37:53.683
86fa4663-8ef2-416b-8770-e8ac76e501db	09032f1f-1606-4346-906f-68274957f23b	80	0	10	2026-10-19 18:37:53.688
f1cecf97-dd9c-448a-b745-b30e0c99caf7	d79e3b0a-9e5f-4aaf-8c70-aa585b930775	40	0	10	2026-10-19 18:37:53.701
cb89f82e-2233-40f8-9e05-a8246727bbae	0a6d6465-6bfb-4036-881e-a904045bccfe	35	0	10	2026-10-19 18:37:53.706
0ea75cd1-c523-4b9c-8137-d00b969aafff	41292907-b9a4-4a85-820b-b572c693a949	50	0	10	2026-10-19 18:37:53.712
29e915c5-dff3-4d3f-9d60-fc19a427ecc1	6caec009-9834-4d89-8985-539dfc59dc8c	65	0	10	2026-10-19 18:37:53.718
2ef30b06-7d24-402b-92d2-f89ab4503c50	5ac21124-96ee-49f7-b599-6df11531dbd8	90	0	10	2026-10-19 18:37:53.725
69724d11-bb2c-4741-a2e9-22d24c8029a1	b795b09b-a924-4ec0-819a-42886913380f	60	0	10	2026-10-19 18:37:53.729
93e4e3a8-dbb2-45cf-b7aa-cb75ec51d40e	8c6d8142-8be0-48f8-8807-6d98722be032	75	0	10	2026-10-19 18:37:53.734
d4f3d727-9045-4f0a-87a7-19c64d596d17	b7f90340-730c-41f2-9e76-ae1734512b52	85	0	10	2026-10-19 18:37:53.746
fa5641b7-2eb1-4411-8807-077dacc8690b	3efc984d-a2cd-48d4-ad88-5b9e82b33ea5	75	0	10	2026-10-19 18:37:53.761
dd3cddff-0516-4270-92e7-f23d4548dd1a	7fa6104e-06bd-4695-a0e9-40c236835cfe	70	0	10	2026-10-19 18:37:53.772
59c8ac14-c143-419f-953a-a0d37be7f343	84a03f23-e712-47a9-a181-fa4a5d5f539e	45	0	10	2026-10-19 18:37:53.778
521cd7e4-d92b-4608-bde9-d882688139b4	05af30df-c58b-4a13-95ee-14314dfcab60	50	0	10	2026-10-19 18:37:53.793
68db5a4a-6c50-4719-936d-d8c0e024b4e2	243e32da-8600-4fe2-94cd-50c65a022a4c	65	0	10	2026-10-19 18:37:53.798
0f55c7cc-2cad-44ac-b8ee-549d1e2c9bb3	b07d4bc6-7e29-4706-b961-76e005cf53cf	40	0	10	2026-10-19 18:37:53.803
45e75d06-52fd-4e0e-95cf-711ed956450e	43ca65dc-249f-44f9-831d-52a2ceb9585a	37	0	10	2026-10-19 19:38:02.342
290f6615-8ba6-41a3-9a2b-058763a56882	73e2f419-1fbf-4aed-ad29-a3207a8431c3	64	0	10	2026-10-20 01:49:07.98
cd3c539e-b53b-466e-be9c-d84d29dd5db4	8834c36d-c77e-4128-9592-686fedbce93a	54	0	10	2026-10-20 01:55:25.21
8b63706d-ec19-4695-ab46-0b62d53a4d6e	cf71d3d4-1936-4b91-8b9f-c9d0b45505b3	59	0	10	2026-10-20 01:55:25.225
7b861e5a-084b-4243-b48c-2f986cbcce78	3824e82b-747b-4528-9fb9-6ff957be2e7c	49	0	10	2026-10-20 01:55:25.23
2ae17990-be21-420b-8bd4-45e5b71e961f	2f3f041f-4efe-4421-bc3c-67e91d690b0a	54	0	10	2026-10-20 01:55:25.234
a5e70201-f4f8-4d29-87d8-d507c34702cd	7ac216f1-bdad-4ed4-a489-f0d07cde41fd	44	0	10	2026-10-20 01:55:25.238
c9bcabd3-0950-487f-b4b5-bef8e7006de5	3188ec05-17a3-4ebc-983e-fd1cfb3f31ae	58	0	10	2026-10-20 02:42:31.234
026bc784-2a84-47c4-9661-b07fc35b0ebf	6c0d4f18-c84f-4365-be45-da8dc1a127c3	14	0	10	2026-10-20 06:38:14.911
f98c32b3-bd2f-4c32-bb70-058a6d3889bf	2256172f-595d-4edc-819c-f51d81794ed9	39	0	10	2026-10-20 06:38:14.916
07a209ac-00e7-4f4f-b5a0-56da0bc26a7a	4b6660b9-b600-4d5f-8a85-679292a5ad3c	77	0	10	2026-10-20 23:51:01.503
e226d3f3-0066-4a81-b446-f5334dcdab7a	a0343e4f-9e9c-4749-8045-306cd07514a0	58	0	10	2026-10-20 23:51:01.522
84983b95-7c81-491c-a8cd-f4e1ba398fe4	8dd0dfc2-6bf4-45d5-b221-88ab5e26a54f	28	0	10	2026-10-21 09:25:13.826
\.


--
-- Data for Name: InventoryMovement; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."InventoryMovement" (id, "inventoryId", quantity, type, reason, "referenceId", "createdAt") FROM stdin;
df7ba099-c5d7-4c11-a323-320f5c3d82ca	e90325e8-472a-4688-b65c-03c74c3c9924	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.682
5e703b53-eb50-435a-b95d-b3156007ee31	c7448b68-f6bd-490e-9fa6-b7c0f719f2d5	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.692
83d5bb04-4d93-4216-887b-5ec221395379	8489407c-8a3e-45ec-8e77-2ac279f15f0f	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.697
936ef6ac-80ce-4c01-874c-683061d38f87	a62ff125-d92d-485c-b03d-9f296f48290c	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.703
6846b7e0-ba16-447c-baf8-98ba26470a63	de640b46-963c-448b-8607-d717bd463743	25	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.708
5fc975e0-75ca-41b0-b3d1-1fdb9f1ad361	eb778587-eb7b-4dfd-be41-0fc7643b75f2	20	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.714
bda81bb9-1f10-4cc1-b9eb-96a6b43f4d84	ee5dd87f-967e-453d-bb17-73572ede5894	15	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.72
cd75d802-7c4b-465a-b6cd-31345f4b1e8f	f3e442e9-e888-47bf-9141-e18631152bd1	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.725
0b582a52-2b65-4bd0-bc02-ffb37ae9ced9	dd7978c4-4485-4ed4-9b8f-eaf86bf1c9d0	22	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.731
6266936b-48a8-4d38-958f-5ed06d2a0607	3dcae9f0-f03d-4041-adad-f3c505cc3ffa	28	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.738
ac1a11e9-9491-4150-9b0c-d056d6a4583a	da5f9c05-3d1c-4296-bc54-8d16f0e64f21	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.745
fdd79cee-95c0-48ce-8047-f48f1e252e78	8449b68a-6e5b-4de7-96bc-04ad67d82b01	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.75
44acb8f1-9fcc-4391-9d65-7394952cdc3e	63c38bc0-96cf-4cc8-b63e-e035e6868fab	12	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.756
cbc5d6e7-ecf4-44ce-b7be-e6bc6a23a6be	ab5a5730-bf30-4437-b947-01441bdaf332	18	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.762
30086648-0965-4ee6-b71b-cec0b47f14d2	3bca99ac-9b49-491b-886e-7f41a84c3988	24	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.769
f2d493e8-d806-432f-b0e2-c3ec0af92c6f	55aa7f53-b174-438f-8d69-10f3bdff4564	8	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.775
8bc3ca43-37db-4aa6-b4b2-7e84159c6973	d7b45ca5-54fa-4db6-ad62-7278a3153e4f	120	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.78
67a4be64-01b9-4105-8a24-886d75a6c5f9	192b562e-0571-467e-8cb5-673ec9c1939b	150	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.786
52b128df-5d99-45cb-96c4-82c4d1e09e13	d4aa7e06-cc10-40bb-9779-257bb1d06e39	90	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.792
5d748339-09be-4443-8f4f-76880b55ecc2	72203962-8674-4dea-8e91-0588ffe25563	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.797
34f10c00-6ff1-41ad-a881-05a79a77695c	0bc1f1e9-508a-42e1-a7c2-6846f92c77cb	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.802
b51d919d-1636-4141-b599-974d6b035a86	40d118a6-43d1-45d9-9478-7f8e695071bd	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.807
ace16c67-b723-4db7-8dab-9f466849469f	41089d35-0c86-449c-a64d-256d7f2befde	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.813
ed8bbe1d-f5e1-4f31-9b30-cd492510c07e	46d9e0b4-96b4-4f25-b76a-1bf5fdfcb51f	38	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.817
b701c816-7486-468a-ab07-8fae86e38aa1	c0c848f1-ff01-4f00-b23e-ca55fa17a895	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.823
d7547602-9228-4e89-8618-f5764df125e8	29ed9c59-3c4f-49ee-894d-dd52bb5a7235	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.828
8c975d39-c92b-4ba8-a9ca-51c5f7948265	143e63a8-f0ee-4401-aa9b-f1b2888bf405	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.834
fdd1219b-d8f0-4060-9297-c3befc1efca9	b356ebf7-988b-44e2-9057-6c6b9122d436	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.84
3a15758f-196b-4278-aa9d-b8360cef9cf6	c944cf4a-c74f-4e1c-8561-adcd6f8ef207	36	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.845
903f845f-e45d-42e7-b2bf-cdf826613793	4bb15ba6-1c79-48c7-9a97-262ff714112c	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.851
32d0a01f-d07d-4965-a9ca-dd4617d7eb9e	24c4712e-737a-4056-a23f-9bfd4662b288	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.857
6e10681a-141f-4b28-b6d2-c81eb99a6c07	703ebf94-dafe-432d-b589-4b844e95af43	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.863
3f3ad819-1356-4eb8-90ed-f1f661b2682f	82751970-819b-46c8-895f-8db2d1ab3cc1	26	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.869
492b0bb4-7685-4844-9bde-92018a58cd4f	7d111b91-8646-451d-97a6-f3a3db74549d	20	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.874
d58cd70d-fb58-4da2-8be7-05e8b9b9b88b	7e0522fa-e618-4afc-a147-e4080fc81f5a	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.879
88cd8fa9-adea-464b-8062-64dfe0734603	7a710e36-b46f-429e-9da7-33cc4b36b23d	32	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.884
b734143c-b0e3-4ed1-abf9-56a0d9fd3540	f152ae95-93b2-4c87-a622-0730b938f48e	110	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.889
b4ffafa3-af24-44e6-98a5-d4d05a371d97	328f5808-2f37-4b5c-8848-2bf24168fcba	95	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.895
6b7a521b-1de3-46a1-8438-3480000aedaa	0cf5d3f6-b49d-414d-8371-da514411f2da	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.9
487e73de-692b-4e19-a0f3-3c1aedd3ece1	09071ab9-1008-4860-963a-cb5aa58d3cf3	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.905
bd4e9109-a506-4b16-8644-afb300ba0fd0	0b5775e2-65a9-4e2d-86df-e06efd729b10	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.91
d3e82611-3f9b-479d-9db3-774f64e4f495	e18670c5-8666-4600-a38b-5df531c56cf8	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.919
1920b140-3a62-434a-b133-699e683df5e5	1592a1d2-6b74-42a9-ae37-61a61d0b23ff	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.925
86593392-bd10-497d-8196-5b2080adb446	309a7e3e-0243-4315-8c82-e405988ed168	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.93
5160fa18-d7d0-4192-8d9f-842c0f350b20	980cb42f-c40f-4d2e-b5b2-8237008c88bf	90	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.936
7dacd5e9-1521-444f-aeff-06b5f63c8f94	365b3df9-8290-4423-b7aa-d30c30839718	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.941
587cc442-bccb-4d95-97e2-f0f00b4b188e	84983b95-7c81-491c-a8cd-f4e1ba398fe4	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.947
03fb7c4e-49e7-4b17-b057-223d2415849b	fe74f9d8-eae2-4af2-bc88-db14d1ee4f8e	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.952
3316f4c4-f7ac-4acc-9b4e-d7c01f29f26f	cb1fe111-426b-462f-b3db-772edac0b2fd	25	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.958
4429429a-1dfe-4020-ab68-5fdcb42b5c1f	45e75d06-52fd-4e0e-95cf-711ed956450e	38	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.963
1e3aff10-cc04-412c-9f2f-b3dc61d78bec	026bc784-2a84-47c4-9661-b07fc35b0ebf	15	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.967
fd048399-cfc6-4aed-9433-1751a323a108	f98c32b3-bd2f-4c32-bb70-058a6d3889bf	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.972
c3f6e3c9-909c-4934-99cc-67b8e65e3eb0	0f4c520a-78f0-42ac-a4d1-5e965f455fdd	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.98
e2e6435b-cc4f-4796-a369-ab0577c1e40f	64708ea6-8b17-4de1-bb47-15c32e3f0729	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.985
5022ebb3-8750-4433-91ee-42f9ab1cd2a5	438b2920-3aaa-4b86-aad1-5a2103792a92	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.99
f1c4bde5-9f18-493c-8d93-845093b7338d	3b9d3d73-dfc5-4bfd-992e-14a8c5b9ac94	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:52.995
36de9407-d71a-4988-a19d-a248ab6cc4f5	2d722326-0e7c-490c-bcec-80933da4a7c3	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53
f433d76e-4b4a-44ff-a44e-b6f3fdf96523	ca6f2950-1029-4edd-bed7-207bd746f82f	25	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.005
85da2932-1bc7-4102-9fac-459f8e6d8e53	8de61a9c-57e6-414d-ab0a-6c8f57ccbaed	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.01
40986254-bd2b-4b13-b924-2b54717c7eb1	d4beee44-fe2c-4b43-910f-8418a95df976	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.015
4ad50eb4-2e36-4282-9e4b-8d63b0d57bf1	ef55e197-d95c-4d0a-be3c-4c460deed90e	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.02
18f97aba-d2ff-4518-8e2a-4871e3118278	49142434-5b3a-4436-9740-88bfb7d2a9a1	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.025
c96e513e-6fbc-4da9-b9aa-2a1f9d89cb5e	0688178e-c7b6-41f9-95e4-829df0ac5354	15	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.03
37f16af9-03b4-4d6d-9932-c5d8cb4f56be	444ce072-a49f-4804-ac61-28dc6e2d5084	18	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.036
5332f7f1-7a80-4db6-985a-895154a87cd2	774a59bb-0989-491a-91ef-53d8828eedc9	22	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.041
419170da-79cc-4557-9807-a092aba4f391	22511127-8bfd-456f-a293-285a24a11219	20	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.048
22b08a76-95bf-44b8-bd40-fb3a77ae893a	2eab7967-d2b3-4f0f-94b6-db7ec57153bc	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.053
ace6348b-09b2-4df2-9363-a6754bcdeb41	fc882089-76b5-4bc0-8eaf-0eae6b8d8274	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.058
3ada3055-e7eb-40bc-b47a-4eb1f3aa059c	be685e8d-ed26-42b1-8042-14f93c85310c	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.063
5fa9442e-aee8-4067-9ade-87c8345f6e7f	4c8f39bd-2151-4217-8432-5b163fa6bd92	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.069
a5a67f89-1b33-430d-ada1-36e3b5610745	b4d2ffb0-3bfe-471f-9e5b-81d88467f88d	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.074
b26b638e-8878-49fd-80af-36e33b7bf91e	c6cbfddb-d81c-43ad-b4b0-5adb8c3dd934	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.079
399e67cf-e6b6-4ca7-aff1-416d498be76d	a9ac2fb1-9b52-420b-9919-8e6e50b9ac53	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.084
a8e20942-10bb-400b-8218-60bc9ffb5bc9	936cd708-8204-4cd6-8646-45a6778e443a	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.088
84954930-41b4-424a-9ae0-ad1edec26b81	b1328c99-5bfe-4631-bae7-8156b99549e1	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.093
d4dfab06-65e9-4b79-a7ec-16ebd8b01268	e9a06ede-0a93-42d4-8f9a-ef18224cadbf	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.098
5ca891c1-60db-4756-8301-458b2c561592	d8ea51de-be91-49e7-8aba-cda78a3d1374	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.103
15ac4b2a-fa29-4585-881f-1ac9de630d2a	ebfd9bbc-f947-438d-ba10-04a198f3d45a	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.107
f137599d-2307-477b-81af-16b8b1e13e19	890189e9-0050-413d-8218-7cd6048151a6	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.116
aa29439e-c6a2-4757-bfb2-0d0fed5b1d03	d4576bc0-490b-4bbe-b3de-b1ea729c1e27	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.121
dcb17437-4e53-4aef-b516-27483f0e21f1	5df69f88-5a85-4868-a3bc-6f4533911e91	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.126
c504219f-d76c-4921-8b10-ad9626b4c11c	16cb7fe8-0896-421e-920d-06de3d459fdb	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.131
cc68ecd3-9631-45b0-832d-65bf29104a0a	21fb446e-20f7-4b74-956f-353a4e986d9b	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.136
bb9c3c9a-c3ae-4049-b82a-545f79df2322	1c0780e2-2e55-493a-8714-014ea92f5a6d	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.141
b11e3ecf-b187-4115-acb4-67083face000	ed3f0ff4-a50f-4915-a612-c0ac2bbdb98a	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.146
0a3a0c1a-5687-40f5-8d40-ec78df840c2b	e929a3ae-fee7-40a0-8e14-5010ac3dd979	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.151
409bcdbb-b818-47bc-b3c4-767b4e178088	a961f5df-d269-4823-b9e9-c9a3ac27441a	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.156
36a9a89f-33a8-4ce3-ab7b-30a009c2430b	786772c4-d8f9-4160-90d3-b91615e64f5a	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.161
fb7f2311-3d48-47a5-8be6-2f8818c6b894	e3a508ad-b837-48bb-971a-f585abd2c014	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.166
07ba9f2d-7bc5-4e8b-aadc-00318672bc78	42acf343-27f5-4dab-8596-11b4b952cca8	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.171
03e19a7c-663f-4da0-a859-9d4497f1e957	9996acd6-0c04-4f91-ae93-a51d01c7ae8b	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.177
c43d6dcf-13fd-4d53-84ad-0f8a7c8044ce	1bca8efa-c345-429f-ad90-40299db7aca4	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.182
b7d4e6c7-813d-4b37-9704-7853ddafc4ca	de072645-6565-4782-82c4-6fdcaae33546	25	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.188
ffbf8e3b-0d46-4803-afe8-b234c46e9317	ea281e91-ee9b-41a0-952a-9d4989f17113	20	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.193
bc1e109c-2d49-44ce-a3a7-22a8871e4019	7dbe6076-3e85-4041-80c0-7c11816f73a6	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.198
730889b8-fed9-450c-8d02-673e2255e14e	60784628-12f3-4c48-a41b-34feb88ebe6f	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.203
0c7e4cc8-e668-4f6d-9fdd-75a7b6698e9e	bb3d6b1e-ee39-4f1b-aa52-1384ea8f4df8	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.209
ded0bfa8-a8bb-459f-a052-f4bd7597d265	d6c42b33-5ba3-4e15-99df-710834b973b1	90	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.214
2711f803-2298-422e-8f2e-78f50762d247	20ab0a0c-026c-440e-8ab2-3a6f0cea8536	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.22
91ae81d3-2edd-4151-84cd-7aef8f4ee1d5	6326e0e4-b0eb-4f0b-9fb6-c354e7a37018	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.225
14a42bef-d81d-401a-8017-a4d763cc537d	400179f0-d6e2-4f19-88e7-10f0aa0e7445	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.23
525572c4-ad78-48c9-a439-fa526f969ca6	7fadd34a-f87a-4d39-99a6-f08f2a095392	140	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.235
a156e085-24a9-41d8-98fe-214f96b55add	d14e4bbb-c159-472e-828f-9b79a89818d1	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.24
4fbdce8e-b047-4a74-b15a-962c342ac8e9	cd2ced73-d728-4d74-ad7c-8ba46a53b7e3	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.245
4b69383b-67e7-4d69-bf38-942b942ad916	f606dee9-0126-48c3-84a8-2f77fac430c5	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.251
590ce947-8307-4272-90f1-f2c6f9d6ac12	eec05600-174b-4294-9bc5-480bd278d1e1	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.255
22874ebd-7ec0-4682-9834-a64caae5df7c	5c06a27a-8512-4d8b-9a60-0f3c3e07370f	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.261
cc46e809-2900-4393-b502-990b738ce2ae	d8991e0e-89c5-4719-860c-6801f8e9e31c	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.266
0d7a939a-f13b-4a29-a9f2-0dde18d23cff	5c52ae7c-60a9-4a4a-a289-24ab84c5cf3b	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.271
0fef8766-d514-4a2d-8029-4777668145d0	d1361102-6a5b-47b7-b9f9-f04d821aa651	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.276
84fb9e60-893e-4a94-93ec-0d704284589d	7cd4d186-ffc4-4810-bedd-51b3609153f2	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.282
3c0fdced-791b-46db-946e-9bc06452b284	78cb0a0d-da1f-4227-9ef4-e5e897503722	120	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.287
4abdaf41-6846-4684-89f2-e07b0b8ef89f	eb093d29-426d-4922-9490-7f2c01dd48e0	110	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.292
7c4c9756-24eb-437f-a669-4d1f6f977b2b	0fc34993-ab1e-472b-9ff2-1f4f865bf2ff	130	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.297
85080577-a3ed-4df3-9774-507a5633f751	b2b787d2-4de4-4dd8-af4c-a2ab04ff0c7d	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.302
62b582ac-57ff-4f56-9e66-74ca8df266b7	73bfcb2e-c2a5-4e58-94eb-d57d2f55b58f	95	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.307
f8dcb22f-8aa5-4b52-a696-32d836b724ac	c357700a-3965-46ab-94fa-7f18c32ada50	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.312
9dd63884-1c97-44f1-979d-6708f40d2c93	9a11d2fb-62bd-41b3-a9eb-d788c627f25e	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.317
00f58b9b-94c9-4b31-bf1d-4d3d1c28e38d	8eaa99e1-c269-40e8-8d0b-3dee4f0df3c4	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.322
38e20f0e-1a18-4df2-886f-1762f95e64f8	2ac1b5dd-c3a2-402c-9da3-6a144320cbb5	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.328
184e4f40-279f-4225-8fd3-67092e199357	1ca21b94-28fa-4323-879f-37d790dab402	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.333
a8247f06-aa6e-4d8d-ac5b-7928dfd96600	19871942-771b-413e-a21d-e948c72669ea	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.338
0edff9db-8d6e-44c1-9523-bc920804946f	9f99fe64-c51b-4552-8f11-7d549d261f9d	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.343
6aa1f09b-23fc-40c6-b068-c70fcf5b1d82	bdb54615-5645-4136-8f8a-15d5cd161c64	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.348
00bc7bce-c8c8-4173-b2ba-f00a63694012	f2aa7ed7-2882-456c-b48d-af19076d39a7	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.353
bd045c31-e852-46da-bb3d-ec9bb55551fe	45e08854-99fb-4f36-b883-196232435f58	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.358
86f3f312-2015-4059-acf9-964bc4ba8d60	3004bcfe-e51a-4917-b021-e2ff16ac52b6	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.363
4da024a3-b085-4b94-bbd2-293aae53c8f8	21e820be-54bf-454d-a000-d5dcf8276dc6	95	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.368
10627188-333e-4f3e-b85f-77bb96523207	51f3646c-d026-483d-8f55-9631904acc75	100	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.374
3c24853a-980f-4def-a862-63d7b2c9f627	64261194-7cf2-4b3e-9915-28739cc1eb67	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.379
3cd55f99-4b20-41c4-8fbe-08263c54b852	766a6500-d437-4de5-9044-07e3d8e3c699	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.384
cdf33808-37bc-41f9-9227-e171692f28c3	a10a0877-baa1-4739-bd2e-366703ae5d6a	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.389
7e781976-ba3e-4c66-bc43-de8a6eb077a6	51fe2b3f-aeea-4f8f-a6f6-9a53a08a8ec2	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.394
5be1fadd-b63a-4407-a611-b8e8a34af946	a3cd58d1-078d-43f6-a86e-8b12bec84469	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.399
bc66832e-9ea8-4e53-8cb7-06aab44b357b	387fc02d-1829-4068-9b17-19ba0d70ac89	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.404
e1651b74-3c92-4157-be49-a1fb69cfdef1	ccd7adcd-aadb-431a-b1da-f179a6a66d03	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.409
c8117273-9638-4d32-b392-304a42e3efb8	c5da3e28-b874-4581-a0f4-3a72957517be	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.415
b2fce533-5d2e-48d7-8e30-dbb5c0a003d6	916ca4db-429a-4ba5-9135-d04da47e579e	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.42
a07ba8d7-7449-4fc7-b546-e81c70d4ab9d	8303583c-d4b7-4fa3-97ec-228aaedcc251	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.425
f6434dbc-2ec8-4fb1-8972-0d3f34efd826	89fac30a-d57b-4963-b5cf-ab0a8f17276b	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.431
40459923-516e-4242-bd34-40f65180024b	8221c082-0400-43d7-b293-74f951688341	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.437
80e0ec3d-8b96-40ce-8b4e-a13569b08a83	a19a8ecb-5e01-4223-889f-cf0b90550870	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.442
6499ddb3-6a8f-42b7-b1bb-c6a14307b422	6e42d2b5-45fd-4dbe-9880-28f2c95a0dd3	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.447
e0fd750b-1119-4440-858d-b2dc95141f48	a5e70201-f4f8-4d29-87d8-d507c34702cd	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.452
25767fe6-65f8-4abb-b089-da8fab5ca45a	2ae17990-be21-420b-8bd4-45e5b71e961f	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.457
1441f181-6682-4500-8441-7fe416c1ee87	8b63706d-ec19-4695-ab46-0b62d53a4d6e	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.462
95c84b11-bfa4-4c13-9f24-2fc7a868bd12	7b861e5a-084b-4243-b48c-2f986cbcce78	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.471
9d2cc9d2-5e05-44c6-a7f0-b761cc7bf9a9	418471f7-3b0d-4e35-8531-0a243a0beb7d	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.476
67528374-e0a2-495b-9678-ca8ac849a429	a0c629fa-5caa-4651-a771-97dfa799b133	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.481
8e1848c6-837b-44c6-9288-514446a4de9b	2e616453-10a1-4856-b49b-b2a54cf35316	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.486
a0682704-367e-48b3-9bba-730c8a90afea	3b17893b-ace8-4e09-b9d3-77818233a2a0	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.491
9aea3db6-5e6f-45ca-b7ea-b54c2bdec9df	8ca8aba0-a394-42e2-8122-3ff1ad105984	25	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.496
6e544f0c-2f4c-4b70-b62a-432aba6a815f	ba996bbc-5eff-471c-9b64-6f0eea461610	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.501
dbccecfc-b028-4f32-b161-7776181c3db3	36e30f7b-00cc-43ce-b09e-d5f9bef8e2ce	110	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.505
88e4c794-d6cd-4656-b57c-435acb4af5e6	ecfca35b-f8b1-435d-a877-32348ba40bb0	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.51
bd204770-62e4-4998-8d2a-0b27619ac741	56bf42c1-7d91-4c55-ae4f-0e268aea0e4c	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.515
71a42eb1-c2ec-4d12-b37b-08c71f301e08	46823506-7f5b-4fc4-a2cd-7a1eb4480f83	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.52
b953ae37-93bd-4bba-9732-cbe0322f525a	4160e648-ecc8-4eda-b2dc-077cf30a4745	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.526
12054086-5c0d-4831-a717-5d5e297b82c8	43a36e7d-bbe7-45b0-8920-c7ef1bfe7401	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.531
179f63d1-b619-4442-8216-02e68ab24eaf	fa06704c-211a-477c-ae01-2b3674f87f71	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.537
4eaabcb7-f7d6-4b21-b85b-311f1338ba2f	85a47228-0b12-4c40-a2fa-2b6b3da29c5b	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.543
87b6a469-38a7-44b5-8056-aeb468e16ee6	72bf46d6-fb62-48dc-9e83-43384d159408	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.548
762363be-8856-4e96-ac36-24425a2a30ef	817b41bf-76d1-4fe3-a07d-eb0feaf25c33	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.553
b01ef7bc-0e34-474b-8106-481593887593	520548f7-adf1-4841-b648-c2ccc515b0a0	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.558
6c6434cc-bcfb-4735-8521-5048ea4e59fa	7c5edf35-2680-446d-a8a2-e5b94d70ac53	30	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.563
c87f1e83-2864-4a76-ad20-bb1b6ef83c7e	9daa8c58-3dfa-4add-998d-0b4b789f3afb	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.569
b6772ba4-d73e-490a-872c-3cdbdb88d102	a9e2fbe4-d3db-4d5f-ab40-2b2576bf763e	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.574
55d8b9a4-813f-4c55-9ead-78014235ffe4	f167b3b2-8b52-416e-a7aa-215440ecf3c2	90	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.579
da9a33ff-b562-43b3-9f53-4b04ffc2fe7b	f30c3b7e-8607-4ac0-a486-9f1113ca5f63	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.584
d44dee84-bd32-4fc1-803d-fbc37f776d8f	86c2bf07-e8cd-4546-ac86-f1e266e6f764	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.589
eac3320c-5ceb-4623-b281-6640d29957fd	26a159c7-6e32-44f5-9f59-c31fcffbfb31	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.594
7e1138ed-da3f-4783-92b9-a06e594bef95	796544d2-a76d-40b1-a094-0030110b52db	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.599
1d2e1ab7-72c5-4386-9d39-3a3c22f1008c	92f4ccac-16fb-4906-9803-794c1abd4955	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.604
92fa2137-a1db-47d3-a0e4-0b3b197b180c	5d7b21de-f188-4a1b-be97-8e6c8f0cc5e2	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.609
72ce4008-d340-4e26-92a4-2f6195653764	866b4ee0-8345-4393-a2d6-1c1f1200ff38	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.615
2262ddb0-b13a-484c-a5fd-74088ed55f42	772d51c9-8791-49c6-ab0e-00857ca7896f	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.619
88c40fe7-2926-42dc-bcf5-67f279a9323e	01b008bb-48e1-404d-91d1-bdc39060bfb9	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.625
9cf4604e-bdc8-4fa2-a548-3c0a12ffae6f	4d36fd05-6172-4ab3-a7dd-4206452948d6	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.63
9904ef37-3f74-4679-85d3-c937966f4539	4ca278e8-370f-43f5-86ed-cd15620e025b	25	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.635
b29c8951-1ffe-4185-a795-cc6a4f7b1c94	f68ec395-bf2d-4811-bab7-739dcd9c8f89	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.639
0f917598-3a21-46ea-915d-c40e59eb1187	f7c0ad50-76d2-442d-bb01-a566e6a26c51	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.645
201b962d-46fb-46da-a93b-11904e67a2ea	86a940e9-f7cb-4197-9575-9c940999cf2a	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.65
5aad9d8f-3b7f-4711-a79e-9e1845ca128c	fe3a1fab-ce8a-4072-bb18-0743f1afadf7	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.655
0e42f86a-4296-4c03-bccd-813b91e0f75e	e18d0907-09f9-47cf-8f3c-3a8a25be5ea9	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.659
9ce1c92f-bc78-44f1-8e6f-c90cc5127004	dfbbbafe-8cba-4e49-8c0b-bfa0ba6dd69b	95	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.665
f86cbefa-e725-4247-9f16-01902c452003	c46c8af9-6959-4c8c-af1e-e8a2715b4c65	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.672
b1f2ce6f-8022-42b8-af61-d917b299a9b6	be5aec92-fbc1-4da4-af4a-f6deacba91eb	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.678
8abf9e48-a41a-4789-a27f-8499cb15ad17	500d87a4-db4f-4db5-9a05-50e54f9ea4d3	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.683
f46446c9-d3ec-42c5-88ea-d41e59bc8027	86fa4663-8ef2-416b-8770-e8ac76e501db	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.688
29c117cc-ad3c-44b4-9f6a-5d660d2720be	f1cecf97-dd9c-448a-b745-b30e0c99caf7	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.701
c2983866-c700-4e33-90f7-cef6423c7683	cb89f82e-2233-40f8-9e05-a8246727bbae	35	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.706
ee67721f-fff0-4dd5-8dbd-138513f18307	0ea75cd1-c523-4b9c-8137-d00b969aafff	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.712
24545b47-85fd-40a1-bdb2-6746b1f6faff	29e915c5-dff3-4d3f-9d60-fc19a427ecc1	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.718
78af6072-981a-4815-8cc6-54e576fca513	2ef30b06-7d24-402b-92d2-f89ab4503c50	90	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.725
d20ff887-a7cb-4cf4-8198-4772d93256be	69724d11-bb2c-4741-a2e9-22d24c8029a1	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.729
22c5645d-380b-46c0-bb97-0f9c9dc38351	93e4e3a8-dbb2-45cf-b7aa-cb75ec51d40e	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.734
695e3f97-c0a3-4cc8-96a2-59a730aca09b	d4f3d727-9045-4f0a-87a7-19c64d596d17	85	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.746
3963f2a2-7ed4-4bde-b2a3-099f6953c943	e226d3f3-0066-4a81-b446-f5334dcdab7a	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.751
5d909ada-9480-48d3-a5e0-28a9821d0276	07a209ac-00e7-4f4f-b5a0-56da0bc26a7a	80	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.756
76d8ee9a-75f5-43d8-9b80-e41af1f9e91d	fa5641b7-2eb1-4411-8807-077dacc8690b	75	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.761
1fa2bbce-8992-4791-a122-2377273047ec	290f6615-8ba6-41a3-9a2b-058763a56882	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.767
3b99e0ca-46ff-4989-a1fa-d03f9aa9f09e	dd3cddff-0516-4270-92e7-f23d4548dd1a	70	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.772
41f9ae63-30f4-4653-b82a-b4af92bafd6e	59c8ac14-c143-419f-953a-a0d37be7f343	45	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.778
db008d5c-f4c7-4311-ba71-197d49872cb5	c9bcabd3-0950-487f-b4b5-bef8e7006de5	60	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.782
24d65280-07ae-4504-83d9-36579fe19259	cd3c539e-b53b-466e-be9c-d84d29dd5db4	55	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.788
a057c5ea-448b-4b97-bb61-22bd3aaf2902	521cd7e4-d92b-4608-bde9-d882688139b4	50	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.793
40c35539-28fb-4de3-8e6d-ba4cf8f135ce	68db5a4a-6c50-4719-936d-d8c0e024b4e2	65	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.798
dec8276d-89c6-4e26-8214-41f554d0004e	0f55c7cc-2cad-44ac-b8ee-549d1e2c9bb3	40	RESTOCK	Initial opening stock batch	\N	2026-10-19 18:37:53.803
0f7d9c86-2d50-40f9-b2f1-952fccc98dbb	45e75d06-52fd-4e0e-95cf-711ed956450e	-1	ORDER_RESERVE	Order PRN-20261019-8468 placed by customer	PRN-20261019-8468	2026-10-19 19:38:02.351
6b67afa4-46b2-4d32-9838-19a266f53f98	290f6615-8ba6-41a3-9a2b-058763a56882	-1	ORDER_RESERVE	Order PRN-20261020-1251 placed by customer	PRN-20261020-1251	2026-10-20 01:49:07.996
24df2351-50c0-4cf1-bbed-712c7f29e030	cd3c539e-b53b-466e-be9c-d84d29dd5db4	-1	ORDER_RESERVE	Order PRN-20261020-3520 placed by customer	PRN-20261020-3520	2026-10-20 01:55:25.218
60dca06d-06f1-4945-a67c-3c47ed2ff9d2	cb1fe111-426b-462f-b3db-772edac0b2fd	-1	ORDER_RESERVE	Order PRN-20261020-3520 placed by customer	PRN-20261020-3520	2026-10-20 01:55:25.224
44ca8d23-7e6f-45b3-8066-bcac9ec1ed44	8b63706d-ec19-4695-ab46-0b62d53a4d6e	-1	ORDER_RESERVE	Order PRN-20261020-3520 placed by customer	PRN-20261020-3520	2026-10-20 01:55:25.229
db0ec496-77bb-47e0-9128-a8f10380d1bf	7b861e5a-084b-4243-b48c-2f986cbcce78	-1	ORDER_RESERVE	Order PRN-20261020-3520 placed by customer	PRN-20261020-3520	2026-10-20 01:55:25.233
b1fd923c-e5a3-4bfb-bcfa-f8294605f191	2ae17990-be21-420b-8bd4-45e5b71e961f	-1	ORDER_RESERVE	Order PRN-20261020-3520 placed by customer	PRN-20261020-3520	2026-10-20 01:55:25.237
caa49197-ffde-44e9-bf48-8e27ec7471e9	a5e70201-f4f8-4d29-87d8-d507c34702cd	-1	ORDER_RESERVE	Order PRN-20261020-3520 placed by customer	PRN-20261020-3520	2026-10-20 01:55:25.24
52e15c2f-cb23-4ebf-ab78-4fc7bb7401ad	c9bcabd3-0950-487f-b4b5-bef8e7006de5	-2	ORDER_RESERVE	Order PRN-20261020-2091 placed by customer	PRN-20261020-2091	2026-10-20 02:42:31.242
31654b02-3526-494e-83c7-5bc0985acbbb	cb1fe111-426b-462f-b3db-772edac0b2fd	-1	ORDER_RESERVE	Order PRN-20261020-9447 placed by customer	PRN-20261020-9447	2026-10-20 06:38:14.893
957239bb-cdd8-42d8-a793-74266696bd6e	84983b95-7c81-491c-a8cd-f4e1ba398fe4	-1	ORDER_RESERVE	Order PRN-20261020-9447 placed by customer	PRN-20261020-9447	2026-10-20 06:38:14.909
6e80ba83-6a54-4e01-9041-dd6142bb4c0c	026bc784-2a84-47c4-9661-b07fc35b0ebf	-1	ORDER_RESERVE	Order PRN-20261020-9447 placed by customer	PRN-20261020-9447	2026-10-20 06:38:14.914
6c8687c2-6f66-4c7c-8fea-972a548ac711	f98c32b3-bd2f-4c32-bb70-058a6d3889bf	-1	ORDER_RESERVE	Order PRN-20261020-9447 placed by customer	PRN-20261020-9447	2026-10-20 06:38:14.918
6b1319b7-0f98-4193-b304-4ab880e82c01	07a209ac-00e7-4f4f-b5a0-56da0bc26a7a	-3	ORDER_RESERVE	Order PRN-20261020-6285 placed by customer	PRN-20261020-6285	2026-10-20 23:51:01.516
67073720-435c-45c1-810e-7928779a3160	e226d3f3-0066-4a81-b446-f5334dcdab7a	-2	ORDER_RESERVE	Order PRN-20261020-6285 placed by customer	PRN-20261020-6285	2026-10-20 23:51:01.533
493c9df3-35f2-4865-8c75-ad5737d34894	cb1fe111-426b-462f-b3db-772edac0b2fd	-1	ORDER_RESERVE	Order PRN-20261021-3063 placed by customer	PRN-20261021-3063	2026-10-21 09:25:13.812
9262c993-ae6b-443c-ad37-ffd04c9999d4	fe74f9d8-eae2-4af2-bc88-db14d1ee4f8e	-1	ORDER_RESERVE	Order PRN-20261021-3063 placed by customer	PRN-20261021-3063	2026-10-21 09:25:13.825
7e751796-381f-45b5-a381-be109316475f	84983b95-7c81-491c-a8cd-f4e1ba398fe4	-1	ORDER_RESERVE	Order PRN-20261021-3063 placed by customer	PRN-20261021-3063	2026-10-21 09:25:13.83
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Notification" (id, "userId", title, message, "isRead", type, data, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Order" (id, "orderNumber", "customerId", "storeId", "addressId", status, "paymentMethod", "paymentStatus", subtotal, "deliveryFee", tax, discount, total, "specialInstructions", "createdAt", "updatedAt") FROM stdin;
fdd9f347-a831-4b1a-92c2-df7a49d29e19	PRN-20261013-0001	b09cf1b7-d197-4264-b32a-e22ffda3ee6f	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	cc0c503a-5c43-4131-8155-a383741eab3c	DELIVERED	COD	COMPLETED	326	25	16.3	0	367.3	\N	2026-10-19 15:37:53.807	2026-10-19 18:37:53.809
95cd705b-9570-47ed-af39-41ff04e6a1ec	PRN-20261019-8468	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	dc9451f0-005f-4e9a-89e3-dee40dd86896	8d923f00-c3d4-4888-b18d-ab721254d8ed	DELIVERED	COD	PENDING	125	25	6.25	0	156.25	\N	2026-10-19 19:38:02.356	2026-10-19 19:38:20.879
e813102e-1581-4e12-8ee4-32526adadaad	PRN-20261020-3520	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	dc9451f0-005f-4e9a-89e3-dee40dd86896	8d923f00-c3d4-4888-b18d-ab721254d8ed	DELIVERED	COD	PENDING	1245	25	62.25	0	1332.25	\N	2026-10-20 01:55:25.242	2026-10-20 01:56:29.093
3d8f9363-4e76-48af-bafb-5f7eb64571ed	PRN-20261013-0002	70ee4ac9-dec0-4d90-a3dd-3002c24fc33a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	fb49fb18-b0c5-449e-895b-0b2dd14fcc0f	DELIVERED	TEST_PAYMENT	COMPLETED	550	25	27.5	0	602.5	\N	2026-10-19 18:22:53.822	2026-10-20 01:56:38.343
2a432ae1-f9a5-40df-89f1-bebac422b4e7	PRN-20261020-2091	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2a58bd88-3dba-4725-ab86-dbb48abee090	8d923f00-c3d4-4888-b18d-ab721254d8ed	DELIVERED	COD	PENDING	160	25	8	0	193	\N	2026-10-20 02:42:31.25	2026-10-20 02:43:15.288
cbed899d-a070-4f94-987e-300169f94f33	PRN-20261020-1251	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	dc9451f0-005f-4e9a-89e3-dee40dd86896	8d923f00-c3d4-4888-b18d-ab721254d8ed	DELIVERED	COD	PENDING	95	25	4.75	0	124.75	\N	2026-10-20 01:49:08.007	2026-10-20 02:49:33.044
7211dfa3-2f01-4284-a3fa-9b122cf1490d	PRN-20261013-0003	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	04edcaf7-ab7f-4b15-b118-3b4d557bf3ec	DELIVERED	COD	PENDING	290	25	14.5	0	329.5	\N	2026-10-19 18:12:53.828	2026-10-20 02:49:35.832
455a2b15-fa86-4fca-8e3f-ac94b86ce81c	PRN-20261020-9447	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2a58bd88-3dba-4725-ab86-dbb48abee090	8d923f00-c3d4-4888-b18d-ab721254d8ed	DELIVERED	COD	PENDING	310	25	15.5	0	350.5	gate 2	2026-10-20 06:38:14.92	2026-10-20 06:39:32.921
8a2d5719-341d-4b98-a62d-2a8a392b28a1	PRN-20261020-6285	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2a58bd88-3dba-4725-ab86-dbb48abee090	8d923f00-c3d4-4888-b18d-ab721254d8ed	OUT_FOR_DELIVERY	COD	PENDING	865	25	43.25	0	933.25	\N	2026-10-20 23:51:01.536	2026-10-20 23:51:37.693
1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	PRN-20261021-3063	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2a58bd88-3dba-4725-ab86-dbb48abee090	8d923f00-c3d4-4888-b18d-ab721254d8ed	DELIVERED	COD	PENDING	154	25	7.7	0	186.7	\N	2026-10-21 09:25:13.834	2026-10-21 09:28:55.062
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."OrderItem" (id, "orderId", "productId", "productName", "unitPrice", quantity, subtotal) FROM stdin;
cd654378-e13c-422c-a63d-a30e3705c6f5	fdd9f347-a831-4b1a-92c2-df7a49d29e19	a651883d-dddb-4b0c-86da-3d0ab7f662db	Shimla Fresh Royal Apples	180	1	180
8a65f977-db03-4c78-aede-38794275e02d	fdd9f347-a831-4b1a-92c2-df7a49d29e19	48a2d932-eea5-4c71-987d-a88114e62c39	Robusta Yellow Bananas	48	2	96
066e4851-5805-4cca-bd00-f351cc9d2c91	fdd9f347-a831-4b1a-92c2-df7a49d29e19	41a268b8-f6c3-4f0f-a4dd-ab90a1080bff	Zespri Green Kiwi	120	1	120
7d918a6f-9cb9-44b1-afa2-2e526665a43e	3d8f9363-4e76-48af-bafb-5f7eb64571ed	e999e1a8-eb98-4712-8fe3-a158742c7bbf	Fresh Mosambi (Sweet Lime)	90	2	180
b44ecaea-ccd7-4102-83d3-f3a23c7ef6c8	7211dfa3-2f01-4284-a3fa-9b122cf1490d	01a2ab5c-c35b-48df-a5b6-637ea000d3d9	Mahabaleshwar Fresh Strawberries	160	1	160
ad6626a0-dc44-431e-8d94-3e11fe5672b5	7211dfa3-2f01-4284-a3fa-9b122cf1490d	d7b79eeb-1516-4bd7-be6e-530d5aa17664	Exotic Red Dragon Fruit	135	2	270
9dc12d39-cc22-4af6-acdb-ede9bd5f9e47	95cd705b-9570-47ed-af39-41ff04e6a1ec	43ca65dc-249f-44f9-831d-52a2ceb9585a	Amul Diced Mozzarella Pizza Cheese	125	1	125
7df683ec-2005-4a3d-9245-95cf03c9bc1a	cbed899d-a070-4f94-987e-300169f94f33	73e2f419-1fbf-4aed-ad29-a3207a8431c3	Colin Glass & Surface Cleaner Spray	95	1	95
54e1cc75-8df1-4dec-9a0d-f8edbb91ec7b	e813102e-1581-4e12-8ee4-32526adadaad	8834c36d-c77e-4128-9592-686fedbce93a	Odonil Lavender Bloom Room Air Freshener	55	1	55
4e1ec20e-0de5-4ed4-aeaa-4f8d7b548a13	e813102e-1581-4e12-8ee4-32526adadaad	ccb4186e-1f7d-47bd-a665-bac126e16837	Epigamia Greek Yogurt (Blueberry)	50	1	50
3a3c1680-4dd4-486f-91e2-e63a7496a5e4	e813102e-1581-4e12-8ee4-32526adadaad	cf71d3d4-1936-4b91-8b9f-c9d0b45505b3	BRU Instant Coffee Chicory Mix	220	1	220
f7e9f880-77c7-4369-ad3c-5201e4a4ae91	e813102e-1581-4e12-8ee4-32526adadaad	3824e82b-747b-4528-9fb9-6ff957be2e7c	Cadbury Bournvita Chocolate Health Drink	235	1	235
46d20d7f-081d-4f4e-9cdf-b21c0e28be4f	e813102e-1581-4e12-8ee4-32526adadaad	2f3f041f-4efe-4421-bc3c-67e91d690b0a	Nescafe Classic 100% Pure Instant Coffee	340	1	340
873cc0e7-6608-4f3b-a49f-28ad70916bb6	e813102e-1581-4e12-8ee4-32526adadaad	7ac216f1-bdad-4ed4-a489-f0d07cde41fd	Taj Mahal Premium Rich Tea	345	1	345
3054fd98-e425-42c0-8782-c4efb2b847f5	2a432ae1-f9a5-40df-89f1-bebac422b4e7	3188ec05-17a3-4ebc-983e-fd1cfb3f31ae	Good Knight Gold Flash Mosquito Liquid Refill	80	2	160
a9b5ad01-3d57-4246-a6f5-5fd56c3c83ac	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	ccb4186e-1f7d-47bd-a665-bac126e16837	Epigamia Greek Yogurt (Blueberry)	50	1	50
1f20f9e2-17f8-46ee-be5f-d12ec16ff6ee	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	8dd0dfc2-6bf4-45d5-b221-88ab5e26a54f	Organic Brown Eggs	75	1	75
9f727c7f-3188-43fa-8cfe-bd76ca79a81c	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	6c0d4f18-c84f-4365-be45-da8dc1a127c3	Fresh Danedar Mawa / Khoya	120	1	120
80d9f347-0cb6-4b4f-9645-663f2e03977d	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	2256172f-595d-4edc-819c-f51d81794ed9	Amul Fresh Cream	65	1	65
d7a32a22-ad23-4821-957c-5a6b8974a05d	8a2d5719-341d-4b98-a62d-2a8a392b28a1	4b6660b9-b600-4d5f-8a85-679292a5ad3c	Harpic Power Plus Disinfectant Toilet Cleaner	185	3	555
8037bcfb-7eb7-4bb8-928b-3d72ab1c1171	8a2d5719-341d-4b98-a62d-2a8a392b28a1	a0343e4f-9e9c-4749-8045-306cd07514a0	Pril Lime Degreasing Dishwash Liquid	155	2	310
6ecdbaea-01a6-4b7b-b87f-bd0b69bd82bb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	ccb4186e-1f7d-47bd-a665-bac126e16837	Epigamia Greek Yogurt (Blueberry)	50	1	50
06fdc9e0-596f-453a-b6e2-24c328b3f816	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	3f6d065b-8473-4fca-94e4-0b891204198a	Amul Cow Milk	29	1	29
e8e39446-f791-4979-87e1-1b3e192d2040	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	8dd0dfc2-6bf4-45d5-b221-88ab5e26a54f	Organic Brown Eggs	75	1	75
\.


--
-- Data for Name: OrderStatusHistory; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."OrderStatusHistory" (id, "orderId", status, "changedById", notes, "createdAt") FROM stdin;
db6ffe98-fc78-47d2-9fe8-f867caa8e9bf	fdd9f347-a831-4b1a-92c2-df7a49d29e19	PENDING	\N	Order placed by customer	2026-10-19 15:37:53.807
49d68662-7ed5-4c6a-8298-ccb13dd96dee	fdd9f347-a831-4b1a-92c2-df7a49d29e19	CONFIRMED	57a9b2ca-949f-4c4b-8a9b-0cd0d36aef2b	Store accepted order	2026-10-19 15:39:53.807
a50f35f1-59d0-47ab-8cec-f2f59fdcbd6d	fdd9f347-a831-4b1a-92c2-df7a49d29e19	PREPARING	57a9b2ca-949f-4c4b-8a9b-0cd0d36aef2b	Items packed into bag	2026-10-19 15:43:53.807
c233f198-f1a3-4a72-9789-3288812f1e90	fdd9f347-a831-4b1a-92c2-df7a49d29e19	READY_FOR_PICKUP	57a9b2ca-949f-4c4b-8a9b-0cd0d36aef2b	Order ready for rider pickup	2026-10-19 15:47:53.807
2db4b3aa-dd11-44aa-bad8-efd483a9de83	fdd9f347-a831-4b1a-92c2-df7a49d29e19	ASSIGNED	fc387773-1641-4192-ad6d-ba2cae006f5b	Assigned to Amit Kumar	2026-10-19 15:48:53.807
987e44c4-93fa-4c5a-ac1f-157e3beb9447	fdd9f347-a831-4b1a-92c2-df7a49d29e19	PICKED_UP	e5a7ff9c-0a5a-4e61-a120-c4aa49e8baee	Rider picked up parcel	2026-10-19 15:52:53.807
04109560-df9f-4e10-b11a-59e7a77a71e4	fdd9f347-a831-4b1a-92c2-df7a49d29e19	OUT_FOR_DELIVERY	e5a7ff9c-0a5a-4e61-a120-c4aa49e8baee	Rider on the way to customer doorstep	2026-10-19 15:55:53.807
b2cb634e-e6f8-4fdb-87fc-5ec74c9a6a63	fdd9f347-a831-4b1a-92c2-df7a49d29e19	DELIVERED	e5a7ff9c-0a5a-4e61-a120-c4aa49e8baee	Delivered at doorstep and payment collected	2026-10-19 16:05:53.807
6506e144-69fd-41ea-9bdf-793b41f4e0f3	3d8f9363-4e76-48af-bafb-5f7eb64571ed	PENDING	\N	Order placed via Test Online Payment	2026-10-19 18:22:53.822
21d05788-490c-42d7-80ac-8e0f34ea5263	7211dfa3-2f01-4284-a3fa-9b122cf1490d	PENDING	\N	Order placed by customer	2026-10-19 18:12:53.828
3678a256-7920-427d-bb11-42d08a779965	7211dfa3-2f01-4284-a3fa-9b122cf1490d	CONFIRMED	eb6a3d16-cc72-41f3-ada1-2a99785680ad	Accepted by merchant	2026-10-19 18:14:53.828
a9943921-c3d2-4b69-9066-d43e1ff12763	7211dfa3-2f01-4284-a3fa-9b122cf1490d	PREPARING	eb6a3d16-cc72-41f3-ada1-2a99785680ad	Packing items in carry bag	2026-10-19 18:18:53.828
f241bd6d-d241-4f16-a174-3a5dc2f428f6	7211dfa3-2f01-4284-a3fa-9b122cf1490d	READY_FOR_PICKUP	eb6a3d16-cc72-41f3-ada1-2a99785680ad	Awaiting delivery partner assignment	2026-10-19 18:22:53.828
62c672b3-1a2d-42aa-aaae-e04373feb65e	95cd705b-9570-47ed-af39-41ff04e6a1ec	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-19 19:38:02.356
1b1fdfed-0921-4b0d-8069-43dfac3bd870	95cd705b-9570-47ed-af39-41ff04e6a1ec	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-19 19:38:19.303
0872356d-153f-411d-b110-3c2b72bf7ac1	95cd705b-9570-47ed-af39-41ff04e6a1ec	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-19 19:38:19.986
c4073146-1a4d-478e-995c-ab09c20b33b9	95cd705b-9570-47ed-af39-41ff04e6a1ec	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-19 19:38:20.489
62d79e3f-0db8-470a-bab2-a00c2caeeb83	95cd705b-9570-47ed-af39-41ff04e6a1ec	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered at doorstep and payment completed	2026-10-19 19:38:20.879
9f01bacc-3ebb-4963-8383-88397a50d4e0	3d8f9363-4e76-48af-bafb-5f7eb64571ed	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-19 19:38:21.783
ba918a24-7c14-47fa-b681-f127c47de832	3d8f9363-4e76-48af-bafb-5f7eb64571ed	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-19 19:38:22.457
ed1a9cab-ee78-49d5-98fa-1a850d62dca5	cbed899d-a070-4f94-987e-300169f94f33	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-20 01:49:08.007
6ec754e1-1631-410a-b696-0166538771ff	e813102e-1581-4e12-8ee4-32526adadaad	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-20 01:55:25.242
a7916b5a-9835-4d3e-928c-c690c53a7133	e813102e-1581-4e12-8ee4-32526adadaad	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-20 01:56:15.865
53825baa-75ed-44f6-bf64-944bcb44d78f	e813102e-1581-4e12-8ee4-32526adadaad	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-20 01:56:19.206
55cfdac1-d451-4fd1-9d0b-870faf480020	e813102e-1581-4e12-8ee4-32526adadaad	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 01:56:23.393
0e1e8b81-38b6-475d-9857-02ffc0da4b19	e813102e-1581-4e12-8ee4-32526adadaad	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered at doorstep and payment completed	2026-10-20 01:56:29.093
2947f3af-1a06-47ef-b109-de7ac382f006	3d8f9363-4e76-48af-bafb-5f7eb64571ed	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 01:56:33.688
148932ed-3859-4eb4-af4c-378888a7b49d	3d8f9363-4e76-48af-bafb-5f7eb64571ed	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered at doorstep and payment completed	2026-10-20 01:56:38.343
19fb0204-e826-4781-bb93-fea9c905e186	2a432ae1-f9a5-40df-89f1-bebac422b4e7	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-20 02:42:31.25
f7f63935-1952-42ff-9b8e-4d49f2d5d1df	2a432ae1-f9a5-40df-89f1-bebac422b4e7	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-20 02:42:55.177
9c4c2fdc-18cd-4783-9d3e-046d2bc4f88b	2a432ae1-f9a5-40df-89f1-bebac422b4e7	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-20 02:43:07.092
68c534cb-4939-491f-a9a3-aff2935cb405	2a432ae1-f9a5-40df-89f1-bebac422b4e7	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 02:43:08.136
b3fea2ff-a852-44d9-a05d-37d94b0a637b	2a432ae1-f9a5-40df-89f1-bebac422b4e7	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered at doorstep and payment completed	2026-10-20 02:43:15.288
ac0d5956-7598-4ea4-acb0-2b1cc62a7e79	cbed899d-a070-4f94-987e-300169f94f33	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-20 02:43:16.639
c2e64d4e-6433-4bc0-ad19-cf0a562df19d	cbed899d-a070-4f94-987e-300169f94f33	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-20 02:49:30.612
bc63d4a2-8609-484e-9e80-e4e43c315441	cbed899d-a070-4f94-987e-300169f94f33	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 02:49:32.353
9e72dea2-9040-4893-b0b2-ce4a54e16e72	cbed899d-a070-4f94-987e-300169f94f33	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered at doorstep and payment completed	2026-10-20 02:49:33.044
4d621fb2-2423-459b-b3fd-339127c04b3d	7211dfa3-2f01-4284-a3fa-9b122cf1490d	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-20 02:49:34.191
7e97c347-ea79-4e7c-b4ea-80b85475f565	7211dfa3-2f01-4284-a3fa-9b122cf1490d	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-20 02:49:34.872
f5f95bcc-9161-4d09-bef3-ba10229aa502	7211dfa3-2f01-4284-a3fa-9b122cf1490d	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 02:49:35.357
a0f40c27-b068-4993-a79c-25944ee4b025	7211dfa3-2f01-4284-a3fa-9b122cf1490d	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered at doorstep and payment completed	2026-10-20 02:49:35.832
844b536b-f787-4569-8b1f-2f7246f6f8a7	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-20 06:38:14.92
19753f96-fbbb-426c-91eb-db4c1426e4b0	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-20 06:38:33.12
c0045407-0c11-4a93-b80a-bd08c1dd6125	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-20 06:38:53.182
6937dbe7-525a-4fa5-ac92-a3758d43ef25	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 06:39:00.128
2424c374-dad4-4988-95ea-5f2a3fa9f37b	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered with OTP 9447	2026-10-20 06:39:32.921
4d07761c-64cd-4014-a09c-020a517c24d9	8a2d5719-341d-4b98-a62d-2a8a392b28a1	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-20 23:51:01.536
fc2d8406-c4e4-4aa0-99fb-5bfe928e1baf	8a2d5719-341d-4b98-a62d-2a8a392b28a1	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-20 23:51:17.983
639213f6-1437-46b1-8519-f091b197b57d	8a2d5719-341d-4b98-a62d-2a8a392b28a1	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-20 23:51:36.678
878eb40e-2595-46f4-83cb-006c90cd254d	8a2d5719-341d-4b98-a62d-2a8a392b28a1	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-20 23:51:37.693
8e0d157f-bda8-4a0d-ba7a-58a1800b6d27	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	PENDING	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	Order placed by customer	2026-10-21 09:25:13.834
53fe08db-9a5c-466b-90a4-e1c03cc1a783	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	ASSIGNED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivery request accepted by Prerna Panel Delivery Partner (DL 01 EX 2026)	2026-10-21 09:27:44.027
43a2f8d9-590f-4db9-8e2d-33be1ecc1c3c	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	PICKED_UP	11df1583-048f-4692-99cf-cb05179c6dfb	Rider picked up package at store	2026-10-21 09:28:24.781
875423f2-735a-4fa0-94a6-b891a224fceb	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	OUT_FOR_DELIVERY	11df1583-048f-4692-99cf-cb05179c6dfb	Rider on way to doorstep	2026-10-21 09:28:26.267
99f4795f-13d7-4345-bbbc-f72bd39496a3	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	DELIVERED	11df1583-048f-4692-99cf-cb05179c6dfb	Delivered with OTP 3063	2026-10-21 09:28:55.062
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."PasswordResetToken" (id, "tokenHash", email, "expiresAt", used, "createdAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Payment" (id, "orderId", method, status, amount, "transactionRef", "rawResponse", "createdAt", "updatedAt") FROM stdin;
deb33ceb-ed28-4999-a96a-6a5597462ecd	fdd9f347-a831-4b1a-92c2-df7a49d29e19	COD	COMPLETED	367.3	COD-CASH-RECVD	\N	2026-10-19 18:37:53.809	2026-10-19 18:37:53.809
1133f583-6053-4c14-935e-f4f769d99b3e	95cd705b-9570-47ed-af39-41ff04e6a1ec	COD	COMPLETED	156.25	COD-PRN-20261019-8468	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-19T19:38:02.338Z"}	2026-10-19 19:38:02.356	2026-10-19 19:38:20.87
9ad46a7a-219c-4dbf-a80b-2a0f9be829ae	e813102e-1581-4e12-8ee4-32526adadaad	COD	COMPLETED	1332.25	COD-PRN-20261020-3520	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-20T01:55:25.186Z"}	2026-10-20 01:55:25.242	2026-10-20 01:56:29.088
b9686c3e-ef3a-41df-8eec-6c82f4616d16	3d8f9363-4e76-48af-bafb-5f7eb64571ed	TEST_PAYMENT	COMPLETED	602.5	TEST_PAY_TXN_998273	\N	2026-10-19 18:37:53.823	2026-10-20 01:56:38.336
7c827b09-c3e3-4b97-a182-17db2d00164b	2a432ae1-f9a5-40df-89f1-bebac422b4e7	COD	COMPLETED	193	COD-PRN-20261020-2091	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-20T02:42:31.229Z"}	2026-10-20 02:42:31.25	2026-10-20 02:43:15.282
c53eafd8-c3ad-41f4-a66f-1fdae4b83e86	cbed899d-a070-4f94-987e-300169f94f33	COD	COMPLETED	124.75	COD-PRN-20261020-1251	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-20T01:49:07.975Z"}	2026-10-20 01:49:08.007	2026-10-20 02:49:33.036
4c8d67fa-6883-4fc5-a111-1a69cca46ad0	7211dfa3-2f01-4284-a3fa-9b122cf1490d	COD	COMPLETED	329.5	\N	\N	2026-10-19 18:37:53.829	2026-10-20 02:49:35.824
b68c94a2-e3c6-4082-91ac-31a768794e00	455a2b15-fa86-4fca-8e3f-ac94b86ce81c	COD	COMPLETED	350.5	COD-PRN-20261020-9447	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-20T06:38:14.877Z"}	2026-10-20 06:38:14.92	2026-10-20 06:39:32.915
6f64fb6c-20cf-40d6-a40a-7b80087d8ec5	8a2d5719-341d-4b98-a62d-2a8a392b28a1	COD	PENDING	933.25	COD-PRN-20261020-6285	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-20T23:51:01.497Z"}	2026-10-20 23:51:01.536	2026-10-20 23:51:01.536
c6b592f4-1e6d-437f-86dd-c645b2845914	1ae2f74e-b2cf-4785-bb6e-4c703ea15e42	COD	COMPLETED	186.7	COD-PRN-20261021-3063	{"mode":"CASH_ON_DELIVERY","message":"Payment to be collected in cash upon doorstep delivery","timestamp":"2026-10-21T09:25:13.766Z"}	2026-10-21 09:25:13.834	2026-10-21 09:28:55.049
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Product" (id, "storeId", "categoryId", name, slug, description, price, mrp, unit, sku, "isActive", "createdAt", "updatedAt") FROM stdin;
a651883d-dddb-4b0c-86da-3d0ab7f662db	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1474106f-d095-43a6-9912-5a1abde4d8da	Shimla Fresh Royal Apples	shimla-fresh-royal-apples	Crisp, sweet, and aromatic red apples from Himachal orchards.	180	220	1 kg (approx 4-5 pcs)	FRU-APP-001	t	2026-10-19 18:37:52.682	2026-10-19 18:37:52.682
48a2d932-eea5-4c71-987d-a88114e62c39	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1474106f-d095-43a6-9912-5a1abde4d8da	Robusta Yellow Bananas	robusta-yellow-bananas	Naturally ripened, potassium-rich fresh yellow bananas.	48	60	1 kg (approx 6 pcs)	FRU-BAN-002	t	2026-10-19 18:37:52.692	2026-10-19 18:37:52.692
9941ab22-31bd-4009-bdae-dc08be66b8d8	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1474106f-d095-43a6-9912-5a1abde4d8da	Fresh Nagpur Oranges	fresh-nagpur-oranges	Sweet, juicy and rich in natural Vitamin C.	95	120	1 kg	FRU-ORA-003	t	2026-10-19 18:37:52.697	2026-10-19 18:37:52.697
cd1419d5-f3b5-4a9b-ad77-b5f4cc738400	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1474106f-d095-43a6-9912-5a1abde4d8da	Ruby Pomegranate (Anar)	ruby-pomegranate-anar	Ruby red arils bursting with antioxidants and sweet juice.	210	260	1 kg (3-4 pcs)	FRU-POM-004	t	2026-10-19 18:37:52.703	2026-10-19 18:37:52.703
c55e5714-3c24-4ac4-8a5d-3ab9edfabd1d	2a58bd88-3dba-4725-ab86-dbb48abee090	1474106f-d095-43a6-9912-5a1abde4d8da	Fresh Ripe Papaya	fresh-ripe-papaya	Sweet and digestive-friendly semi-ripe orange papaya.	55	70	1 pc (approx 1 kg)	FRU-PAP-005	t	2026-10-19 18:37:52.708	2026-10-19 18:37:52.708
b2ab66d7-09c4-4cfb-93b1-dc6362c570fa	2a58bd88-3dba-4725-ab86-dbb48abee090	1474106f-d095-43a6-9912-5a1abde4d8da	Kiran Seedless Watermelon	kiran-seedless-watermelon	Crisp, refreshing and deep red sweet watermelon.	85	110	1 pc (approx 2.5 kg)	FRU-WAT-006	t	2026-10-19 18:37:52.714	2026-10-19 18:37:52.714
ea2a5cbf-5c3f-42a4-96dc-a11e7cc938df	2a58bd88-3dba-4725-ab86-dbb48abee090	1474106f-d095-43a6-9912-5a1abde4d8da	Fresh Alphonso Mangoes	fresh-alphonso-mangoes	King of mangoes with rich saffron pulp and heavenly aroma.	450	550	1 kg (approx 3 pcs)	FRU-MAN-007	t	2026-10-19 18:37:52.72	2026-10-19 18:37:52.72
69df3b08-19ed-4eed-b50e-66b23aa8e681	2a58bd88-3dba-4725-ab86-dbb48abee090	1474106f-d095-43a6-9912-5a1abde4d8da	Thompson Seedless Green Grapes	thompson-seedless-green-grapes	Crisp, sweet, and washed seedless green table grapes.	110	140	500 g box	FRU-GRA-008	t	2026-10-19 18:37:52.725	2026-10-19 18:37:52.725
6d3c8686-bf0b-4035-a0fa-ee31c574fad4	dc9451f0-005f-4e9a-89e3-dee40dd86896	1474106f-d095-43a6-9912-5a1abde4d8da	Queen Juicy Pineapple	queen-juicy-pineapple	Fresh tropical pineapple peeled and ready for slicing.	75	95	1 pc (approx 800 g)	FRU-PIN-009	t	2026-10-19 18:37:52.731	2026-10-19 18:37:52.731
bc55e1ad-b6bb-44ff-aeba-84001584dd2e	dc9451f0-005f-4e9a-89e3-dee40dd86896	1474106f-d095-43a6-9912-5a1abde4d8da	Allahabad Guava (Amrood)	allahabad-guava-amrood	Sweet white-fleshed crunchy guavas packed with fiber.	65	85	1 kg	FRU-GUA-010	t	2026-10-19 18:37:52.738	2026-10-19 18:37:52.738
41a268b8-f6c3-4f0f-a4dd-ab90a1080bff	dc9451f0-005f-4e9a-89e3-dee40dd86896	1474106f-d095-43a6-9912-5a1abde4d8da	Zespri Green Kiwi	zespri-green-kiwi	Tangy and vitamin-dense imported green kiwis.	120	150	3 pcs pack	FRU-KIW-011	t	2026-10-19 18:37:52.745	2026-10-19 18:37:52.745
e999e1a8-eb98-4712-8fe3-a158742c7bbf	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1474106f-d095-43a6-9912-5a1abde4d8da	Fresh Mosambi (Sweet Lime)	fresh-mosambi-sweet-lime	Perfect citrus fruit for morning juicing and hydration.	90	115	1 kg (5-6 pcs)	FRU-MOS-012	t	2026-10-19 18:37:52.75	2026-10-19 18:37:52.75
01a2ab5c-c35b-48df-a5b6-637ea000d3d9	2a58bd88-3dba-4725-ab86-dbb48abee090	1474106f-d095-43a6-9912-5a1abde4d8da	Mahabaleshwar Fresh Strawberries	mahabaleshwar-fresh-strawberries	Farm fresh succulent aromatic strawberries.	160	200	200 g punnet	FRU-STR-013	t	2026-10-19 18:37:52.756	2026-10-19 18:37:52.756
d7b79eeb-1516-4bd7-be6e-530d5aa17664	dc9451f0-005f-4e9a-89e3-dee40dd86896	1474106f-d095-43a6-9912-5a1abde4d8da	Exotic Red Dragon Fruit	exotic-red-dragon-fruit	Nutrient-rich exotic fruit with vibrant pink pulp.	135	175	1 pc (approx 350 g)	FRU-DRA-014	t	2026-10-19 18:37:52.762	2026-10-19 18:37:52.762
d7ed3810-76c9-4296-b4ff-e824e752d03a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1474106f-d095-43a6-9912-5a1abde4d8da	Kashmir Green Pears (Nashpati)	kashmir-green-pears	Crisp, juicy and mildly sweet high-fiber green pears.	115	140	1 kg	FRU-PEA-015	t	2026-10-19 18:37:52.769	2026-10-19 18:37:52.769
5e4186da-b4d0-4c74-a48a-9170f8dab89f	2a58bd88-3dba-4725-ab86-dbb48abee090	1474106f-d095-43a6-9912-5a1abde4d8da	Granny Smith Green Apples	granny-smith-green-apples	Tart, crisp green apples ideal for salads and smoothies.	230	280	4 pcs pack (approx 600g)	FRU-GAP-016	t	2026-10-19 18:37:52.775	2026-10-19 18:37:52.775
df86cd8e-b135-401c-96fb-13326a5f11d3	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Nasik Red Onions (Pyaaz)	nasik-red-onions	Pungent, dry, and quality cooking onions for daily curries.	38	50	1 kg	VEG-ONI-001	t	2026-10-19 18:37:52.78	2026-10-19 18:37:52.78
b3514a8b-3040-4906-9f00-0dbb1df8ff23	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Agra Potato (Aloo)	agra-potato-aloo	Firm, unsprouted starchy potatoes for boiling and frying.	28	35	1 kg	VEG-POT-002	t	2026-10-19 18:37:52.786	2026-10-19 18:37:52.786
bb30627d-a4e1-41c5-9f30-7cfcd1c96a39	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Hybrid Red Tomatoes (Tamatar)	hybrid-red-tomatoes	Plump, firm and juicy red cooking tomatoes.	32	45	1 kg	VEG-TOM-003	t	2026-10-19 18:37:52.792	2026-10-19 18:37:52.792
47d67654-23b1-4ea9-9805-cef38180f1d5	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Ginger (Adrak)	fresh-ginger-adrak	Clean, spicy, and fibrous rhizome for tea and curries.	45	60	250 g	VEG-GIN-004	t	2026-10-19 18:37:52.797	2026-10-19 18:37:52.797
0e1e430f-fd78-4aac-89d0-af903dc3bf9d	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Peeled Garlic Cloves (Lehsun)	peeled-garlic-cloves	Aromatic and fresh white garlic pods ready for seasoning.	55	75	200 g pack	VEG-GAR-005	t	2026-10-19 18:37:52.802	2026-10-19 18:37:52.802
08f97677-4e96-480e-8178-f930eff362ae	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Green Chillies (Hari Mirch)	fresh-green-chillies	Spicy, crunchy green chillies picked fresh.	20	28	100 g	VEG-CHI-006	t	2026-10-19 18:37:52.807	2026-10-19 18:37:52.807
437b0a39-18a8-4d6f-8098-7b21745bfcef	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Cauliflower (Gobhi)	fresh-cauliflower-gobhi	Clean, dense white cauliflower head with green leaves.	42	55	1 pc (approx 600 g)	VEG-CAU-007	t	2026-10-19 18:37:52.813	2026-10-19 18:37:52.813
7a43b8d4-4337-4a6b-a458-08845abcbb12	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Green Cabbage (Patta Gobhi)	green-cabbage-patta-gobhi	Crisp green tightly packed round cabbage.	30	40	1 pc (approx 700 g)	VEG-CAB-008	t	2026-10-19 18:37:52.817	2026-10-19 18:37:52.817
35d4ce5b-f6f1-45d2-abf9-fe5a9faf6d4a	dc9451f0-005f-4e9a-89e3-dee40dd86896	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Red Crunchy Carrots (Gajar)	red-crunchy-carrots	Sweet, tender red carrots ideal for salads and halwa.	42	55	1 kg	VEG-CAR-009	t	2026-10-19 18:37:52.823	2026-10-19 18:37:52.823
b6984c5c-37ed-4c5f-9f8c-5bd0b3b6c723	dc9451f0-005f-4e9a-89e3-dee40dd86896	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Green Peas (Matar)	fresh-green-peas-matar	Sweet, plump green pods freshly harvested.	65	85	500 g	VEG-PEA-010	t	2026-10-19 18:37:52.828	2026-10-19 18:37:52.828
365fe12b-a759-45a1-93e2-0edf8fa2975a	dc9451f0-005f-4e9a-89e3-dee40dd86896	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Farm Fresh Spinach (Palak)	farm-fresh-spinach-palak	Tender dark green leafy spinach leaves.	25	35	250 g bunch	VEG-SPI-011	t	2026-10-19 18:37:52.834	2026-10-19 18:37:52.834
eb5fd2b3-b823-4685-a5d3-20656c99196c	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Lady Finger (Bhindi)	lady-finger-bhindi	Tender, bright green okras perfect for dry sabzi.	48	62	500 g	VEG-LAD-012	t	2026-10-19 18:37:52.84	2026-10-19 18:37:52.84
05f9d474-e1b4-448e-a4e6-a59c328a1743	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Crisp Green Capsicum (Shimla Mirch)	crisp-green-capsicum	Firm, glossy green bell peppers for noodles and stir fry.	45	60	500 g	VEG-CAP-013	t	2026-10-19 18:37:52.845	2026-10-19 18:37:52.845
1a21fb45-4968-408b-80e3-25bef8f57213	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Salad Cucumber (Kheera)	salad-cucumber-kheera	Crunchy, refreshing hydrating salad cucumbers.	35	48	500 g	VEG-CUC-014	t	2026-10-19 18:37:52.851	2026-10-19 18:37:52.851
f14b7d90-4a21-4ef0-adf5-d9284004d24a	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Coriander (Dhaniya)	fresh-coriander-dhaniya	Aromatic fresh green coriander leaves for garnishing.	15	22	100 g bunch	VEG-COR-015	t	2026-10-19 18:37:52.857	2026-10-19 18:37:52.857
c160d9ea-8fc4-48a6-80ff-bdc2622ad5bc	dc9451f0-005f-4e9a-89e3-dee40dd86896	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Juicy Yellow Lemons (Nimbu)	juicy-yellow-lemons	Fresh, tangy, and juicy yellow citrus lemons.	25	35	4 pcs pack	VEG-LEM-016	t	2026-10-19 18:37:52.863	2026-10-19 18:37:52.863
fecc47fb-2523-4cee-a95b-2eda5212c770	dc9451f0-005f-4e9a-89e3-dee40dd86896	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Bottle Gourd (Lauki)	bottle-gourd-lauki	Light, tender light green bottle gourd for healthy soups.	35	48	1 pc (approx 700 g)	VEG-BOT-017	t	2026-10-19 18:37:52.869	2026-10-19 18:37:52.869
5012a008-cb7d-47fd-9c15-4bc49b4957ff	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Bitter Gourd (Karela)	bitter-gourd-karela	Fresh spiky dark green bitter gourds packed with nutrients.	40	55	500 g	VEG-BIT-018	t	2026-10-19 18:37:52.874	2026-10-19 18:37:52.874
8e360a4e-fdb7-4ac5-85d3-0edfb702c247	2a58bd88-3dba-4725-ab86-dbb48abee090	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	Fresh Beetroot (Chukandar)	fresh-beetroot-chukandar	Earthy, deep crimson sweet beetroots for healthy salads.	38	50	500 g	VEG-BEE-019	t	2026-10-19 18:37:52.879	2026-10-19 18:37:52.879
75a1c505-a1f6-42c2-9bd0-f0b7f1100c7c	dc9451f0-005f-4e9a-89e3-dee40dd86896	43db93f6-d00e-4d8e-a40b-fbc9eb451e9c	American Sweet Corn Cobs	american-sweet-corn-cobs	Sweet, juicy and tender yellow corn cobs with husk.	45	60	2 pcs pack	VEG-COR-020	t	2026-10-19 18:37:52.884	2026-10-19 18:37:52.884
aa6f4370-611e-4977-b80a-eb6a4912bd2a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Gold Full Cream Milk	amul-gold-full-cream-milk	Pasteurized homogenized 6.0% fat rich milk.	33	34	500 ml pouch	DAI-MIL-001	t	2026-10-19 18:37:52.889	2026-10-19 18:37:52.889
37a9546b-9185-4b3c-8d87-decb471ba112	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Mother Dairy Toned Milk	mother-dairy-toned-milk	Nutritious everyday 3.0% fat pasteurized milk.	27	28	500 ml pouch	DAI-MIL-002	t	2026-10-19 18:37:52.895	2026-10-19 18:37:52.895
c618f820-2ad5-4b53-84f4-5164277f82ad	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Pasteurized Salted Butter	amul-pasteurized-salted-butter	Utterly butterly delicious classic salted table butter.	56	58	100 g block	DAI-BUT-003	t	2026-10-19 18:37:52.9	2026-10-19 18:37:52.9
33a214ab-0f00-45bc-b17c-a8fd4e9fd4d3	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Fresh Malai Paneer	amul-fresh-malai-paneer	Soft, succulent, protein-rich cottage cheese.	90	95	200 g pack	DAI-PAN-004	t	2026-10-19 18:37:52.905	2026-10-19 18:37:52.905
0fa6ef38-aa48-4134-bbd0-b53be4e196fb	2a58bd88-3dba-4725-ab86-dbb48abee090	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Mother Dairy Classic Dahi	mother-dairy-classic-dahi	Thick, creamy and probiotic natural curd.	35	35	400 g cup	DAI-DAH-005	t	2026-10-19 18:37:52.91	2026-10-19 18:37:52.91
2444af02-1267-4672-9821-13d22a974744	2a58bd88-3dba-4725-ab86-dbb48abee090	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Processed Cheese Slices	amul-processed-cheese-slices	Creamy cheese slices ideal for grilled sandwiches and burgers.	140	150	200 g (10 slices)	DAI-CHE-006	t	2026-10-19 18:37:52.919	2026-10-19 18:37:52.919
7cbaf302-5d85-4ffa-b96b-67f76ee128e7	2a58bd88-3dba-4725-ab86-dbb48abee090	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Farm Fresh White Eggs	farm-fresh-white-eggs-6	Clean, sanitized, protein-packed grade-A table eggs.	46	55	6 pcs pack	DAI-EGG-007	t	2026-10-19 18:37:52.925	2026-10-19 18:37:52.925
c9dbe7ec-94f3-49f3-ba7a-681e6a8619f1	2a58bd88-3dba-4725-ab86-dbb48abee090	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Farm Fresh White Eggs (Crate)	farm-fresh-white-eggs-30	Wholesale value tray of 30 clean nutritious poultry eggs.	210	250	30 pcs tray	DAI-EGG-008	t	2026-10-19 18:37:52.93	2026-10-19 18:37:52.93
d3ac5ace-f9f7-4887-b16f-c69dfda58e18	dc9451f0-005f-4e9a-89e3-dee40dd86896	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Spiced Masala Buttermilk (Chaas)	amul-spiced-masala-buttermilk	Cooling digestive drink with jeera, ginger and salt.	15	15	250 ml pack	DAI-CHA-009	t	2026-10-19 18:37:52.936	2026-10-19 18:37:52.936
0475cf7d-0a0f-4edd-beb3-09da04901502	dc9451f0-005f-4e9a-89e3-dee40dd86896	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Kool Kesar Badam Drink	amul-kool-kesar-badam-drink	Chilled saffron and almond infused delicious milk.	30	30	200 ml bottle	DAI-KOL-010	t	2026-10-19 18:37:52.941	2026-10-19 18:37:52.941
8dd0dfc2-6bf4-45d5-b221-88ab5e26a54f	dc9451f0-005f-4e9a-89e3-dee40dd86896	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Organic Brown Eggs	organic-brown-eggs	Free-range grain-fed hens brown farm eggs.	75	90	6 pcs pack	DAI-BEG-011	t	2026-10-19 18:37:52.947	2026-10-19 18:37:52.947
3f6d065b-8473-4fca-94e4-0b891204198a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Cow Milk	amul-cow-milk	Pure, easily digestible cow milk with 3.5% fat.	29	30	500 ml pouch	DAI-COW-012	t	2026-10-19 18:37:52.952	2026-10-19 18:37:52.952
ccb4186e-1f7d-47bd-a665-bac126e16837	2a58bd88-3dba-4725-ab86-dbb48abee090	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Epigamia Greek Yogurt (Blueberry)	epigamia-greek-yogurt-blueberry	Thick, low-fat artisanal Greek yogurt with fruit pulp.	50	50	90 g cup	DAI-GYO-013	t	2026-10-19 18:37:52.958	2026-10-19 18:37:52.958
43ca65dc-249f-44f9-831d-52a2ceb9585a	dc9451f0-005f-4e9a-89e3-dee40dd86896	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Diced Mozzarella Pizza Cheese	amul-diced-mozzarella-pizza-cheese	Perfect stretch and melt mozzarella cheese for homemade pizza.	125	135	200 g pouch	DAI-MOZ-014	t	2026-10-19 18:37:52.963	2026-10-19 18:37:52.963
6c0d4f18-c84f-4365-be45-da8dc1a127c3	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Fresh Danedar Mawa / Khoya	fresh-danedar-mawa-khoya	Freshly condensed rich milk solid for Indian sweets and desserts.	120	140	250 g pack	DAI-MAW-015	t	2026-10-19 18:37:52.967	2026-10-19 18:37:52.967
2256172f-595d-4edc-819c-f51d81794ed9	2a58bd88-3dba-4725-ab86-dbb48abee090	8ce9085a-94eb-45ac-9e12-6ad6aa695df1	Amul Fresh Cream	amul-fresh-cream	Low fat cooking cream for dal makhani, pasta, and desserts.	65	70	250 ml pack	DAI-CRM-016	t	2026-10-19 18:37:52.972	2026-10-19 18:37:52.972
e72efdf2-cd2d-48de-992f-48eaa4b8cc0e	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Harvest Gold White Sandwich Bread	harvest-gold-white-bread	Soft, fresh baked daily white bread with goodness of wheat.	40	45	400 g pack	BAK-WHI-001	t	2026-10-19 18:37:52.98	2026-10-19 18:37:52.98
d088fb18-4843-4589-9213-60fd1a07f2ac	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Harvest Gold 100% Atta Whole Wheat Bread	harvest-gold-atta-bread	Wholesome brown atta bread with natural fiber.	50	55	450 g pack	BAK-ATT-002	t	2026-10-19 18:37:52.985	2026-10-19 18:37:52.985
e31b332e-3ebc-41a4-8f1a-bbdcaa9f940f	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	63c0bb5c-7c15-4952-90db-d101d12bc1cd	English Oven Multigrain Bread	english-oven-multigrain-bread	Enriched with linseed, sesame, oats, and sunflower seeds.	65	70	400 g pack	BAK-MUL-003	t	2026-10-19 18:37:52.99	2026-10-19 18:37:52.99
cee5075c-62cd-4cde-86c5-a00367c08484	2a58bd88-3dba-4725-ab86-dbb48abee090	63c0bb5c-7c15-4952-90db-d101d12bc1cd	English Oven Soft Burger Buns	english-oven-burger-buns	Fluffy sesame seeded buns for homemade burgers.	35	40	4 pcs pack (300 g)	BAK-BUR-004	t	2026-10-19 18:37:52.995	2026-10-19 18:37:52.995
7074ec46-2b5a-4a17-84fe-084994a4a9d2	2a58bd88-3dba-4725-ab86-dbb48abee090	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Fresh Mumbai Ladi Pav	fresh-mumbai-ladi-pav	Pillowy soft pav buns ideal for pav bhaji and vada pav.	30	35	6 pcs pack	BAK-PAV-005	t	2026-10-19 18:37:53	2026-10-19 18:37:53
ef8a59ef-b653-4e89-b4b5-2bc55554e982	2a58bd88-3dba-4725-ab86-dbb48abee090	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Fresh Herb Garlic Bread Loaf	fresh-herb-garlic-bread-loaf	Aromatic baguette flavored with crushed garlic and oregano.	55	65	200 g loaf	BAK-GAR-006	t	2026-10-19 18:37:53.005	2026-10-19 18:37:53.005
b7a787a7-1706-45b5-a594-fee77bc9a682	dc9451f0-005f-4e9a-89e3-dee40dd86896	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Britannia Premium Bake Rusk	britannia-bake-rusk	Crunchy twice-baked tea time rusk with cardamom aroma.	45	50	300 g pack	BAK-RUS-007	t	2026-10-19 18:37:53.01	2026-10-19 18:37:53.01
a91a4c89-da68-480d-a1cb-066fb10f9719	dc9451f0-005f-4e9a-89e3-dee40dd86896	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Milk Toast Crunchy Rusks	milk-toast-crunchy-rusks	Crisp golden rusks baked with pure milk solids.	35	40	200 g pack	BAK-MLK-008	t	2026-10-19 18:37:53.015	2026-10-19 18:37:53.015
ba487692-123f-47c7-b0ee-1133e7ddf5c8	dc9451f0-005f-4e9a-89e3-dee40dd86896	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Winkies Vanilla Sponge Tea Cake	winkies-vanilla-sponge-tea-cake	Moist, melt-in-mouth soft vanilla cake for evening tea.	40	45	150 g bar	BAK-CAK-009	t	2026-10-19 18:37:53.02	2026-10-19 18:37:53.02
bc6d1e46-9be2-4df3-bc0a-17ea06ddf235	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	63c0bb5c-7c15-4952-90db-d101d12bc1cd	English Oven Sweet Tutti Frutti Bread	english-oven-tutti-frutti-bread	Delightful sweet bread dotted with colorful candied fruits.	45	50	350 g loaf	BAK-FRU-010	t	2026-10-19 18:37:53.025	2026-10-19 18:37:53.025
6d3738ca-aa1d-43b3-95a3-94168a56dced	2a58bd88-3dba-4725-ab86-dbb48abee090	63c0bb5c-7c15-4952-90db-d101d12bc1cd	French Butter Croissants	french-butter-croissants	Flaky, buttery layered artisanal oven-baked croissants.	90	110	2 pcs pack	BAK-CRO-011	t	2026-10-19 18:37:53.03	2026-10-19 18:37:53.03
6fa8e816-f665-4bfc-87bf-c90563e3f635	dc9451f0-005f-4e9a-89e3-dee40dd86896	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Sesame Bagels Pack	sesame-bagels-pack	Chewy, golden toasted boiled bagels with roasted sesame.	70	85	2 pcs pack	BAK-BAG-012	t	2026-10-19 18:37:53.036	2026-10-19 18:37:53.036
c7a41a64-2748-40ad-a38f-871513bbe531	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Whole Wheat Pita Bread Pockets	whole-wheat-pita-bread	Soft pockets ready for falafel, hummus, and salad fillings.	60	75	4 pcs pack	BAK-PIT-013	t	2026-10-19 18:37:53.041	2026-10-19 18:37:53.041
029b8cbe-5996-400e-a576-06b1ab82d3e8	2a58bd88-3dba-4725-ab86-dbb48abee090	63c0bb5c-7c15-4952-90db-d101d12bc1cd	Chocolate Chip Oven Muffins	chocolate-chip-oven-muffins	Fresh soft bakery muffins filled with melted dark chocolate chips.	60	70	2 pcs pack (140 g)	BAK-MUF-014	t	2026-10-19 18:37:53.048	2026-10-19 18:37:53.048
02ce6e43-cb68-45fe-aff3-2798df163050	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Aashirvaad Shudh Chakki Atta	aashirvaad-shudh-chakki-atta-5kg	100% pure whole wheat stone ground flour for fluffy rotis.	235	265	5 kg bag	GRN-ATT-001	t	2026-10-19 18:37:53.053	2026-10-19 18:37:53.053
d3c30fd3-1994-4524-90e3-abb5f9609098	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Fortune Chakki Fresh Atta	fortune-chakki-fresh-atta-10kg	Natural dietary fiber rich whole wheat flour.	420	480	10 kg bag	GRN-ATT-002	t	2026-10-19 18:37:53.058	2026-10-19 18:37:53.058
cee8074c-b468-4409-b052-497c50848ae5	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	India Gate Basmati Rice Feast	india-gate-basmati-rice-feast-5kg	Aged long-grain aromatic basmati rice for royal biryanis.	495	590	5 kg bag	GRN-RIC-003	t	2026-10-19 18:37:53.063	2026-10-19 18:37:53.063
db3674eb-e3c8-4006-91d5-20e51890f3eb	2a58bd88-3dba-4725-ab86-dbb48abee090	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Daawat Rozana Gold Basmati Rice	daawat-rozana-gold-basmati-rice-1kg	Everyday fluffy fragrant basmati rice.	95	120	1 kg pouch	GRN-RIC-004	t	2026-10-19 18:37:53.069	2026-10-19 18:37:53.069
82ca3881-c9c9-4e4c-866e-ef496d619359	2a58bd88-3dba-4725-ab86-dbb48abee090	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Tata Sampann Unpolished Toor Dal	tata-sampann-toor-dal-1kg	Unpolished protein-rich arhar pigeon pea lentils.	175	210	1 kg pouch	GRN-DAL-005	t	2026-10-19 18:37:53.074	2026-10-19 18:37:53.074
edba199b-8bc1-48b4-b59d-103dd11b8dc1	2a58bd88-3dba-4725-ab86-dbb48abee090	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Tata Sampann Yellow Moong Dal	tata-sampann-yellow-moong-dal-1kg	Clean, split skinless yellow moong lentils.	135	160	1 kg pouch	GRN-DAL-006	t	2026-10-19 18:37:53.079	2026-10-19 18:37:53.079
85fafba3-0007-46e7-b6bd-caf312b7b7ef	dc9451f0-005f-4e9a-89e3-dee40dd86896	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Unpolished Chana Dal	unpolished-chana-dal-1kg	Split Bengal gram pulses rich in essential iron and protein.	98	120	1 kg pouch	GRN-DAL-007	t	2026-10-19 18:37:53.084	2026-10-19 18:37:53.084
ea487ec6-f206-4a1f-bbce-3305be1bd80e	dc9451f0-005f-4e9a-89e3-dee40dd86896	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Tata Sampann Urad Dal (Dhuli)	tata-sampann-urad-dal-dhuli-1kg	Washed white split black gram for idli, dosa, and vada batter.	155	185	1 kg pouch	GRN-DAL-008	t	2026-10-19 18:37:53.088	2026-10-19 18:37:53.088
d5dce57d-e9be-4778-908c-f88022903cd9	dc9451f0-005f-4e9a-89e3-dee40dd86896	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Red Masoor Dal (Malka)	red-masoor-dal-malka-1kg	Quick-cooking red split lentils for comforting soups and dal.	96	115	1 kg pouch	GRN-DAL-009	t	2026-10-19 18:37:53.093	2026-10-19 18:37:53.093
98820aa8-20af-4408-a4bd-516a1b6b39e1	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Chitra Rajma (Kidney Beans)	chitra-rajma-kidney-beans-1kg	Premium soft-boiling spotted red kidney beans.	165	195	1 kg pouch	GRN-PUL-010	t	2026-10-19 18:37:53.098	2026-10-19 18:37:53.098
4199cc23-15e8-45e8-89f9-1c811fc5f266	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Kabuli Chana (Chole)	kabuli-chana-chole-1kg	Large grain white chickpeas ideal for authentic Punjabi chole.	150	180	1 kg pouch	GRN-PUL-011	t	2026-10-19 18:37:53.103	2026-10-19 18:37:53.103
18a5b661-421c-47cb-a20e-ee71f9643b65	2a58bd88-3dba-4725-ab86-dbb48abee090	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Tata Sampann Thick Poha	tata-sampann-thick-poha-1kg	High-fiber flattened rice flakes for quick morning breakfast.	62	75	1 kg pouch	GRN-POH-012	t	2026-10-19 18:37:53.107	2026-10-19 18:37:53.107
975b636e-e7a8-4f85-83ae-56d35d4f4b76	2a58bd88-3dba-4725-ab86-dbb48abee090	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Rajdhani Pure Sooji / Rava	rajdhani-pure-sooji-rava-500g	Coarsely ground durum wheat semolina for upma and halwa.	32	38	500 g pouch	GRN-SOO-013	t	2026-10-19 18:37:53.116	2026-10-19 18:37:53.116
c4a4e602-60b4-4e4c-9f4c-943f5780f4d8	dc9451f0-005f-4e9a-89e3-dee40dd86896	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Fortune Fine Besan (Gram Flour)	fortune-fine-besan-500g	100% chana dal flour for crispy pakoras, sweets, and cheela.	58	68	500 g pouch	GRN-BES-014	t	2026-10-19 18:37:53.121	2026-10-19 18:37:53.121
66d45283-fc18-4838-b4da-03be5e9b43c1	dc9451f0-005f-4e9a-89e3-dee40dd86896	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Rajdhani Refined Maida	rajdhani-refined-maida-500g	Fine white wheat flour for naans, parathas, and baking.	30	36	500 g pouch	GRN-MAI-015	t	2026-10-19 18:37:53.126	2026-10-19 18:37:53.126
0aec9277-a957-4878-8cd4-7e75ef419854	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Patanjali Roasted Wheat Dalia	patanjali-wheat-dalia-500g	High-protein broken wheat for wholesome porridge.	35	40	500 g pack	GRN-DAL-016	t	2026-10-19 18:37:53.131	2026-10-19 18:37:53.131
dd221e2b-8d29-459b-ab0a-0a57827e5ffb	2a58bd88-3dba-4725-ab86-dbb48abee090	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Double Horse Idli Rice Rava	double-horse-idli-rice-rava	Traditional rice semolina for super soft authentic South Indian idlis.	68	80	1 kg pack	GRN-IRV-017	t	2026-10-19 18:37:53.136	2026-10-19 18:37:53.136
bad1fae6-ffa9-4d4a-9e82-51f5a01c8972	dc9451f0-005f-4e9a-89e3-dee40dd86896	c9b68c9c-0ae8-4107-956e-9f63d2bd7966	Fortune Sona Masoori Raw Rice	fortune-sona-masoori-rice-5kg	Lightweight aromatic daily staple rice from Andhra Pradesh.	340	395	5 kg bag	GRN-SMR-018	t	2026-10-19 18:37:53.141	2026-10-19 18:37:53.141
58c61396-06cd-4424-bb6b-e751a18be72a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	7559014f-ee25-454b-b263-1109fd55aa5b	Fortune Sunlite Refined Sunflower Oil	fortune-sunflower-oil-1l	Light, healthy oil with natural Vitamin E for daily cooking.	135	165	1 L pouch	OIL-SUN-001	t	2026-10-19 18:37:53.146	2026-10-19 18:37:53.146
3265a2a7-4f86-4f16-8170-c299d44fd5a1	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	7559014f-ee25-454b-b263-1109fd55aa5b	Fortune Kachi Ghani Mustard Oil	fortune-mustard-oil-1l	Pure cold-pressed pungent mustard oil for authentic Indian curries.	145	175	1 L bottle	OIL-MUS-002	t	2026-10-19 18:37:53.151	2026-10-19 18:37:53.151
18ebe3cb-0dcd-4591-abb6-f21bf70416fd	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	7559014f-ee25-454b-b263-1109fd55aa5b	Saffola Gold Pro Healthy Oil	saffola-gold-oil-1l	Dual seed blend with Oryzanol for triple antioxidant protection.	165	195	1 L pouch	OIL-SAF-003	t	2026-10-19 18:37:53.156	2026-10-19 18:37:53.156
5e3d0d18-b89a-4768-9ab9-e8c2ea88d521	2a58bd88-3dba-4725-ab86-dbb48abee090	7559014f-ee25-454b-b263-1109fd55aa5b	Dhara Kachi Ghani Mustard Oil	dhara-mustard-oil-1l	Traditional cold pressed mustard oil rich in MUFA & Omega 3.	140	170	1 L poly pack	OIL-DHA-004	t	2026-10-19 18:37:53.161	2026-10-19 18:37:53.161
4ffda3f7-cd58-4df0-a7e4-60088d12602e	2a58bd88-3dba-4725-ab86-dbb48abee090	7559014f-ee25-454b-b263-1109fd55aa5b	Gemini Filtered Groundnut Oil	gemini-groundnut-oil-1l	Nutty flavor cold-filtered peanut oil for deep frying and tadka.	175	210	1 L pouch	OIL-GRO-005	t	2026-10-19 18:37:53.166	2026-10-19 18:37:53.166
3b1ddd5f-7b15-4e1f-b085-7c45485a7f03	2a58bd88-3dba-4725-ab86-dbb48abee090	7559014f-ee25-454b-b263-1109fd55aa5b	Amul Pure Danedar Ghee (Pouch)	amul-pure-ghee-1l	Aromatic granular clarified butter made from fresh cream.	575	620	1 L pouch	GHE-AMU-006	t	2026-10-19 18:37:53.171	2026-10-19 18:37:53.171
9c77e34f-becc-44b6-aebd-907c22daee62	dc9451f0-005f-4e9a-89e3-dee40dd86896	7559014f-ee25-454b-b263-1109fd55aa5b	Mother Dairy Pure Cow Ghee	mother-dairy-cow-ghee-1l	Golden, fragrant pure cow ghee enriched with Vitamin A.	590	650	1 L tin	GHE-MDC-007	t	2026-10-19 18:37:53.177	2026-10-19 18:37:53.177
6869c586-fd6c-4bdf-9aa0-c9edd9cf2d6b	dc9451f0-005f-4e9a-89e3-dee40dd86896	7559014f-ee25-454b-b263-1109fd55aa5b	Ananda Pure Desi Ghee	ananda-pure-ghee-500ml	Traditional aromatic bilona style desi ghee in glass jar.	310	350	500 ml jar	GHE-ANA-008	t	2026-10-19 18:37:53.182	2026-10-19 18:37:53.182
049911c3-7af4-4a00-a3c1-b200b248e91b	dc9451f0-005f-4e9a-89e3-dee40dd86896	7559014f-ee25-454b-b263-1109fd55aa5b	Figaro Pure Olive Oil (Cooking)	figaro-pure-olive-oil-500ml	Imported Spanish pure olive oil for sauteing and continental dishes.	490	575	500 ml tin	OIL-FIG-009	t	2026-10-19 18:37:53.188	2026-10-19 18:37:53.188
637127d4-5684-431a-8b9a-10d812e13bb3	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	7559014f-ee25-454b-b263-1109fd55aa5b	Borges Extra Virgin Olive Oil	borges-extra-virgin-olive-oil-500ml	First cold pressed premium extra virgin olive oil for salads.	620	750	500 ml glass bottle	OIL-BOR-010	t	2026-10-19 18:37:53.193	2026-10-19 18:37:53.193
39be6d4d-f3c2-4d3f-b359-ddbecdd8aefa	2a58bd88-3dba-4725-ab86-dbb48abee090	7559014f-ee25-454b-b263-1109fd55aa5b	Tilsona Pure Sesame Oil	tilsona-pure-sesame-oil-500ml	Authentic aromatic gingelly sesame oil for South Indian cuisine.	185	215	500 ml bottle	OIL-TIL-011	t	2026-10-19 18:37:53.198	2026-10-19 18:37:53.198
6110916e-6788-4abf-8c2d-3a1ac860e922	dc9451f0-005f-4e9a-89e3-dee40dd86896	7559014f-ee25-454b-b263-1109fd55aa5b	Dalda Refined Vanaspati Ghee	dalda-vanaspati-ghee-1l	Fortified hydrogenated cooking fat for crispy fried snacks.	120	140	1 L pouch	OIL-DAL-012	t	2026-10-19 18:37:53.203	2026-10-19 18:37:53.203
4e9f0860-4838-4955-aa8b-f65119d7dcb8	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	MDH Deggi Mirch Powder	mdh-deggi-mirch-100g	Unique blend of Kashmiri chillies for rich red color and mild heat.	82	92	100 g carton	SPI-DEG-001	t	2026-10-19 18:37:53.209	2026-10-19 18:37:53.209
10a705b8-3342-405d-9085-bfe95b42556d	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Everest Pure Turmeric Powder (Haldi)	everest-turmeric-powder-100g	Rich in natural Curcumin for vibrant yellow color and immunity.	34	38	100 g carton	SPI-HAL-002	t	2026-10-19 18:37:53.214	2026-10-19 18:37:53.214
f56fd32b-34ff-4cdc-9e26-ba5eabfa714c	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	MDH Dhania Powder (Coriander)	mdh-dhania-powder-100g	Aromatic green coriander seeds powdered to perfection.	38	42	100 g carton	SPI-DHA-003	t	2026-10-19 18:37:53.22	2026-10-19 18:37:53.22
f391d2b0-9f28-4afc-af27-6289ee841d42	2a58bd88-3dba-4725-ab86-dbb48abee090	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Everest Super Garam Masala	everest-garam-masala-100g	Finely balanced blend of 13 roasted spices for rich curries.	88	98	100 g carton	SPI-GAR-004	t	2026-10-19 18:37:53.225	2026-10-19 18:37:53.225
a1eed8de-e2aa-4878-a53c-a8ae56691a3d	2a58bd88-3dba-4725-ab86-dbb48abee090	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Catch Black Pepper Sprinkler	catch-black-pepper-100g	Freshly ground pungent Malabar black peppercorns in easy shaker.	95	110	100 g can	SPI-PEP-005	t	2026-10-19 18:37:53.23	2026-10-19 18:37:53.23
246ed21a-73de-4bb8-83c9-7339890a1e20	2a58bd88-3dba-4725-ab86-dbb48abee090	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Tata Salt Vacuum Evaporated	tata-salt-1kg	Desh Ka Namak with guaranteed iodine content for healthy mind.	28	28	1 kg pouch	SPI-SAL-006	t	2026-10-19 18:37:53.235	2026-10-19 18:37:53.235
8e146d98-0984-464a-8f82-8336e2cde221	dc9451f0-005f-4e9a-89e3-dee40dd86896	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Sendha Namak (Rock Salt Powder)	sendha-namak-rock-salt-1kg	Natural pink Himalayan rock salt ideal for fasting and daily health.	65	80	1 kg pouch	SPI-RSAL-007	t	2026-10-19 18:37:53.24	2026-10-19 18:37:53.24
32ecb7ab-1a13-46f1-9058-c937beaabcf1	dc9451f0-005f-4e9a-89e3-dee40dd86896	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Catch Whole Cumin Seeds (Jeera)	catch-cumin-seeds-jeera-100g	Handpicked aromatic whole jeera seeds for flavorful tadka.	68	80	100 g pouch	SPI-JEE-008	t	2026-10-19 18:37:53.245	2026-10-19 18:37:53.245
ff107b83-7b03-4a4c-97d3-ed0195017d71	dc9451f0-005f-4e9a-89e3-dee40dd86896	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Catch Brown Mustard Seeds (Rai)	catch-mustard-seeds-rai-100g	Clean, pungent black-brown mustard seeds for tempering.	28	35	100 g pouch	SPI-RAI-009	t	2026-10-19 18:37:53.251	2026-10-19 18:37:53.251
68d1f3f2-2605-4a7e-8cce-919acd7d496c	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Catch Whole Cloves (Laung)	catch-whole-cloves-laung-50g	Intensely fragrant whole cloves from Kerala plantations.	78	95	50 g pouch	SPI-LAU-010	t	2026-10-19 18:37:53.255	2026-10-19 18:37:53.255
98fcd9ef-5b4a-4fa4-ab4d-d2b211902ab0	2a58bd88-3dba-4725-ab86-dbb48abee090	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Everest Green Cardamom (Chhoti Elaichi)	everest-green-cardamom-50g	Grade A bold aromatic green cardamom pods.	165	210	50 g pack	SPI-ELA-011	t	2026-10-19 18:37:53.261	2026-10-19 18:37:53.261
445fbf4b-5b7a-4545-af70-5d13cb7ab912	dc9451f0-005f-4e9a-89e3-dee40dd86896	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Everest Cinnamon Sticks (Dalchini)	everest-cinnamon-sticks-50g	Sweet aromatic Ceylon cinnamon bark quills.	58	72	50 g pack	SPI-DAL-012	t	2026-10-19 18:37:53.266	2026-10-19 18:37:53.266
650d6531-6bf5-4658-af45-96380dff7eaf	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	MDH Kasuri Methi (Fenugreek Leaves)	mdh-kasuri-methi-50g	Sun-dried Nagauri fenugreek leaves for heavenly aroma.	35	40	50 g box	SPI-MET-013	t	2026-10-19 18:37:53.271	2026-10-19 18:37:53.271
8e72f8b6-4b8a-45cb-a1ed-2f7cf6f9d57b	2a58bd88-3dba-4725-ab86-dbb48abee090	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	Catch Compounded Hing (Asafoetida)	catch-compounded-hing-50g	Potent pungent hing powder for digestive seasoning.	70	85	50 g container	SPI-HIN-014	t	2026-10-19 18:37:53.276	2026-10-19 18:37:53.276
6d81e72c-c896-4a1e-a370-37778688c9d1	dc9451f0-005f-4e9a-89e3-dee40dd86896	4dce3f40-62e4-41fa-a63e-41d9d6d29c91	MDH Chunky Chat Masala	mdh-chunky-chat-masala-100g	Zesty, tangy spice mix for fruit salads, papdi chat, and snacks.	72	80	100 g carton	SPI-CHA-015	t	2026-10-19 18:37:53.282	2026-10-19 18:37:53.282
ec58bce6-62e2-4413-a6ee-48786551fccd	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c99c2fef-e49d-48dd-aa8e-713b955eb610	Lay's India's Magic Masala Potato Chips	lays-indias-magic-masala-chips	Crispy ridged potato chips seasoned with authentic Indian spices.	20	20	50 g pouch	SNK-LAY-001	t	2026-10-19 18:37:53.287	2026-10-19 18:37:53.287
2175cd0b-9a10-430a-9dc1-d3bb87b9d3d1	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c99c2fef-e49d-48dd-aa8e-713b955eb610	Lay's American Style Cream & Onion Chips	lays-cream-and-onion-chips	Crisp potato chips with mouthwatering herb and sour cream flavor.	20	20	50 g pouch	SNK-LAY-002	t	2026-10-19 18:37:53.292	2026-10-19 18:37:53.292
a7cef11c-134f-4a42-96fe-bd8f74ce3e01	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c99c2fef-e49d-48dd-aa8e-713b955eb610	Kurkure Masala Munch Crunchy Snacks	kurkure-masala-munch-85g	Tedhe medhe spicy crispy corn puffs with chatpata masala.	20	20	85 g pouch	SNK-KUR-003	t	2026-10-19 18:37:53.297	2026-10-19 18:37:53.297
c15b0d89-0eaf-46df-9b2d-d4ea728544ac	2a58bd88-3dba-4725-ab86-dbb48abee090	c99c2fef-e49d-48dd-aa8e-713b955eb610	Haldiram's Bhelpuri Snack Mix	haldirams-bhelpuri-snack-mix	Tangy puffed rice mix with crisp sev, puris and sweet chutney pouch.	55	60	150 g pack	SNK-BHL-004	t	2026-10-19 18:37:53.302	2026-10-19 18:37:53.302
6eb4e151-d37f-4209-92fc-240b1d90519e	2a58bd88-3dba-4725-ab86-dbb48abee090	c99c2fef-e49d-48dd-aa8e-713b955eb610	Haldiram's Aloo Bhujia Namkeen	haldirams-aloo-bhujia-200g	Crispy mint-spiced potato and gram flour extruded noodles.	55	60	200 g pouch	SNK-ALO-005	t	2026-10-19 18:37:53.307	2026-10-19 18:37:53.307
fbe3fdfe-4746-4eb8-9475-995e9741ba22	2a58bd88-3dba-4725-ab86-dbb48abee090	c99c2fef-e49d-48dd-aa8e-713b955eb610	Bingo Mad Angles Achaari Masti	bingo-mad-angles-achaari-masti	Triangular crispy chips bursting with spicy mango pickle seasoning.	20	20	66 g pouch	SNK-BIN-006	t	2026-10-19 18:37:53.312	2026-10-19 18:37:53.312
f20d5f5a-191e-417e-9b68-137894d321ef	dc9451f0-005f-4e9a-89e3-dee40dd86896	c99c2fef-e49d-48dd-aa8e-713b955eb610	Doritos Cheese Supreme Nacho Chips	doritos-cheese-supreme-nachos	Crunchy golden corn tortilla chips with rich nacho cheese.	30	30	60 g pouch	SNK-DOR-007	t	2026-10-19 18:37:53.317	2026-10-19 18:37:53.317
46248518-85db-4268-bb75-a08992059587	dc9451f0-005f-4e9a-89e3-dee40dd86896	c99c2fef-e49d-48dd-aa8e-713b955eb610	Act II Golden Sizzle Butter Popcorn	act-ii-butter-popcorn-instant	3-minute pressure cooker or microwave hot salty butter popcorn.	35	40	70 g pouch	SNK-POP-008	t	2026-10-19 18:37:53.322	2026-10-19 18:37:53.322
fa8439c6-9e25-4b37-86e9-15bce306684d	dc9451f0-005f-4e9a-89e3-dee40dd86896	c99c2fef-e49d-48dd-aa8e-713b955eb610	Haldiram's Gulab Jamun Tin	haldirams-gulab-jamun-1kg	Traditional khoya dumplings soaked in fragrant cardamom rose syrup.	240	275	1 kg tin	SNK-GUL-009	t	2026-10-19 18:37:53.328	2026-10-19 18:37:53.328
6ab06c08-1d02-4c15-a393-9497179150bf	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c99c2fef-e49d-48dd-aa8e-713b955eb610	Nutty Gritties Roasted Salted Almonds	nutty-gritties-roasted-almonds-200g	Californian jumbo almonds lightly roasted and pink salted.	260	320	200 g pouch	SNK-ALM-010	t	2026-10-19 18:37:53.333	2026-10-19 18:37:53.333
b86019fc-2d69-45e5-91f7-1b1f4756026b	2a58bd88-3dba-4725-ab86-dbb48abee090	c99c2fef-e49d-48dd-aa8e-713b955eb610	Nutty Gritties Roasted Salted Cashews	nutty-gritties-roasted-cashews-200g	Crunchy golden roasted Goan whole cashew nuts.	290	360	200 g pouch	SNK-CAS-011	t	2026-10-19 18:37:53.338	2026-10-19 18:37:53.338
328ee321-9b71-412e-a0f1-154c50f7eb53	dc9451f0-005f-4e9a-89e3-dee40dd86896	c99c2fef-e49d-48dd-aa8e-713b955eb610	Bikano Navratan Mixture Namkeen	bikano-navratan-mixture-200g	Spicy royal mixture of dry fruits, lentils, sev and cornflakes.	50	60	200 g pouch	SNK-NAV-012	t	2026-10-19 18:37:53.343	2026-10-19 18:37:53.343
e208e44c-0ed3-4d40-aee6-ba649b586f75	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c99c2fef-e49d-48dd-aa8e-713b955eb610	Uncle Chipps Spicy Treat Wafer Chips	uncle-chipps-spicy-treat-50g	Classic Indian crinkle cut chips with mouthwatering spicy masala.	20	20	50 g pouch	SNK-UNC-013	t	2026-10-19 18:37:53.348	2026-10-19 18:37:53.348
941d7c6a-b7c8-4765-9c57-d51e2faf7329	2a58bd88-3dba-4725-ab86-dbb48abee090	c99c2fef-e49d-48dd-aa8e-713b955eb610	Pringles Sour Cream & Onion Potato Crisps	pringles-sour-cream-107g	Iconic stackable saddle crisps in resealable canister.	115	130	107 g can	SNK-PRI-014	t	2026-10-19 18:37:53.353	2026-10-19 18:37:53.353
d25bde92-9f72-4b38-8639-9aebbb56f650	dc9451f0-005f-4e9a-89e3-dee40dd86896	c99c2fef-e49d-48dd-aa8e-713b955eb610	Nutty Gritties Roasted Peri Peri Makhana	roasted-peri-peri-makhana-100g	Crunchy fox nuts popped and coated in fiery peri peri seasoning.	140	175	100 g pack	SNK-MAK-015	t	2026-10-19 18:37:53.358	2026-10-19 18:37:53.358
50223ac9-c606-4cf8-910a-b801ff2edfad	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	c99c2fef-e49d-48dd-aa8e-713b955eb610	Haldiram's Spongy Rasgulla Tin	haldirams-spongy-rasgulla-1kg	Bite-sized sweet cottage cheese dumplings soaked in sugar syrup.	230	260	1 kg tin	SNK-RAS-016	t	2026-10-19 18:37:53.363	2026-10-19 18:37:53.363
aac5610e-12e4-4917-9980-89b937980a8e	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Coca-Cola Refreshing Soft Drink	coca-cola-soft-drink-750ml	The original refreshing cola taste, best served chilled.	40	40	750 ml bottle	BEV-COC-001	t	2026-10-19 18:37:53.368	2026-10-19 18:37:53.368
361c4a7a-9997-4e19-86f7-e35e631dbb41	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Thums Up Charged Strong Cola	thums-up-strong-cola-750ml	Toofani strong spicy carbonated cola drink.	40	40	750 ml bottle	BEV-THU-002	t	2026-10-19 18:37:53.374	2026-10-19 18:37:53.374
4bea3880-65e4-46b2-ad72-37ae9b1ec841	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Sprite Clear Lemon-Lime Soft Drink	sprite-lemon-lime-750ml	Crisp, clean and refreshing lemon-lime fizzy soda.	40	40	750 ml bottle	BEV-SPR-003	t	2026-10-19 18:37:53.379	2026-10-19 18:37:53.379
ebcec839-e427-47bc-8dc0-e50fc5429ec4	2a58bd88-3dba-4725-ab86-dbb48abee090	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Frooti Fresh Mango Drink	frooti-fresh-mango-drink-1l	Juicy real mango pulp drink loved by kids and adults alike.	65	75	1 L bottle	BEV-FRO-004	t	2026-10-19 18:37:53.384	2026-10-19 18:37:53.384
d49288b5-2fe7-415a-99a9-07b9202fde46	2a58bd88-3dba-4725-ab86-dbb48abee090	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Tropicana 100% Real Orange Juice	tropicana-100-orange-juice-1l	Pure squeezed orange juice with no added sugar or preservatives.	130	150	1 L tetrapack	BEV-TRO-005	t	2026-10-19 18:37:53.389	2026-10-19 18:37:53.389
9b3bd756-c45e-4222-a102-b979c7a18c95	2a58bd88-3dba-4725-ab86-dbb48abee090	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Real Activ Mixed Fruit Juice	real-activ-mixed-fruit-juice-1l	Nutritious blend of 10 wholesome fruits with no added sugar.	125	145	1 L tetrapack	BEV-REA-006	t	2026-10-19 18:37:53.394	2026-10-19 18:37:53.394
87846887-5a68-458b-9107-46b0868dd993	dc9451f0-005f-4e9a-89e3-dee40dd86896	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Paper Boat Aamras Mango Drink	paper-boat-aamras-250ml	Memories of grandma kitchen with thick sweet mango nectar.	35	40	250 ml pouch	BEV-PBT-007	t	2026-10-19 18:37:53.399	2026-10-19 18:37:53.399
352668c0-2552-4c07-b43b-0945ec8d47c2	dc9451f0-005f-4e9a-89e3-dee40dd86896	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Red Bull Energy Drink Can	red-bull-energy-drink-250ml	Vitalizes body and mind with caffeine and essential B vitamins.	125	125	250 ml can	BEV-RED-008	t	2026-10-19 18:37:53.404	2026-10-19 18:37:53.404
d4cd1b9f-52f6-4a43-943e-4d7a1bbe7ade	dc9451f0-005f-4e9a-89e3-dee40dd86896	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Maaza Mango Fruit Drink	maaza-mango-fruit-drink-1-2l	Rich Alphonso mango taste with thick velvety consistency.	75	85	1.2 L bottle	BEV-MAA-009	t	2026-10-19 18:37:53.409	2026-10-19 18:37:53.409
c0ec7bbd-9e35-4e65-a7a9-12a5eb7f083e	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Limca Fresh Lime Lemoni Soda	limca-fresh-lime-soda-750ml	Zesty sparkling lime drink with cloudy citrus fizz.	40	40	750 ml bottle	BEV-LIM-010	t	2026-10-19 18:37:53.415	2026-10-19 18:37:53.415
9bf8e7b1-1ba3-45ca-b40f-d7b2d50a1273	2a58bd88-3dba-4725-ab86-dbb48abee090	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Mountain Dew Darr Ke Aage Jeet Hai	mountain-dew-citrus-750ml	High-energy neon citrus soda with thrilling kick.	40	40	750 ml bottle	BEV-DEW-011	t	2026-10-19 18:37:53.42	2026-10-19 18:37:53.42
9398e221-8176-4fb9-afa1-3875fe5b0978	dc9451f0-005f-4e9a-89e3-dee40dd86896	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Raw Pressery Pure Coconut Water	raw-pressery-coconut-water-200ml	100% natural, electrolyte-rich tender green coconut water.	60	65	200 ml bottle	BEV-COC-012	t	2026-10-19 18:37:53.425	2026-10-19 18:37:53.425
0e5bf48c-6b37-4fd8-af0a-14e9187f80a8	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Schweppes Indian Tonic Water	schweppes-indian-tonic-water-300ml	Crisp quinine tonic water for mocktails and party coolers.	60	65	300 ml can	BEV-SCH-013	t	2026-10-19 18:37:53.431	2026-10-19 18:37:53.431
c8de6971-d906-446d-9771-8126cd3b8c86	2a58bd88-3dba-4725-ab86-dbb48abee090	1e4b5dd8-baef-4c86-bb03-09db50f2ae49	Diet Coke Zero Sugar Can	diet-coke-zero-sugar-300ml	Crisp classic cola flavor with zero calories and zero sugar.	40	40	300 ml can	BEV-DCK-014	t	2026-10-19 18:37:53.437	2026-10-19 18:37:53.437
402f5ae6-40f7-43d0-a74e-dc98799e579f	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Tata Tea Gold Leaf & CTC Blend	tata-tea-gold-500g	Gently rolled aromatic long leaves with strong valley tea.	290	330	500 g pouch	TEA-TAT-001	t	2026-10-19 18:37:53.442	2026-10-19 18:37:53.442
162ed9c8-1a4e-420e-b540-096a3d5fee8e	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Brooke Bond Red Label Tea	brooke-bond-red-label-500g	Brewed with goodness of rich Assam tea for warmth and taste.	260	295	500 g carton	TEA-RED-002	t	2026-10-19 18:37:53.447	2026-10-19 18:37:53.447
7ac216f1-bdad-4ed4-a489-f0d07cde41fd	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Taj Mahal Premium Rich Tea	taj-mahal-premium-tea-500g	Exquisite aroma and flavor that inspires Wah Taj moments.	345	390	500 g carton	TEA-TAJ-003	t	2026-10-19 18:37:53.452	2026-10-19 18:37:53.452
2f3f041f-4efe-4421-bc3c-67e91d690b0a	2a58bd88-3dba-4725-ab86-dbb48abee090	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Nescafe Classic 100% Pure Instant Coffee	nescafe-classic-instant-coffee-100g	Rich aroma and signature robust flavor from Arabica & Robusta.	340	380	100 g glass jar	COF-NES-004	t	2026-10-19 18:37:53.457	2026-10-19 18:37:53.457
cf71d3d4-1936-4b91-8b9f-c9d0b45505b3	2a58bd88-3dba-4725-ab86-dbb48abee090	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	BRU Instant Coffee Chicory Mix	bru-instant-coffee-100g	South Indian authentic roast mix of 70% coffee and 30% chicory.	220	250	100 g pouch	COF-BRU-005	t	2026-10-19 18:37:53.462	2026-10-19 18:37:53.462
3824e82b-747b-4528-9fb9-6ff957be2e7c	2a58bd88-3dba-4725-ab86-dbb48abee090	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Cadbury Bournvita Chocolate Health Drink	cadbury-bournvita-500g	Essential minerals and vitamins for inner strength and active kids.	235	255	500 g refill	HTH-BOU-006	t	2026-10-19 18:37:53.471	2026-10-19 18:37:53.471
437d6c7f-656a-44c3-8580-983d634856ff	dc9451f0-005f-4e9a-89e3-dee40dd86896	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Horlicks Classic Malt Nutrition Drink	horlicks-classic-malt-500g	Clinically proven to make kids taller, stronger, and sharper.	245	270	500 g refill	HTH-HOR-007	t	2026-10-19 18:37:53.476	2026-10-19 18:37:53.476
952b9dd4-6425-4a8c-9846-5014604330f4	dc9451f0-005f-4e9a-89e3-dee40dd86896	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Boost Energy Health Drink	boost-energy-drink-500g	Secret of our energy chocolate drink with 3x stamina power.	230	260	500 g refill	HTH-BOO-008	t	2026-10-19 18:37:53.481	2026-10-19 18:37:53.481
4423347b-36d6-4cbc-88b5-bd452c2ae7ca	dc9451f0-005f-4e9a-89e3-dee40dd86896	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Tetley Green Tea Honey & Lemon Bags	tetley-green-tea-honey-lemon-25s	Soothing green tea loaded with antioxidants and Vitamin C.	160	180	25 tea bags box	TEA-TET-009	t	2026-10-19 18:37:53.486	2026-10-19 18:37:53.486
20bd5201-44e0-4f6d-aff5-529462b5c3d4	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Twinings Earl Grey Black Tea	twinings-earl-grey-tea-25s	Fine black tea infused with fragrant citrus oil of bergamot.	320	375	25 tea bags box	TEA-TWI-010	t	2026-10-19 18:37:53.491	2026-10-19 18:37:53.491
770aa128-df2a-4406-a2e8-a6110baf37ba	2a58bd88-3dba-4725-ab86-dbb48abee090	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Davidoff Rich Aroma Ground Coffee	davidoff-rich-aroma-coffee-100g	Master blend of South American beans with intense spicy bouquet.	595	699	100 g glass jar	COF-DAV-011	t	2026-10-19 18:37:53.496	2026-10-19 18:37:53.496
1d71a949-43dd-424a-ac94-687625bd2992	dc9451f0-005f-4e9a-89e3-dee40dd86896	1d5c5687-d76f-4e64-80ac-0e761cc6abd2	Complan Royal Chocolate Health Drink	complan-chocolate-drink-500g	100% milk protein formula with 34 vital vitalizers for rapid growth.	290	325	500 g refill	HTH-COM-012	t	2026-10-19 18:37:53.501	2026-10-19 18:37:53.501
c95626aa-957e-4fd1-aba9-56d64750a302	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Maggi 2-Minute Masala Noodles	maggi-masala-noodles-4pack	Classic Indian comfort noodles with tastemaker spices.	56	60	4-pack (280 g)	INS-MAG-001	t	2026-10-19 18:37:53.505	2026-10-19 18:37:53.505
19d10f5f-97b5-4dc7-b72c-bb83c3acf760	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Maggi Special Masala Noodles	maggi-special-masala-noodles-4pack	Enriched with 20 roasted spices and herbs for richer flavor.	65	72	4-pack (290 g)	INS-MAG-002	t	2026-10-19 18:37:53.51	2026-10-19 18:37:53.51
e8a31b6e-4cdc-44b6-a3e7-79dc08fe6e4a	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Sunfeast Yippee Magic Masala Noodles	sunfeast-yippee-magic-masala	Non-sticky round noodles that never lump.	54	58	4-pack (260 g)	INS-YIP-003	t	2026-10-19 18:37:53.515	2026-10-19 18:37:53.515
62700de7-5083-4d36-ab30-29b4d18dafb6	2a58bd88-3dba-4725-ab86-dbb48abee090	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Knorr Hot & Sour Veg Soup Mix	knorr-hot-sour-veg-soup	Tangy, spicy Chinese soup mix packed with real crunchy veggies.	55	65	43 g sachet	INS-KNO-004	t	2026-10-19 18:37:53.52	2026-10-19 18:37:53.52
05236ba1-fcb1-4e1a-890d-2c82cb562a58	2a58bd88-3dba-4725-ab86-dbb48abee090	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Knorr Sweet Corn Veg Soup Mix	knorr-sweet-corn-veg-soup	Creamy, sweet corn kernels soup ready in 3 minutes.	55	65	44 g sachet	INS-KNO-005	t	2026-10-19 18:37:53.526	2026-10-19 18:37:53.526
85186dde-07bf-4e06-8f95-a18fdf4cb7e2	2a58bd88-3dba-4725-ab86-dbb48abee090	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Ching's Secret Schezwan Hakka Noodles	chings-secret-hakka-noodles	Long non-mushy wheat noodles for restaurant style chowmein.	40	45	150 g pack	INS-CHI-006	t	2026-10-19 18:37:53.531	2026-10-19 18:37:53.531
987a9d6a-24b5-4ec6-aa45-be8c3ba18f04	dc9451f0-005f-4e9a-89e3-dee40dd86896	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Safal Select Frozen Green Peas	safal-frozen-green-peas-1kg	Sweet, tender green peas frozen at peak freshness with IQF tech.	155	185	1 kg poly pack	FRZ-SAF-007	t	2026-10-19 18:37:53.537	2026-10-19 18:37:53.537
81aa45de-f5f2-45c3-8333-50f6b584f087	dc9451f0-005f-4e9a-89e3-dee40dd86896	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Safal American Frozen Sweet Corn	safal-frozen-sweet-corn-500g	Juicy, naturally sweet corn kernels ready for boiling or butter fry.	85	105	500 g pack	FRZ-SAF-008	t	2026-10-19 18:37:53.543	2026-10-19 18:37:53.543
ae70cdef-cc06-4579-90e9-8f964b0bdea1	dc9451f0-005f-4e9a-89e3-dee40dd86896	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	McCain Crispy French Fries	mccain-french-fries-420g	Crunchy on outside, fluffy potato on inside ready to deep fry.	115	135	420 g pack	FRZ-MCC-009	t	2026-10-19 18:37:53.548	2026-10-19 18:37:53.548
b5abaa5a-0fac-43c4-92a6-cb8ce0d1f474	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	McCain Crunchy Smiles Potato Treats	mccain-smiles-potato-375g	Fun smiling mashed potato shapes loved by kids and parties.	110	130	375 g pack	FRZ-MCC-010	t	2026-10-19 18:37:53.553	2026-10-19 18:37:53.553
f93aa39a-0835-4629-8244-a2b5082536c2	2a58bd88-3dba-4725-ab86-dbb48abee090	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	MTR Ready-to-Eat Paneer Butter Masala	mtr-ready-to-eat-paneer-butter-masala	Heat-and-eat authentic creamy gravy with soft paneer cubes.	130	155	300 g retort pack	INS-MTR-011	t	2026-10-19 18:37:53.558	2026-10-19 18:37:53.558
4454c902-6a5f-4f7b-b14a-72a34d20c1d6	dc9451f0-005f-4e9a-89e3-dee40dd86896	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Haldiram's Minute Khana Punjabi Samosa	haldirams-frozen-punjabi-samosa	Golden crispy pastry filled with spiced potato and green peas.	140	170	8 pcs (400 g pack)	FRZ-HAL-012	t	2026-10-19 18:37:53.563	2026-10-19 18:37:53.563
c3677ff6-9ec1-4dd5-b94b-2249084c98c3	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Bambino Roasted Wheat Vermicelli (Sevaiya)	bambino-roasted-vermicelli-400g	Golden roasted wheat sevaiya for quick kheer and upma.	42	50	400 g pack	INS-BAM-013	t	2026-10-19 18:37:53.569	2026-10-19 18:37:53.569
be29c303-414c-4369-ad7d-4d0410167ed5	2a58bd88-3dba-4725-ab86-dbb48abee090	40bd3e9b-8c1e-465e-83e7-c1580ee02dc8	Barilla Italian Penne Rigate Pasta	barilla-penne-rigate-pasta-500g	Authentic durum wheat semolina pasta from Italy that holds sauce.	185	220	500 g box	INS-BAR-014	t	2026-10-19 18:37:53.574	2026-10-19 18:37:53.574
881bf9a3-f656-4c81-98b4-9f2ee67e20c0	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Parle-G Original Gluco Biscuits	parle-g-original-gluco-1kg	India favorite energy biscuit packed with goodness of wheat and milk.	85	95	1 kg family pack	BIS-PAR-001	t	2026-10-19 18:37:53.579	2026-10-19 18:37:53.579
351fea53-2f19-4fc3-9234-7e166e0457d4	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Britannia Good Day Rich Butter Cookies	britannia-good-day-butter-600g	Delightfully rich, crumbly butter cookies that bring smiles.	120	140	600 g pack	BIS-GDD-002	t	2026-10-19 18:37:53.584	2026-10-19 18:37:53.584
a786e66c-0f43-48af-a177-f6e28d077163	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Cadbury Oreo Vanilla Cream Sandwich Biscuits	cadbury-oreo-vanilla-cream-120g	Twist, lick and dunk dark cocoa biscuits with rich vanilla cream.	35	40	120 g pack	BIS-ORE-003	t	2026-10-19 18:37:53.589	2026-10-19 18:37:53.589
b5bfa8a3-685f-414a-9a47-b41154725547	2a58bd88-3dba-4725-ab86-dbb48abee090	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Sunfeast Dark Fantasy Choco Fills	sunfeast-dark-fantasy-choco-fills	Crispy chocolate cookie with molten gooey chocolate interior.	75	90	300 g pack	BIS-FAN-004	t	2026-10-19 18:37:53.594	2026-10-19 18:37:53.594
6e00fa18-6995-4993-a87a-23f26f684e92	2a58bd88-3dba-4725-ab86-dbb48abee090	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Britannia Marie Gold Crisp Tea Biscuits	britannia-marie-gold-1kg	Light, crunchy wheat biscuits baked for morning chai dipping.	110	130	1 kg family pack	BIS-MAR-005	t	2026-10-19 18:37:53.599	2026-10-19 18:37:53.599
ec52943b-1bb6-4075-bdf2-0d539ae5d202	2a58bd88-3dba-4725-ab86-dbb48abee090	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Parle Hide & Seek Chocolate Chip Cookies	parle-hide-and-seek-choco-chip	Crunchy chocolate cookies loaded with real chocolate chips.	45	50	200 g pack	BIS-HID-006	t	2026-10-19 18:37:53.604	2026-10-19 18:37:53.604
e948d4e7-ed66-4b39-a8d0-2c5d04cf91ec	dc9451f0-005f-4e9a-89e3-dee40dd86896	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Britannia Bourbon Chocolate Cream Biscuits	britannia-bourbon-chocolate-cream	Sugar sprinkled crunchy dark biscuits with smooth chocolate filling.	35	40	150 g pack	BIS-BOU-007	t	2026-10-19 18:37:53.609	2026-10-19 18:37:53.609
34f20b70-e2c3-4ba8-bbfe-bc2a1a4a170d	dc9451f0-005f-4e9a-89e3-dee40dd86896	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	McVitie's Original Digestive Biscuits	mcvities-digestive-biscuits-800g	Hearty wholewheat British biscuits with natural wheat bran.	130	155	800 g mega pack	BIS-MCV-008	t	2026-10-19 18:37:53.615	2026-10-19 18:37:53.615
7015fcf4-fbf3-4ad9-be41-b95c292a3b3c	dc9451f0-005f-4e9a-89e3-dee40dd86896	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Unibic Choco Chip Artisanal Cookies	unibic-choco-chip-cookies-250g	Rich melt-in-mouth bakery cookies containing 16% chocolate chips.	70	85	250 g pack	BIS-UNI-009	t	2026-10-19 18:37:53.619	2026-10-19 18:37:53.619
7babb798-02c3-4eac-a6b4-e9685a7afc0e	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Britannia NutriChoice 5 Grain Digestive	britannia-nutrichoice-5-grain	Enriched with oats, corn, ragi, wheat, and rice fiber.	65	75	300 g pack	BIS-NUT-010	t	2026-10-19 18:37:53.625	2026-10-19 18:37:53.625
65336cd2-b1ab-4a08-bdd7-8c7861259df0	2a58bd88-3dba-4725-ab86-dbb48abee090	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Haldiram's Kaju Pista Shahi Cookies	haldirams-kaju-pista-cookies	Traditional royal cookies flavored with cashews, pistachios and cardamom.	95	120	300 g box	BIS-KJU-011	t	2026-10-19 18:37:53.63	2026-10-19 18:37:53.63
ac489902-99c0-4699-8462-a08481adf77a	dc9451f0-005f-4e9a-89e3-dee40dd86896	d1f18bb2-8fb8-4d56-8d6a-889394094b3d	Lotus Biscoff Caramelised Cookies	lotus-biscoff-caramelised-cookies	Unique crunchy Belgian speculoos cookies with sweet cinnamon caramel note.	220	260	250 g pack	BIS-LOT-012	t	2026-10-19 18:37:53.635	2026-10-19 18:37:53.635
ec4d8a96-6c32-42ee-b1c0-0c86e36d57f4	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	fd456cf9-aea2-48fd-8637-2312b672b412	Dettol Original Germ Protection Bathing Soap	dettol-original-soap-4pack	100% better germ defense with trusted pine fragrance.	165	190	4 x 125 g bars	PER-DET-001	t	2026-10-19 18:37:53.639	2026-10-19 18:37:53.639
cd2ba2f4-7563-4d54-9f90-1e6f204ecb02	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	fd456cf9-aea2-48fd-8637-2312b672b412	Dove White Cream Beauty Bathing Bar	dove-white-beauty-bar-3pack	1/4th moisturizing cream formula for soft, supple skin.	195	225	3 x 100 g bars	PER-DOV-002	t	2026-10-19 18:37:53.645	2026-10-19 18:37:53.645
ef811048-02eb-45f7-aaf6-477b7f902630	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	fd456cf9-aea2-48fd-8637-2312b672b412	Lifebuoy Total Germ Protection Soap	lifebuoy-total-soap-4pack	Silver Shield formula for advanced antibacterial hand and body hygiene.	120	140	4 x 125 g bars	PER-LIF-003	t	2026-10-19 18:37:53.65	2026-10-19 18:37:53.65
73deb8d0-b534-4cdf-ae50-0910eb29c9af	2a58bd88-3dba-4725-ab86-dbb48abee090	fd456cf9-aea2-48fd-8637-2312b672b412	Head & Shoulders Cool Menthol Anti-Dandruff Shampoo	head-and-shoulders-cool-menthol	Up to 100% dandruff free hair with cooling menthol blast.	295	360	340 ml bottle	PER-HEA-004	t	2026-10-19 18:37:53.655	2026-10-19 18:37:53.655
6c6759fd-fca1-427f-91c5-c76a6ef99ed5	2a58bd88-3dba-4725-ab86-dbb48abee090	fd456cf9-aea2-48fd-8637-2312b672b412	Dove Intense Repair Keratin Shampoo	dove-intense-repair-shampoo-340ml	Enriched with Keratin Actives to restore damaged and dry hair.	285	350	340 ml bottle	PER-DOV-005	t	2026-10-19 18:37:53.659	2026-10-19 18:37:53.659
fa011695-2193-4d49-a58b-db00a1969009	2a58bd88-3dba-4725-ab86-dbb48abee090	fd456cf9-aea2-48fd-8637-2312b672b412	Colgate Strong Teeth Dental Cream Toothpaste	colgate-strong-teeth-toothpaste-200g	Amino Shakti formula adds natural calcium for 2x stronger teeth.	110	125	200 g tube	PER-COL-006	t	2026-10-19 18:37:53.665	2026-10-19 18:37:53.665
537d3db3-8bd3-45cc-9477-1c279da938d4	dc9451f0-005f-4e9a-89e3-dee40dd86896	fd456cf9-aea2-48fd-8637-2312b672b412	Sensodyne Fresh Mint Sensitivity Toothpaste	sensodyne-fresh-mint-toothpaste-100g	Dentist recommended daily tooth relief for sharp sensitivity.	175	195	100 g tube	PER-SEN-007	t	2026-10-19 18:37:53.672	2026-10-19 18:37:53.672
5fd0c658-a1c8-4e88-a655-2e982bcfc4bf	dc9451f0-005f-4e9a-89e3-dee40dd86896	fd456cf9-aea2-48fd-8637-2312b672b412	Oral-B Pro-Health Medium Bristle Toothbrush	oral-b-pro-health-toothbrush-4pack	CrossAction bristles remove up to 99% plaque in hard-to-reach areas.	130	160	4 pcs pack	PER-ORA-008	t	2026-10-19 18:37:53.678	2026-10-19 18:37:53.678
1d81a3ef-6776-4ba3-94f3-b1429e357452	dc9451f0-005f-4e9a-89e3-dee40dd86896	fd456cf9-aea2-48fd-8637-2312b672b412	Nivea Soft Light Moisturizing Cream	nivea-soft-light-moisturizer-200ml	Jojoba oil and Vitamin E for non-greasy soft refreshing skin.	280	350	200 ml tub	PER-NIV-009	t	2026-10-19 18:37:53.683	2026-10-19 18:37:53.683
09032f1f-1606-4346-906f-68274957f23b	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	fd456cf9-aea2-48fd-8637-2312b672b412	Dettol Liquid Handwash Refill Pouch	dettol-handwash-refill-750ml	Kills 99.9% germs, enriched with added moisturizers.	99	119	750 ml refill pouch	PER-DHW-010	t	2026-10-19 18:37:53.688	2026-10-19 18:37:53.688
d79e3b0a-9e5f-4aaf-8c70-aa585b930775	2a58bd88-3dba-4725-ab86-dbb48abee090	fd456cf9-aea2-48fd-8637-2312b672b412	Vaseline Deep Restore Body Lotion	vaseline-deep-restore-lotion-400ml	Pure oat extract and micro-droplets of Vaseline jelly for dry skin.	320	399	400 ml pump bottle	PER-VAS-011	t	2026-10-19 18:37:53.701	2026-10-19 18:37:53.701
0a6d6465-6bfb-4036-881e-a904045bccfe	dc9451f0-005f-4e9a-89e3-dee40dd86896	fd456cf9-aea2-48fd-8637-2312b672b412	Gillette Mach 3 Shaving Razor for Men	gillette-mach-3-razor	3 stronger-than-steel blades for close smooth shave without irritation.	299	350	1 razor handle + 1 cartridge	PER-GIL-012	t	2026-10-19 18:37:53.706	2026-10-19 18:37:53.706
41292907-b9a4-4a85-820b-b572c693a949	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	fd456cf9-aea2-48fd-8637-2312b672b412	Stayfree Secure XL Cottony Sanitary Pads	stayfree-secure-xl-pads-40s	Extra large wings with odor control technology for leakage protection.	260	310	40 pads mega pack	PER-STA-013	t	2026-10-19 18:37:53.712	2026-10-19 18:37:53.712
6caec009-9834-4d89-8985-539dfc59dc8c	2a58bd88-3dba-4725-ab86-dbb48abee090	fd456cf9-aea2-48fd-8637-2312b672b412	Parachute 100% Pure Coconut Hair Oil	parachute-pure-coconut-oil-500ml	Deep conditioning edible grade pure unadulterated coconut oil.	195	220	500 ml bottle	PER-PAR-014	t	2026-10-19 18:37:53.718	2026-10-19 18:37:53.718
5ac21124-96ee-49f7-b599-6df11531dbd8	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Surf Excel Easy Wash Detergent Powder	surf-excel-easy-wash-1kg	Engineered with active clean technology to remove tough stain easily.	140	160	1 kg pack	HOU-SUR-001	t	2026-10-19 18:37:53.725	2026-10-19 18:37:53.725
b795b09b-a924-4ec0-819a-42886913380f	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Ariel Matic Front & Top Load Detergent Powder	ariel-matic-detergent-1kg	Deep clean formula with bright guard for brilliant whites and colors.	235	275	1 kg carton	HOU-ARI-002	t	2026-10-19 18:37:53.729	2026-10-19 18:37:53.729
8c6d8142-8be0-48f8-8807-6d98722be032	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Tide Plus Extra Power Detergent Powder (Lemon)	tide-plus-detergent-1kg	Outstanding whiteness with fresh citrus lemon fragrance.	115	130	1 kg pack	HOU-TID-003	t	2026-10-19 18:37:53.734	2026-10-19 18:37:53.734
b7f90340-730c-41f2-9e76-ae1734512b52	2a58bd88-3dba-4725-ab86-dbb48abee090	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Vim Lemon Dishwash Gel Bottle	vim-lemon-dishwash-gel-750ml	Powerful degreasing formula cleans burnt oily stains effortlessly.	145	175	750 ml bottle	HOU-VIM-004	t	2026-10-19 18:37:53.746	2026-10-19 18:37:53.746
a0343e4f-9e9c-4749-8045-306cd07514a0	2a58bd88-3dba-4725-ab86-dbb48abee090	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Pril Lime Degreasing Dishwash Liquid	pril-dishwash-liquid-750ml	Active power molecules cut grease with refreshing lime fragrance.	155	185	750 ml bottle	HOU-PRI-005	t	2026-10-19 18:37:53.751	2026-10-19 18:37:53.751
4b6660b9-b600-4d5f-8a85-679292a5ad3c	2a58bd88-3dba-4725-ab86-dbb48abee090	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Harpic Power Plus Disinfectant Toilet Cleaner	harpic-power-plus-toilet-cleaner-1l	10x better stain removal and kills 99.9% germs in bowl.	185	215	1 L bottle	HOU-HAR-006	t	2026-10-19 18:37:53.756	2026-10-19 18:37:53.756
3efc984d-a2cd-48d4-ad88-5b9e82b33ea5	dc9451f0-005f-4e9a-89e3-dee40dd86896	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Lizol Citrus Floor Cleaner & Disinfectant	lizol-citrus-floor-cleaner-1l	Kills 99.9% illness-causing germs and leaves pleasant citrus scent.	180	210	1 L bottle	HOU-LIZ-007	t	2026-10-19 18:37:53.761	2026-10-19 18:37:53.761
73e2f419-1fbf-4aed-ad29-a3207a8431c3	dc9451f0-005f-4e9a-89e3-dee40dd86896	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Colin Glass & Surface Cleaner Spray	colin-glass-cleaner-500ml	Shine booster technology for streak-free windows, mirrors, and slabs.	95	110	500 ml trigger spray	HOU-COL-008	t	2026-10-19 18:37:53.767	2026-10-19 18:37:53.767
7fa6104e-06bd-4695-a0e9-40c236835cfe	dc9451f0-005f-4e9a-89e3-dee40dd86896	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Scotch-Brite Heavy Duty Scrub Sponge	scotch-brite-scrub-sponge-3pack	Nylon web scrub pad bonded with absorbent sponge for clean vessels.	75	90	3 pcs pack	HOU-SCO-009	t	2026-10-19 18:37:53.772	2026-10-19 18:37:53.772
84a03f23-e712-47a9-a181-fa4a5d5f539e	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Comfort Morning Fresh Fabric Conditioner	comfort-fabric-conditioner-860ml	Unbeatable softness and 14 days long-lasting floral freshness.	215	250	860 ml bottle	HOU-COM-010	t	2026-10-19 18:37:53.778	2026-10-19 18:37:53.778
3188ec05-17a3-4ebc-983e-fd1cfb3f31ae	2a58bd88-3dba-4725-ab86-dbb48abee090	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Good Knight Gold Flash Mosquito Liquid Refill	good-knight-mosquito-refill-45ml	Instant knockdown formula releases flash vapors against mosquitoes.	80	90	45 ml refill (twin pack)	HOU-GKN-011	t	2026-10-19 18:37:53.782	2026-10-19 18:37:53.782
8834c36d-c77e-4128-9592-686fedbce93a	dc9451f0-005f-4e9a-89e3-dee40dd86896	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Odonil Lavender Bloom Room Air Freshener	odonil-room-air-freshener-50g	Special odor neutralizers with authentic French lavender aroma.	55	65	50 g pack	HOU-ODO-012	t	2026-10-19 18:37:53.788	2026-10-19 18:37:53.788
05af30df-c58b-4a13-95ee-14314dfcab60	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Origami Ultra Absorbent Kitchen Towel Rolls	origami-kitchen-towel-rolls-2pack	2-ply virgin pulp paper towels for wiping oils, spills, and slabs.	110	130	2 rolls (120 pulls)	HOU-ORI-013	t	2026-10-19 18:37:53.793	2026-10-19 18:37:53.793
243e32da-8600-4fe2-94cd-50c65a022a4c	2a58bd88-3dba-4725-ab86-dbb48abee090	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Shalimar Oxford Black Garbage Bags (Medium)	shalimar-garbage-bags-medium-30s	Tear-resistant leakproof trash can liners with convenient tie string.	85	110	30 bags roll (19x21 inch)	HOU-GAR-014	t	2026-10-19 18:37:53.798	2026-10-19 18:37:53.798
b07d4bc6-7e29-4706-b961-76e005cf53cf	dc9451f0-005f-4e9a-89e3-dee40dd86896	0f8f596d-bf6f-4fe2-8946-612c733a9d41	Dettol Disinfectant Multi-Surface Spray	dettol-disinfectant-spray-225ml	All-in-one germicidal spray for sofas, door handles, and kitchen tops.	145	175	225 ml aerosol can	HOU-DSP-015	t	2026-10-19 18:37:53.803	2026-10-19 18:37:53.803
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."ProductImage" (id, "productId", url, "isPrimary", "sortOrder") FROM stdin;
31ef90a8-b7af-4ddf-bebd-46152ff52d19	a651883d-dddb-4b0c-86da-3d0ab7f662db	https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80	t	0
3fc8e0aa-4d25-4a80-b2a9-b91c31caf851	48a2d932-eea5-4c71-987d-a88114e62c39	https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80	t	0
3310aec5-b844-46d3-bbd7-c6a0fcc22dca	9941ab22-31bd-4009-bdae-dc08be66b8d8	https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80	t	0
2fcaf57e-ad05-478a-be78-8447d1bcdc77	cd1419d5-f3b5-4a9b-ad77-b5f4cc738400	https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80	t	0
97b82133-412a-4907-8f23-e7d8203010d3	c55e5714-3c24-4ac4-8a5d-3ab9edfabd1d	https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80	t	0
fc8ba00d-9fe0-41c0-bec1-62b664237358	b2ab66d7-09c4-4cfb-93b1-dc6362c570fa	https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80	t	0
b6861f3a-8897-4c00-8e05-208aba60db0c	ea2a5cbf-5c3f-42a4-96dc-a11e7cc938df	https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80	t	0
e694bd10-2b29-47b5-9e1d-13661a6c106e	69df3b08-19ed-4eed-b50e-66b23aa8e681	https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=600&q=80	t	0
ae489a59-90fa-46b4-8e48-16b1938b6542	6d3c8686-bf0b-4035-a0fa-ee31c574fad4	https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80	t	0
29f9b0fa-e63a-42ee-ac39-cc4899bd16b4	bc55e1ad-b6bb-44ff-aeba-84001584dd2e	https://images.unsplash.com/photo-1536511135899-73f1361c4701?auto=format&fit=crop&w=600&q=80	t	0
05e66cad-96dc-446f-a651-595da67fc4bf	41a268b8-f6c3-4f0f-a4dd-ab90a1080bff	https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=600&q=80	t	0
8dcca756-4268-4f3f-b952-f2062ba03416	e999e1a8-eb98-4712-8fe3-a158742c7bbf	https://images.unsplash.com/photo-1587496679742-bad502958fbf?auto=format&fit=crop&w=600&q=80	t	0
ccf95cb7-fc8a-4c3c-97f3-e0f6ce1f835e	01a2ab5c-c35b-48df-a5b6-637ea000d3d9	https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80	t	0
1e9982b7-07e1-462b-af79-2d812cafea98	d7b79eeb-1516-4bd7-be6e-530d5aa17664	https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=600&q=80	t	0
b4782e52-6756-431c-bb54-c6b80175bd23	d7ed3810-76c9-4296-b4ff-e824e752d03a	https://images.unsplash.com/photo-1514756331096-242fdeb7004a?auto=format&fit=crop&w=600&q=80	t	0
1a83192b-69a5-40c3-8eaf-f4b4e01a7ae3	5e4186da-b4d0-4c74-a48a-9170f8dab89f	https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=600&q=80	t	0
218dce4c-781c-4877-a5cb-9447b9b2c80d	df86cd8e-b135-401c-96fb-13326a5f11d3	https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80	t	0
03482985-0212-46d7-82a2-16e0d8b84927	b3514a8b-3040-4906-9f00-0dbb1df8ff23	https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80	t	0
cf805bcd-0367-4b4e-9551-062f23c735b4	bb30627d-a4e1-41c5-9f30-7cfcd1c96a39	https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80	t	0
f247cfe7-4458-4929-a8a8-a68304194486	47d67654-23b1-4ea9-9805-cef38180f1d5	https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80	t	0
da86efd5-b242-426b-b9ce-5cf56a78e5dc	0e1e430f-fd78-4aac-89d0-af903dc3bf9d	https://images.unsplash.com/photo-1615477032128-1f6e24698ea4?auto=format&fit=crop&w=600&q=80	t	0
61006f6a-4144-4e92-a1f6-c268da1dc64c	08f97677-4e96-480e-8178-f930eff362ae	https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80	t	0
9142a2f0-f675-4989-8eb4-abdcfbeecf69	437b0a39-18a8-4d6f-8098-7b21745bfcef	https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80	t	0
cf559acd-7189-43e5-aa81-076bdf866ea4	7a43b8d4-4337-4a6b-a458-08845abcbb12	https://images.unsplash.com/photo-1611105637889-3ca719e7a836?auto=format&fit=crop&w=600&q=80	t	0
4236e6be-422f-4714-ad9c-b52fa476fecd	35d4ce5b-f6f1-45d2-abf9-fe5a9faf6d4a	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80	t	0
dede48c2-ecbe-489a-b8be-1c30467e77b4	b6984c5c-37ed-4c5f-9f8c-5bd0b3b6c723	https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80	t	0
484655ae-0100-428e-8117-f56a9b8153e3	365fe12b-a759-45a1-93e2-0edf8fa2975a	https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80	t	0
a65062d2-09a1-42f4-8636-5fcdd0f6437b	eb5fd2b3-b823-4685-a5d3-20656c99196c	https://images.unsplash.com/photo-1628773822503-930a84d9c49a?auto=format&fit=crop&w=600&q=80	t	0
2054d372-1883-46a4-90c4-68613e541c54	05f9d474-e1b4-448e-a4e6-a59c328a1743	https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80	t	0
cbfea394-d34e-4229-9465-3afe6f519193	1a21fb45-4968-408b-80e3-25bef8f57213	https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80	t	0
c4e7886d-df45-43e3-b0d7-f968011b2228	f14b7d90-4a21-4ef0-adf5-d9284004d24a	https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80	t	0
558ea252-e5a5-4815-9d52-2d4bec387a20	c160d9ea-8fc4-48a6-80ff-bdc2622ad5bc	https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=600&q=80	t	0
bc69fc9b-1829-493b-84af-4b61ef440b20	fecc47fb-2523-4cee-a95b-2eda5212c770	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80	t	0
06e7c002-4dbd-4382-ad47-94f1ebbd8f29	5012a008-cb7d-47fd-9c15-4bc49b4957ff	https://images.unsplash.com/photo-1628773822503-930a84d9c49a?auto=format&fit=crop&w=600&q=80	t	0
df652c38-50a8-4af9-bf57-430a1c74ff01	8e360a4e-fdb7-4ac5-85d3-0edfb702c247	https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=600&q=80	t	0
4d5661dc-7775-4d97-abdb-f871ef56190b	75a1c505-a1f6-42c2-9bd0-f0b7f1100c7c	https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80	t	0
40eb1c42-988e-441b-b5a5-d3f8d2eac09a	aa6f4370-611e-4977-b80a-eb6a4912bd2a	https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80	t	0
85cbc1aa-2de5-4eef-bbd0-cf6abb352406	37a9546b-9185-4b3c-8d87-decb471ba112	https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80	t	0
464fe339-976d-4f30-bdb1-16557f665513	c618f820-2ad5-4b53-84f4-5164277f82ad	https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80	t	0
580cc4df-76a2-47b5-9242-b8d65b4c0005	33a214ab-0f00-45bc-b17c-a8fd4e9fd4d3	https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80	t	0
72a48181-b09d-4d45-b5f8-9d7903f89c49	0fa6ef38-aa48-4134-bbd0-b53be4e196fb	https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80	t	0
716e3231-0180-49b7-8d85-b1669b34abb7	2444af02-1267-4672-9821-13d22a974744	https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80	t	0
e8d6694b-27cc-4c7b-8e02-c30287037e03	7cbaf302-5d85-4ffa-b96b-67f76ee128e7	https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80	t	0
484ae300-6c72-4275-b020-76077622efc6	c9dbe7ec-94f3-49f3-ba7a-681e6a8619f1	https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80	t	0
d1004f4b-1be6-451f-a5b0-e5dad71617c6	d3ac5ace-f9f7-4887-b16f-c69dfda58e18	https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80	t	0
fd8d4c30-1364-4335-aa4c-9cddffc257ea	0475cf7d-0a0f-4edd-beb3-09da04901502	https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80	t	0
9d77cd7a-dbc4-4af2-bacf-843b1dcff762	8dd0dfc2-6bf4-45d5-b221-88ab5e26a54f	https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?auto=format&fit=crop&w=600&q=80	t	0
b02b7520-f6b4-45d1-9d39-1f982356d8f0	3f6d065b-8473-4fca-94e4-0b891204198a	https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80	t	0
622eb6ea-8b49-40f9-86f4-725a22d1fa02	ccb4186e-1f7d-47bd-a665-bac126e16837	https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80	t	0
d55955cd-1495-4c84-99b2-d6dd41b33317	43ca65dc-249f-44f9-831d-52a2ceb9585a	https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80	t	0
a9ae1489-d548-4908-91c3-5625d7a11a78	6c0d4f18-c84f-4365-be45-da8dc1a127c3	https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80	t	0
e15c5c37-6420-4232-956c-f0c7c92e2890	2256172f-595d-4edc-819c-f51d81794ed9	https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80	t	0
acd60b7e-8bb8-4680-87af-78b2f159b81d	e72efdf2-cd2d-48de-992f-48eaa4b8cc0e	https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80	t	0
89ab927c-d65f-4e6d-bfd3-40c4d684faea	d088fb18-4843-4589-9213-60fd1a07f2ac	https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80	t	0
93b9f299-b724-41cf-865c-91845562e19b	e31b332e-3ebc-41a4-8f1a-bbdcaa9f940f	https://images.unsplash.com/photo-1586765682613-b605b6dd0ff8?auto=format&fit=crop&w=600&q=80	t	0
0eab7e48-6e32-4565-b296-245d03c0fbe7	cee5075c-62cd-4cde-86c5-a00367c08484	https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80	t	0
d52b8c03-f848-41ec-b779-2e7bc88735e8	7074ec46-2b5a-4a17-84fe-084994a4a9d2	https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80	t	0
3b739f7e-6e03-401a-ba84-f9f031c91a85	ef8a59ef-b653-4e89-b4b5-2bc55554e982	https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80	t	0
5650cefe-9669-4a8b-9a15-c9adb01a0407	b7a787a7-1706-45b5-a594-fee77bc9a682	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
00cd470c-91af-42a5-a9da-1a79b6c89e49	a91a4c89-da68-480d-a1cb-066fb10f9719	https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80	t	0
84c41463-f968-403a-b607-1683a54b41a4	ba487692-123f-47c7-b0ee-1133e7ddf5c8	https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80	t	0
82d09ad4-410a-469d-89a0-6f2410c7bbe0	bc6d1e46-9be2-4df3-bc0a-17ea06ddf235	https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80	t	0
812620c4-2151-4192-806f-c7b21faed70d	6d3738ca-aa1d-43b3-95a3-94168a56dced	https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80	t	0
38718892-741a-4716-9054-c830c057c4d9	6fa8e816-f665-4bfc-87bf-c90563e3f635	https://images.unsplash.com/photo-1586765682613-b605b6dd0ff8?auto=format&fit=crop&w=600&q=80	t	0
bee30de9-d397-4644-8d7d-375c25274487	c7a41a64-2748-40ad-a38f-871513bbe531	https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80	t	0
ab8c2f23-dbdf-4854-be74-534b7cb4c719	029b8cbe-5996-400e-a576-06b1ab82d3e8	https://images.unsplash.com/photo-1586765682613-b605b6dd0ff8?auto=format&fit=crop&w=600&q=80	t	0
3e8ff67a-edf6-46bb-84f5-c0b227bd236f	02ce6e43-cb68-45fe-aff3-2798df163050	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
ae9d17fc-5442-403e-ae55-39ddec435610	d3c30fd3-1994-4524-90e3-abb5f9609098	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
2eb61b6f-61a8-44f7-883e-ff3d18c35a5c	cee8074c-b468-4409-b052-497c50848ae5	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
b3ad5310-29b7-43c7-99a3-e285f14d5768	db3674eb-e3c8-4006-91d5-20e51890f3eb	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
07f2525f-fdc6-4855-b502-1948ba6d5329	82ca3881-c9c9-4e4c-866e-ef496d619359	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
9a375e06-8a1c-48c8-950e-df7516a894b6	edba199b-8bc1-48b4-b59d-103dd11b8dc1	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
f50297c8-ee3c-48a9-8e67-1044dba10614	85fafba3-0007-46e7-b6bd-caf312b7b7ef	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
6b69626d-14d8-4070-a0f3-68d9ad88061c	ea487ec6-f206-4a1f-bbce-3305be1bd80e	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
63ceaf13-d9bc-4430-a083-d0cbf0797dc4	d5dce57d-e9be-4778-908c-f88022903cd9	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
dbc1da26-0d3e-4738-9c1e-c84568e43778	98820aa8-20af-4408-a4bd-516a1b6b39e1	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
527c6988-1ec9-42d9-94c8-181817bd29bf	4199cc23-15e8-45e8-89f9-1c811fc5f266	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	t	0
eb684b74-42d5-4a2b-ac8c-55d92b188fc4	18a5b661-421c-47cb-a20e-ee71f9643b65	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
40b340d8-034a-4e6e-8d62-baecfc980a48	975b636e-e7a8-4f85-83ae-56d35d4f4b76	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
743ba54f-901a-41da-8a97-a59552cf2a09	c4a4e602-60b4-4e4c-9f4c-943f5780f4d8	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
9ec199a5-f737-4cf4-91be-8d98b2e8e460	66d45283-fc18-4838-b4da-03be5e9b43c1	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
9871a21c-1d00-4dc6-b739-14b8ee7e752d	0aec9277-a957-4878-8cd4-7e75ef419854	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
e8cf9d44-a25a-4a09-8056-493141fc4adc	dd221e2b-8d29-459b-ab0a-0a57827e5ffb	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
0795ffa5-8a47-4632-b64c-75ae1c34cd07	bad1fae6-ffa9-4d4a-9e82-51f5a01c8972	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
39b8530c-8c13-434d-a24f-2c17a04e4e7d	58c61396-06cd-4424-bb6b-e751a18be72a	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
cc573e7f-263a-4098-a4cc-ffcd3429c04b	3265a2a7-4f86-4f16-8170-c299d44fd5a1	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
6360466a-68e5-4f21-b8ef-39c5a935c056	18ebe3cb-0dcd-4591-abb6-f21bf70416fd	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
f47a3d0d-5c18-4f4b-a314-36b25f3d4145	5e3d0d18-b89a-4768-9ab9-e8c2ea88d521	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
f3f4e04e-055b-40c4-a90d-c566773c0bf2	4ffda3f7-cd58-4df0-a7e4-60088d12602e	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
27758bfe-71b6-4004-83af-101c9c6ae8ec	3b1ddd5f-7b15-4e1f-b085-7c45485a7f03	https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80	t	0
c70d30e0-1e3f-4509-8d76-a9c12afcdcac	9c77e34f-becc-44b6-aebd-907c22daee62	https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80	t	0
78cb9b09-f56b-4fa6-9f3c-a55a2a115501	6869c586-fd6c-4bdf-9aa0-c9edd9cf2d6b	https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80	t	0
840b125b-36e6-48d3-a91f-8074fc9dfd66	049911c3-7af4-4a00-a3c1-b200b248e91b	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
2ad546b4-77f4-4fa9-b050-3e78b4892d07	637127d4-5684-431a-8b9a-10d812e13bb3	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
476536f5-5dcc-47f2-bc95-9e7a53db6c75	39be6d4d-f3c2-4d3f-b359-ddbecdd8aefa	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
e5ef286e-2ddb-4427-a975-4fb0571e553c	6110916e-6788-4abf-8c2d-3a1ac860e922	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80	t	0
f03f8bcd-e455-4261-b69e-1dd942ab476c	4e9f0860-4838-4955-aa8b-f65119d7dcb8	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
4577631e-1610-452f-a289-bb09783a61a6	10a705b8-3342-405d-9085-bfe95b42556d	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
0c63c9b0-a142-49f4-a905-a2c3907080c9	f56fd32b-34ff-4cdc-9e26-ba5eabfa714c	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
0fc6fa76-8895-4363-a627-47e0ce97843d	f391d2b0-9f28-4afc-af27-6289ee841d42	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
d839ebf2-526a-44fb-a64d-29c4ed39cc92	a1eed8de-e2aa-4878-a53c-a8ae56691a3d	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
ecbb5410-8e65-470b-b5af-d8c633d7be1b	246ed21a-73de-4bb8-83c9-7339890a1e20	https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80	t	0
d90bef14-10dd-4720-b1a6-93dcb224b784	8e146d98-0984-464a-8f82-8336e2cde221	https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80	t	0
148ea6fb-ba94-4df2-aef3-156a62de2199	32ecb7ab-1a13-46f1-9058-c937beaabcf1	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
7098fcaf-915d-4831-83e6-826f4b52afc2	ff107b83-7b03-4a4c-97d3-ed0195017d71	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
66777de4-71f2-4b10-9a32-2a412484ea1a	68d1f3f2-2605-4a7e-8cce-919acd7d496c	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
bcf2e405-e16b-44de-975f-c001f3425a91	98fcd9ef-5b4a-4fa4-ab4d-d2b211902ab0	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
44934d4a-a760-4e5d-a6eb-b04463948dcd	445fbf4b-5b7a-4545-af70-5d13cb7ab912	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
52f152a1-b5fb-4349-aba1-8dd31127c6b5	650d6531-6bf5-4658-af45-96380dff7eaf	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
eefdd334-4fc6-4881-ad56-0c2685ec5c60	8e72f8b6-4b8a-45cb-a1ed-2f7cf6f9d57b	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
9e64b765-a7e8-461c-adaa-66c6e8b56d9a	6d81e72c-c896-4a1e-a370-37778688c9d1	https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80	t	0
1ba9cd01-b738-4f22-b87b-7ae070bc0a88	ec58bce6-62e2-4413-a6ee-48786551fccd	https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80	t	0
74614ce0-6604-494a-918c-72f15dac0d97	2175cd0b-9a10-430a-9dc1-d3bb87b9d3d1	https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80	t	0
4403c0ee-5c5c-4f6b-8b7b-05385e750c99	a7cef11c-134f-4a42-96fe-bd8f74ce3e01	https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80	t	0
84579a93-c81c-4049-b0d2-9da37926e081	c15b0d89-0eaf-46df-9b2d-d4ea728544ac	https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80	t	0
79f2686e-6621-498a-8be7-9b11b12ffa6a	6eb4e151-d37f-4209-92fc-240b1d90519e	https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80	t	0
c30f182e-aca3-4ca4-9f87-979787fb13df	fbe3fdfe-4746-4eb8-9475-995e9741ba22	https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80	t	0
c182b2c1-1938-4a79-abf1-823314950f18	f20d5f5a-191e-417e-9b68-137894d321ef	https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80	t	0
0cdc9dd6-4ae6-4c9b-8b44-aa047813cb4c	46248518-85db-4268-bb75-a08992059587	https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80	t	0
656ddc98-55df-410b-9c25-7c4755f41a9a	fa8439c6-9e25-4b37-86e9-15bce306684d	https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80	t	0
ad211493-e2b8-4cf4-bf9a-18bf58a4ff67	6ab06c08-1d02-4c15-a393-9497179150bf	https://images.unsplash.com/photo-1508061252224-237ff54ed5a4?auto=format&fit=crop&w=600&q=80	t	0
9dda014d-48dd-40cb-bd9c-0623d79eea99	b86019fc-2d69-45e5-91f7-1b1f4756026b	https://images.unsplash.com/photo-1508061252224-237ff54ed5a4?auto=format&fit=crop&w=600&q=80	t	0
3b585497-9a1c-4e14-ad13-01cbbe87a08d	328ee321-9b71-412e-a0f1-154c50f7eb53	https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80	t	0
c68e59bb-e239-4846-bb79-39f37cedac59	e208e44c-0ed3-4d40-aee6-ba649b586f75	https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80	t	0
f64c9623-c353-4657-b748-0a55edd0b84a	941d7c6a-b7c8-4765-9c57-d51e2faf7329	https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80	t	0
07d16f4c-1881-4bd9-82d3-a6c28b8f8600	d25bde92-9f72-4b38-8639-9aebbb56f650	https://images.unsplash.com/photo-1508061252224-237ff54ed5a4?auto=format&fit=crop&w=600&q=80	t	0
8abf5e91-6118-4f60-a575-228e3e2280e2	50223ac9-c606-4cf8-910a-b801ff2edfad	https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80	t	0
9669f487-ee82-4bb5-b81e-a24bbf96f931	aac5610e-12e4-4917-9980-89b937980a8e	https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80	t	0
f2a06fda-29ba-4505-94fb-72eb0a194dfb	361c4a7a-9997-4e19-86f7-e35e631dbb41	https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80	t	0
1a84df46-3fb1-4f50-b390-da4d6b3ebd92	4bea3880-65e4-46b2-ad72-37ae9b1ec841	https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80	t	0
3c4df692-015f-4352-9246-8026895b0776	ebcec839-e427-47bc-8dc0-e50fc5429ec4	https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80	t	0
b04a2f1b-a5ef-463e-a7af-a13946b2e61d	d49288b5-2fe7-415a-99a9-07b9202fde46	https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80	t	0
a00bad6b-512a-4e0d-b8bb-2709f63afe77	9b3bd756-c45e-4222-a102-b979c7a18c95	https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80	t	0
4491d4a3-93ce-40a7-8904-2c3781d9aa9e	87846887-5a68-458b-9107-46b0868dd993	https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80	t	0
2cda14ae-cffe-4e17-af4d-52b5bfbfa35c	352668c0-2552-4c07-b43b-0945ec8d47c2	https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80	t	0
49d5ac6f-4070-47e2-ba8c-4035a2731a2b	d4cd1b9f-52f6-4a43-943e-4d7a1bbe7ade	https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80	t	0
1230b094-6c00-4f6b-a2d7-ad609a9cc203	c0ec7bbd-9e35-4e65-a7a9-12a5eb7f083e	https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80	t	0
4ad510e4-5c1a-46e1-8d14-dd8f189b3b40	9bf8e7b1-1ba3-45ca-b40f-d7b2d50a1273	https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80	t	0
5f147923-da8e-47e4-b67c-fbad38febf6d	9398e221-8176-4fb9-afa1-3875fe5b0978	https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80	t	0
7fd3f396-530f-45ec-a77b-6a4756b4ba36	0e5bf48c-6b37-4fd8-af0a-14e9187f80a8	https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80	t	0
e9357717-1739-4eb8-9b4e-e8c3eb3e1ce2	c8de6971-d906-446d-9771-8126cd3b8c86	https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80	t	0
0427f56a-a6de-43fe-9a15-7f58da5afbd3	402f5ae6-40f7-43d0-a74e-dc98799e579f	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
abfb43cd-1f76-49f6-b3c9-05950d6c0580	162ed9c8-1a4e-420e-b540-096a3d5fee8e	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
d34464cf-8e77-4701-a9d2-61b52e19f92f	7ac216f1-bdad-4ed4-a489-f0d07cde41fd	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
de08c7a7-635b-40c9-92fe-89efa9784790	2f3f041f-4efe-4421-bc3c-67e91d690b0a	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80	t	0
1b447601-9755-45e5-a052-bf2073749ae6	cf71d3d4-1936-4b91-8b9f-c9d0b45505b3	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80	t	0
770ac81d-1741-4c42-aba2-205b70f0fd18	3824e82b-747b-4528-9fb9-6ff957be2e7c	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
02869505-7fde-43d4-bdcf-335390b530d5	437d6c7f-656a-44c3-8580-983d634856ff	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
f0fe4b0f-a9d6-492f-9871-96d74a87c06f	952b9dd4-6425-4a8c-9846-5014604330f4	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
d1e4e353-8162-4eba-9c71-5fb20eefbede	4423347b-36d6-4cbc-88b5-bd452c2ae7ca	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
08f10295-0825-44d7-9106-70a8d8ded4fb	20bd5201-44e0-4f6d-aff5-529462b5c3d4	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
b4bc031c-332d-4e54-b4ed-59563f44e88b	770aa128-df2a-4406-a2e8-a6110baf37ba	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80	t	0
c9aad4f6-c521-4969-95f7-88f856bb3ec1	1d71a949-43dd-424a-ac94-687625bd2992	https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80	t	0
9937150d-1af0-432b-9a01-4fe983200de6	c95626aa-957e-4fd1-aba9-56d64750a302	https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80	t	0
e79a0ada-1193-4179-adb0-1d81870ba3ae	19d10f5f-97b5-4dc7-b72c-bb83c3acf760	https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80	t	0
8a800eec-83c2-4f9f-bd0c-85a149bdf822	e8a31b6e-4cdc-44b6-a3e7-79dc08fe6e4a	https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80	t	0
914021f4-10d2-4712-a671-e50412978f96	62700de7-5083-4d36-ab30-29b4d18dafb6	https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80	t	0
9115ab5d-0de7-4a86-a500-ddfba508ffc0	05236ba1-fcb1-4e1a-890d-2c82cb562a58	https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80	t	0
95d19a93-5941-433a-bdb3-080c8202730d	85186dde-07bf-4e06-8f95-a18fdf4cb7e2	https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80	t	0
5bf05941-0534-4b52-9974-78c8c6d261d3	987a9d6a-24b5-4ec6-aa45-be8c3ba18f04	https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80	t	0
9e5f28a0-0f7d-452d-b9e9-7f686718cc4d	81aa45de-f5f2-45c3-8333-50f6b584f087	https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80	t	0
0a01b9ce-178f-4c60-ac75-e540eda963a7	ae70cdef-cc06-4579-90e9-8f964b0bdea1	https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80	t	0
6d6e2956-2606-4e97-8d19-b6d79f48aeaf	b5abaa5a-0fac-43c4-92a6-cb8ce0d1f474	https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80	t	0
afed7475-364b-49cf-89ed-ccb2a00061f2	f93aa39a-0835-4629-8244-a2b5082536c2	https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80	t	0
6182c363-9563-44e3-91b1-e057857f85ee	4454c902-6a5f-4f7b-b14a-72a34d20c1d6	https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80	t	0
0a66661d-5c3e-47a9-b8a1-b1be74be9112	c3677ff6-9ec1-4dd5-b94b-2249084c98c3	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	t	0
827150d0-83bc-4e32-83f8-fe1fd29ec37e	be29c303-414c-4369-ad7d-4d0410167ed5	https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=600&q=80	t	0
2e4b9926-1ffa-4c03-a25e-1504391dd0d0	881bf9a3-f656-4c81-98b4-9f2ee67e20c0	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
986158bc-f648-44b2-adee-e30a2f7aff5b	351fea53-2f19-4fc3-9234-7e166e0457d4	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
84ccf281-b54f-4dc3-8aa1-f8b72df09313	a786e66c-0f43-48af-a177-f6e28d077163	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
c60824e2-3478-4ad4-8a69-3c8bd92b1a3c	b5bfa8a3-685f-414a-9a47-b41154725547	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
8249be5d-20c8-4fe2-9ab4-b03e7c0d3b92	6e00fa18-6995-4993-a87a-23f26f684e92	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
4f981dbf-b642-4121-a7b2-42f48b2092c5	ec52943b-1bb6-4075-bdf2-0d539ae5d202	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
aa2db073-8c7d-478b-8ea1-7c6e03ce80c7	e948d4e7-ed66-4b39-a8d0-2c5d04cf91ec	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
55fdaefe-3a22-4956-9e59-96ce707dd0d8	34f20b70-e2c3-4ba8-bbfe-bc2a1a4a170d	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
fd17093e-bd9a-42a2-93e3-3058f6a05ee3	7015fcf4-fbf3-4ad9-be41-b95c292a3b3c	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
2f2577f6-0b41-4ffa-a4a9-a84015af27db	7babb798-02c3-4eac-a6b4-e9685a7afc0e	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
627e8a53-cab1-471e-a360-97ed731b8ac5	65336cd2-b1ab-4a08-bdd7-8c7861259df0	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
bf78be57-a34e-4977-aed0-3adbf010bcac	ac489902-99c0-4699-8462-a08481adf77a	https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80	t	0
17da0cac-34d4-459c-b6fe-44e31d3392a5	ec4d8a96-6c32-42ee-b1c0-0c86e36d57f4	https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80	t	0
431c3fd2-1a25-4a3d-8b6d-6db5474ae994	cd2ba2f4-7563-4d54-9f90-1e6f204ecb02	https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80	t	0
f5991f30-84c9-406f-9946-59f0bc63af8f	ef811048-02eb-45f7-aaf6-477b7f902630	https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80	t	0
576b3ad2-5e2c-4e5b-a3e8-42d2278189af	73deb8d0-b534-4cdf-ae50-0910eb29c9af	https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80	t	0
cf6905e4-775d-4800-93e2-f1bf216b440b	6c6759fd-fca1-427f-91c5-c76a6ef99ed5	https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80	t	0
789b2f0f-2830-436c-8569-3eb1cece2887	fa011695-2193-4d49-a58b-db00a1969009	https://images.unsplash.com/photo-1559591937-e103239712a4?auto=format&fit=crop&w=600&q=80	t	0
42653f94-d376-40ce-a045-42205df07805	537d3db3-8bd3-45cc-9477-1c279da938d4	https://images.unsplash.com/photo-1559591937-e103239712a4?auto=format&fit=crop&w=600&q=80	t	0
00a12379-0301-42bc-839a-7a7285f3260f	5fd0c658-a1c8-4e88-a655-2e982bcfc4bf	https://images.unsplash.com/photo-1559591937-e103239712a4?auto=format&fit=crop&w=600&q=80	t	0
030bcf37-4864-4dcf-8460-0e9d97b422da	1d81a3ef-6776-4ba3-94f3-b1429e357452	https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80	t	0
0fe8d6f1-94a2-4bd7-bcd6-e211f6461714	09032f1f-1606-4346-906f-68274957f23b	https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80	t	0
77e0cad5-b90f-43ed-8f56-91339ce29148	d79e3b0a-9e5f-4aaf-8c70-aa585b930775	https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80	t	0
d2e1d1de-41a6-477b-9efd-9b4a03b375db	0a6d6465-6bfb-4036-881e-a904045bccfe	https://images.unsplash.com/photo-1508380702597-707c1b00a3a0?auto=format&fit=crop&w=600&q=80	t	0
e17bfc40-8b6f-472f-8108-574949dd9609	41292907-b9a4-4a85-820b-b572c693a949	https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80	t	0
861597e8-b296-4ddc-96de-bf98e4bb4ed6	6caec009-9834-4d89-8985-539dfc59dc8c	https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80	t	0
3e15b911-955d-4d02-b7bd-c733bebe49a9	5ac21124-96ee-49f7-b599-6df11531dbd8	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
563c9ff0-a709-4066-ab45-7d44b6279a85	b795b09b-a924-4ec0-819a-42886913380f	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
0aa28ef4-cdf1-48db-bf6d-10699da9133a	8c6d8142-8be0-48f8-8807-6d98722be032	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
b0ccbe0e-cd3b-494e-8839-070ccceae237	b7f90340-730c-41f2-9e76-ae1734512b52	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
e80d3986-5179-48c2-acc1-ef38c7459b6d	a0343e4f-9e9c-4749-8045-306cd07514a0	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
8b6a74a5-df2e-405f-8e1b-d95afb012634	4b6660b9-b600-4d5f-8a85-679292a5ad3c	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
005e8e92-0edd-4a54-95c9-f61e08e91d1d	3efc984d-a2cd-48d4-ad88-5b9e82b33ea5	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
468d613c-f805-48dc-bf80-3636243f8a07	73e2f419-1fbf-4aed-ad29-a3207a8431c3	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
2e3c08cf-dbb2-4a36-9296-82050b570084	7fa6104e-06bd-4695-a0e9-40c236835cfe	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
0d346f2d-6c04-4a6c-8ad1-bd9d08dbbc9f	84a03f23-e712-47a9-a181-fa4a5d5f539e	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
13d16432-3aec-44b8-896e-ee67525f76a1	3188ec05-17a3-4ebc-983e-fd1cfb3f31ae	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
c88758d2-f352-429f-a46c-1f7767590b37	8834c36d-c77e-4128-9592-686fedbce93a	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
7f03b5b4-fc98-4f77-8094-ee3e233eba38	05af30df-c58b-4a13-95ee-14314dfcab60	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
4c070dd6-6c7a-4ad4-afd5-dcb417e8b486	243e32da-8600-4fe2-94cd-50c65a022a4c	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
690123d9-64e0-4f3c-97a9-37091cb3b6ac	b07d4bc6-7e29-4706-b961-76e005cf53cf	https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80	t	0
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."RefreshToken" (id, token, "userId", "expiresAt", revoked, "createdAt") FROM stdin;
4ad0d8a9-0059-4d7c-a88c-c29a57075836	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQzNTIzMiwiZXhwIjoxNzkzMDQwMDMyfQ.6nPq7UcxhRYJOkStiLaXl1_eQuuobfUovgiEqv5GUuo	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-26 18:40:32.32	f	2026-10-19 18:40:32.322
eeda9d7c-0cfb-41b6-a147-50961fa951ba	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQzNTMzMSwiZXhwIjoxNzkzMDQwMTMxfQ.pWi3SYDpRgK4Qj6QthakTrDXKw30DjwJdVuZjCZKOlA	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-26 18:42:11.084	f	2026-10-19 18:42:11.086
52342afc-f45c-4a59-8c1c-1db74075c285	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQzODY4OCwiZXhwIjoxNzkzMDQzNDg4fQ.KX8dOhsywlvWdVDniBXDlFZCAXL7k6GhCx7P1zZAj-0	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-26 19:38:08.011	f	2026-10-19 19:38:08.014
8a443836-8a95-46a5-8699-3530c8959cf2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5MjQzODcxMywiZXhwIjoxNzkzMDQzNTEzfQ.v2ObrTXFED7ZSEz19D-17YqFG0zQlFs4Acp8LqHeh3I	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-26 19:38:33.349	f	2026-10-19 19:38:33.351
5fb1dd1a-a2a1-4e29-a52b-df05131c95c9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQ2MDkzMCwiZXhwIjoxNzkzMDY1NzMwfQ.zc88MIA4M2qBJi2hauP7WQmv_PpjCftArWfJ5r8cfzs	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 01:48:50.354	f	2026-10-20 01:48:50.356
09958984-c879-4fb9-8e87-fab68d00e319	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQ2MTI5MiwiZXhwIjoxNzkzMDY2MDkyfQ.rm4-FfZ8p0J_y13YYP6ygUghOzX_PnXLuAcizAynisE	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 01:54:52.138	f	2026-10-20 01:54:52.14
12e30ee2-82d0-4ca4-91cb-8fb09570fa7e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQ2MTMzNSwiZXhwIjoxNzkzMDY2MTM1fQ.zcJAinFI7GiMykIgnJ2hq_X-S9MQAIcWhAaxX5Yi0D8	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 01:55:35.607	f	2026-10-20 01:55:35.609
a378c7c0-2c6f-499f-bb67-8bddbf3c2849	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQ2MTQ0NiwiZXhwIjoxNzkzMDY2MjQ2fQ.JaJHb6CErpuAXb7aODuAhaTJrUHzRzEaA_CPPrzK0-Q	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 01:57:26.641	f	2026-10-20 01:57:26.642
95743df1-4fa4-4a69-be19-65b54dd2ea9c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQ2NDE2NCwiZXhwIjoxNzkzMDY4OTY0fQ.kfknRBnaQeOOI7Y64OZbz6BCPAUwOpBHQ1-mbO9bCR8	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 02:42:44.149	f	2026-10-20 02:42:44.151
e5a118f6-89c2-490c-8ed5-60b162cc09f6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQ2OTE5MywiZXhwIjoxNzkzMDczOTkzfQ.MuR8syk5ttL-pLRnwWQZdoS4IfyTgm0QbXRsI8v6Pto	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 04:06:33.961	f	2026-10-20 04:06:33.964
368a2915-1647-4b4a-88dd-6422d4cc28fe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQ2OTQ0NCwiZXhwIjoxNzkzMDc0MjQ0fQ.87-DoC-wTuhKQeeNQRNJsr5DqI6qhGv58L08keX6_K4	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 04:10:44.367	f	2026-10-20 04:10:44.37
42e100a6-4b0f-4ee0-91eb-36e5747dddb0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQ2OTYzOCwiZXhwIjoxNzkzMDc0NDM4fQ.v0C7Uwtn-Et1WhWyzWWfChRPzz9OXqQybQj5MAJ7OaU	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 04:13:58.374	f	2026-10-20 04:13:58.375
40722001-81cd-4749-9bc3-1a7921688868	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQ2OTY0NCwiZXhwIjoxNzkzMDc0NDQ0fQ.YUw-_53zuniWfjK6WB-_6T6zm-siHWU7HmF8D3zgGnU	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 04:14:04.394	f	2026-10-20 04:14:04.396
39f2e8e6-c8a6-4009-beb9-7e0bafd2baf7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNDY5NjQ2LCJleHAiOjE3OTMwNzQ0NDZ9.-aGmOtjQVV7VPiy6zbUzNs9oOsiRY1_x1MjPKT1mlFA	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-27 04:14:06.974	f	2026-10-20 04:14:06.977
d23debe9-2b1e-4fd4-a383-24c6a85d5127	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5MjQ2OTY2NywiZXhwIjoxNzkzMDc0NDY3fQ.4cpo5pjoswdhUvc1Qm9iOi6Fsym6DP7j64s0sg5Pdz0	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-27 04:14:27.504	f	2026-10-20 04:14:27.506
2f5def22-a4a1-4b58-a121-3b88467c8475	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQ3MTIyNSwiZXhwIjoxNzkzMDc2MDI1fQ.QdNTVpRuL49nWwMzhOIqWK81yraTc8918OKyqgHCoJI	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 04:40:25.461	f	2026-10-20 04:40:25.465
91657315-ae1b-4fc6-b3ae-fb03e8d5bf4a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjQ3NzMzNiwiZXhwIjoxNzkzMDgyMTM2fQ.Nj-TFa1m4DKEdMkPU5o2Uqu03b1G4vSuoGOODobZKMk	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 06:22:16.222	f	2026-10-20 06:22:16.223
30be7557-88a1-44ff-879b-6fed7ff95274	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjQ3ODMwOSwiZXhwIjoxNzkzMDgzMTA5fQ.quZzzbANPZ91dnlhrxi3wISApCsdoyeiNDe2HttTGsk	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 06:38:29.306	f	2026-10-20 06:38:29.307
f8294e70-7839-4d8b-a2d9-51251c360e1c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNTAwNjE1LCJleHAiOjE3OTMxMDU0MTV9.m7BU-4PTjy7hruiFKYX-slr9khKdJo8FhR2ahVRJfGc	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-27 12:50:15.699	f	2026-10-20 12:50:15.701
ae3bb5ef-5c15-4144-9dd8-69dc09a3a805	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNTAwNjE3LCJleHAiOjE3OTMxMDU0MTd9.xQMkaTFgQ58fuJjJ2FZiZIeYh7gbVDrQnUupOnaGxoc	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-27 12:50:17.074	f	2026-10-20 12:50:17.078
52d2c396-4092-4899-abe3-f7f11da1b3e9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjUwMDYzNCwiZXhwIjoxNzkzMTA1NDM0fQ.op_YtEpEmc3vLvzlFsclTB5ia9hJUcPP_FcZQgmBcAY	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 12:50:34.518	f	2026-10-20 12:50:34.519
836c9c78-b930-45b8-955b-b150de27cca4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5MjUwMDY0MSwiZXhwIjoxNzkzMTA1NDQxfQ.-U4sgP7fdndhR13lmODVl3PesJh6CTC1Lfgszt_DfEE	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-27 12:50:41.237	f	2026-10-20 12:50:41.239
276da26e-459c-4412-8037-e3644fd2cf5d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNTAwNjU3LCJleHAiOjE3OTMxMDU0NTd9.mOehtxfC1hIxJSV5AYWFo6J6zcKya4xiOhyatpjxn0c	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-27 12:50:57.53	f	2026-10-20 12:50:57.531
1756d4f9-d60a-446b-8be3-cdbf8ca3cdaf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjUwMDY2NSwiZXhwIjoxNzkzMTA1NDY1fQ.KHJYeCRvKbBqpSBno1yuHvFK8AQrMU4-h3uOe9jW2JI	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 12:51:05.076	f	2026-10-20 12:51:05.078
4c4ce036-4e72-4f6f-9844-8531fc8423ac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNTQwMjE3LCJleHAiOjE3OTMxNDUwMTd9.lsSKZWi4lSSZPhNG4u1A-yrwm_OFi97H1KwYtRDPpZA	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-27 23:50:17.43	f	2026-10-20 23:50:17.433
0ebea43c-2594-40d6-b740-5a8bd08b2844	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjU0MDIzMCwiZXhwIjoxNzkzMTQ1MDMwfQ.Z4DYZ42ThgPVHzcD8OqbOLfwOgA6zP76QD496thOMlE	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 23:50:30.622	f	2026-10-20 23:50:30.624
fa1bdff4-fe5e-4d44-99e7-91a23bafcf7c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjU0MDI0OCwiZXhwIjoxNzkzMTQ1MDQ4fQ._XYwidZci2cQuQR-INFqeBPCAfqMIJY8e8t2q-vwyrA	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-27 23:50:48.655	f	2026-10-20 23:50:48.657
1caed385-1944-4615-8882-c387c7e9f9b2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjU0MDI3MiwiZXhwIjoxNzkzMTQ1MDcyfQ.wwtt2oMPMkuGcQqLdbuv3JtReR_RCqO27vvCRC6OXfE	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-27 23:51:12.686	f	2026-10-20 23:51:12.687
753645cb-3f97-4a5b-b9ec-f18a478c8bd6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjU0MTg5MywiZXhwIjoxNzkzMTQ2NjkzfQ.qrMiNldsEbY7HL-YvvCEKn_k79hb0cAgtQeZOySBd14	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-28 00:18:13.717	f	2026-10-21 00:18:13.719
735a64ba-701d-485a-896d-7687099e2df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MjU3MzUzMCwiZXhwIjoxNzkzMTc4MzMwfQ.Lt-AW3kNFeb4c8U3aDclQthbOE3BT0iS1pCWqyA5gpE	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-28 09:05:30.328	f	2026-10-21 09:05:30.331
3a4ca98a-8bc4-4da3-8a73-3ac9ee7011f8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5MjU3NDg1NiwiZXhwIjoxNzkzMTc5NjU2fQ.7mYkmpVwFEKrCq1bH79c-lYsMVLJqCl8B1ug7Pjq_tA	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-28 09:27:36.659	f	2026-10-21 09:27:36.663
b5f0e0d8-11f0-4f1d-a573-e1ea0aba3eea	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNTc0OTk2LCJleHAiOjE3OTMxNzk3OTZ9.A3PN1wbRif0Q8q7mobqkl83gt7Ne8t0eBlypPIVHBvg	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-28 09:29:56.023	f	2026-10-21 09:29:56.024
67200b11-c455-4568-b950-fb5ef2a6e137	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5MjU3NTIxMCwiZXhwIjoxNzkzMTgwMDEwfQ.2ww12ThpMw438VDJYqBsYO0aKqGQzOMVhzbABy7LorU	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-28 09:33:30.75	f	2026-10-21 09:33:30.751
741470f0-f558-4a27-82ab-f890c62b49bc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5MjU3NzAzMSwiZXhwIjoxNzkzMTgxODMxfQ.OxFH1q3mU-u27OAawFVa-HZYjhrr1VEfNW6mH_VbcIk	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-28 10:03:51.476	f	2026-10-21 10:03:51.479
8d36a9de-2444-46d0-9607-16b3dd55cbc8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGRhOWNmZi0zNGEyLTRhOGUtYWQ4MS04YzA4ZWJlM2E0OWEiLCJlbWFpbCI6ImN1c3RvbWVyQGdtYWlsLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5Mjc2NTI5NSwiZXhwIjoxNzkzMzcwMDk1fQ.hiSB5sTuroXwwZ5eJoJ-xz5N0P12tiPihaL0qLffkYs	04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	2026-10-30 14:21:35.727	f	2026-10-23 14:21:35.729
a0b26592-82e0-496f-84be-ffc53e7050f8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYjZhM2QxNi1jYzcyLTQxZjMtYWRhMS0yYTk5Nzg1NjgwYWQiLCJlbWFpbCI6Im1lcmNoYW50QGdtYWlsLmNvbSIsInJvbGUiOiJTSE9QS0VFUEVSIiwiaWF0IjoxNzkyNzY2MTQ3LCJleHAiOjE3OTMzNzA5NDd9.XMsnpu-B6A9W1lz5JQixAP0z3i3ve633mVf-f2Pe8cI	eb6a3d16-cc72-41f3-ada1-2a99785680ad	2026-10-30 14:35:47.204	f	2026-10-23 14:35:47.206
4bef5af3-8549-4fe7-a771-1a8c47d76cf7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5Mjc2ODMyMywiZXhwIjoxNzkzMzczMTIzfQ.gjDQ7eWzFEAPXjN6XE4uOlzn9Yxx1BZEk5L7EXGBZfI	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-30 15:12:03.906	f	2026-10-23 15:12:03.909
e7e0686c-54c3-4ebc-8faa-f52dcc3eaffe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5Mjc2ODYzMywiZXhwIjoxNzkzMzczNDMzfQ.NFPw05wxPktFkMnvrMHqFUWF3JfygUi2m0uTOW0rcds	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-30 15:17:13.359	f	2026-10-23 15:17:13.361
117b923e-4ebc-4a2f-814b-dd6a52866f46	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWRmMTU4My0wNDhmLTQ2OTItOTljZi1jYjA1MTc5YzZkZmIiLCJlbWFpbCI6ImRlbGl2ZXJ5cGFydG5lckBnbWFpbC5jb20iLCJyb2xlIjoiREVMSVZFUllfUEFSVE5FUiIsImlhdCI6MTc5Mjc2ODcyOCwiZXhwIjoxNzkzMzczNTI4fQ.O1sZmeAllVPjvhcvYdCeH5hUl0jLugUJJYgikpxVxCk	11df1583-048f-4692-99cf-cb05179c6dfb	2026-10-30 15:18:48.422	f	2026-10-23 15:18:48.424
99398521-6529-4ce9-8747-96f45a5f824b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY2NWY0MS02YjIzLTRiN2YtOWQzNS1mYTczNjlkMWExOTciLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5Mjc2ODc4MSwiZXhwIjoxNzkzMzczNTgxfQ.0JUNRFUMTgQM0xcjAWVFIj6CMSWvw_XDcz5HUmsF-Qo	38f65f41-6b23-4b7f-9d35-fa7369d1a197	2026-10-30 15:19:41.524	f	2026-10-23 15:19:41.525
\.


--
-- Data for Name: Store; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."Store" (id, name, slug, description, address, city, state, "postalCode", phone, email, "bannerUrl", "logoUrl", rating, latitude, longitude, "isActive", "createdAt", "updatedAt", "deliveryRadiusKm") FROM stdin;
2a58bd88-3dba-4725-ab86-dbb48abee090	Green Valley Organics	green-valley-organics	Certified organic vegetables, cold-pressed oils, artisanal breads, and chemical-free pantry items.	SCO 28, Sector 29 Market	Gurugram	Haryana	122002	+91 124 9876543	greenvalley@prernastore.local	https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=1200&q=80	https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=200&q=80	4.8	28.4595	77.0266	t	2026-10-19 18:37:52.654	2026-10-19 18:37:52.654	10
dc9451f0-005f-4e9a-89e3-dee40dd86896	City Daily Mart	city-daily-mart	Quick everyday groceries, packaged staples, chilled drinks, and snacks at wholesale prices.	Ground Floor, Central Plaza, Golf Course Road	Gurugram	Haryana	122003	+91 124 2345678	citydaily@prernastore.local	https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80	https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=200&q=80	4.7	28.4595	77.0266	t	2026-10-19 18:37:52.658	2026-10-19 18:37:52.658	10
19fa9ed1-99ac-49c2-9069-4b47052d9cfe	 Market	sunrise-fresh-market	Handpicked fresh farm fruits, leafy organic greens and everyday dairy essentials.	Kapriwas Chowk 2	Kapriwas	Haryana	122009	+91 124 4567890	sunrise@prernastore.local	https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80	https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=200&q=80	4.9	28.24434	76.81442	t	2026-10-19 18:37:52.647	2026-10-23 15:08:38.274	3
\.


--
-- Data for Name: StoreStaff; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."StoreStaff" (id, "storeId", "userId", role, "createdAt") FROM stdin;
407f78d7-cd00-40c0-af38-55bfdf3cb4e2	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	57a9b2ca-949f-4c4b-8a9b-0cd0d36aef2b	STORE_OWNER	2026-10-19 18:37:52.647
7020c40c-7aea-4cc3-966d-47111dae83ca	19fa9ed1-99ac-49c2-9069-4b47052d9cfe	eb6a3d16-cc72-41f3-ada1-2a99785680ad	STORE_OWNER	2026-10-19 18:37:52.647
203fb6ca-e52e-482c-b5f3-55a7f8058a55	2a58bd88-3dba-4725-ab86-dbb48abee090	ec63dfd1-f3c4-4891-9184-e16bb0a361ca	STORE_OWNER	2026-10-19 18:37:52.654
db1bfd81-7171-41c0-82ad-1dcea129c785	dc9451f0-005f-4e9a-89e3-dee40dd86896	99f0430d-3c01-4e6c-b9b4-8b016885bc79	STORE_OWNER	2026-10-19 18:37:52.658
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: prerna
--

COPY public."User" (id, email, "passwordHash", name, phone, role, "isActive", "createdAt", "updatedAt") FROM stdin;
fc387773-1641-4192-ad6d-ba2cae006f5b	admin@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	System Administrator	+91 98765 00000	ADMIN	t	2026-10-19 18:37:52.558	2026-10-19 18:37:52.558
38f65f41-6b23-4b7f-9d35-fa7369d1a197	admin@gmail.com	$2b$10$sCo7Dp8DzYpp9YigHuYAUOkBVqbwEI9mi7OoN/NKYIowMlKQ0R9f.	Prerna Panel Admin	+91 98765 99999	ADMIN	t	2026-10-19 18:37:52.566	2026-10-19 18:37:52.566
57a9b2ca-949f-4c4b-8a9b-0cd0d36aef2b	shopkeeper1@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Rakesh Sharma	+91 98765 11111	SHOPKEEPER	t	2026-10-19 18:37:52.567	2026-10-19 18:37:52.567
ec63dfd1-f3c4-4891-9184-e16bb0a361ca	shopkeeper2@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Sunita Patel	+91 98765 22222	SHOPKEEPER	t	2026-10-19 18:37:52.569	2026-10-19 18:37:52.569
99f0430d-3c01-4e6c-b9b4-8b016885bc79	shopkeeper3@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Vikram Verma	+91 98765 33333	SHOPKEEPER	t	2026-10-19 18:37:52.57	2026-10-19 18:37:52.57
eb6a3d16-cc72-41f3-ada1-2a99785680ad	merchant@gmail.com	$2b$10$sCo7Dp8DzYpp9YigHuYAUOkBVqbwEI9mi7OoN/NKYIowMlKQ0R9f.	Prerna Panel Merchant	+91 98765 88888	SHOPKEEPER	t	2026-10-19 18:37:52.571	2026-10-19 18:37:52.571
e5a7ff9c-0a5a-4e61-a120-c4aa49e8baee	delivery1@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Amit Kumar	+91 91234 00001	DELIVERY_PARTNER	t	2026-10-19 18:37:52.573	2026-10-19 18:37:52.573
cb274aab-da3a-4ec9-a330-96c8658d5d79	delivery2@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Rahul Yadav	+91 91234 00002	DELIVERY_PARTNER	t	2026-10-19 18:37:52.584	2026-10-19 18:37:52.584
adc3435d-39f1-4e1d-b290-977e41c63f4c	delivery3@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Deepak Singh	+91 91234 00003	DELIVERY_PARTNER	t	2026-10-19 18:37:52.588	2026-10-19 18:37:52.588
eb184b6a-a09c-42c7-ba82-056652ef6100	delivery4@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Manoj Joshi	+91 91234 00004	DELIVERY_PARTNER	t	2026-10-19 18:37:52.593	2026-10-19 18:37:52.593
092a7c69-0963-467f-b613-1193d0dc06f1	delivery5@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Sanjay Mehra	+91 91234 00005	DELIVERY_PARTNER	t	2026-10-19 18:37:52.598	2026-10-19 18:37:52.598
11df1583-048f-4692-99cf-cb05179c6dfb	deliverypartner@gmail.com	$2b$10$sCo7Dp8DzYpp9YigHuYAUOkBVqbwEI9mi7OoN/NKYIowMlKQ0R9f.	Prerna Panel Delivery Partner	+91 91234 99999	DELIVERY_PARTNER	t	2026-10-19 18:37:52.602	2026-10-19 18:37:52.602
b09cf1b7-d197-4264-b32a-e22ffda3ee6f	customer@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Priya Sharma	+91 99887 76655	CUSTOMER	t	2026-10-19 18:37:52.607	2026-10-19 18:37:52.607
70ee4ac9-dec0-4d90-a3dd-3002c24fc33a	customer1@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Arjun Mehta	+91 99887 11111	CUSTOMER	t	2026-10-19 18:37:52.615	2026-10-19 18:37:52.615
7532cd02-bc66-44ee-a3b0-66b75cecaa7d	customer2@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Neha Gupta	+91 99887 22222	CUSTOMER	t	2026-10-19 18:37:52.622	2026-10-19 18:37:52.622
235dbf4c-9127-4a13-af49-e5b831692de0	customer3@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Rohan Sen	+91 99887 33333	CUSTOMER	t	2026-10-19 18:37:52.629	2026-10-19 18:37:52.629
8e47de19-da0b-4c34-a0dd-3a8f8cf44b04	customer4@prernastore.local	$2b$10$SPPDnLFttBQkgPJfSGjYP.vki8Abym4O2VZg71WWw0o9pM8UhBsdO	Ananya Roy	+91 99887 44444	CUSTOMER	t	2026-10-19 18:37:52.634	2026-10-19 18:37:52.634
04da9cff-34a2-4a8e-ad81-8c08ebe3a49a	customer@gmail.com	$2b$10$sCo7Dp8DzYpp9YigHuYAUOkBVqbwEI9mi7OoN/NKYIowMlKQ0R9f.	Prerna Panel Customer	+91 99887 00000	CUSTOMER	t	2026-10-19 18:37:52.641	2026-10-19 18:37:52.641
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryAssignment DeliveryAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryAssignment"
    ADD CONSTRAINT "DeliveryAssignment_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryPartner DeliveryPartner_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryPartner"
    ADD CONSTRAINT "DeliveryPartner_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryStatusHistory DeliveryStatusHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryStatusHistory"
    ADD CONSTRAINT "DeliveryStatusHistory_pkey" PRIMARY KEY (id);


--
-- Name: DriverLocationHistory DriverLocationHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DriverLocationHistory"
    ADD CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY (id);


--
-- Name: DriverLocation DriverLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DriverLocation"
    ADD CONSTRAINT "DriverLocation_pkey" PRIMARY KEY (id);


--
-- Name: InventoryMovement InventoryMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY (id);


--
-- Name: Inventory Inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: OrderStatusHistory OrderStatusHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: StoreStaff StoreStaff_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."StoreStaff"
    ADD CONSTRAINT "StoreStaff_pkey" PRIMARY KEY (id);


--
-- Name: Store Store_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Store"
    ADD CONSTRAINT "Store_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Address_latitude_longitude_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Address_latitude_longitude_idx" ON public."Address" USING btree (latitude, longitude);


--
-- Name: Address_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Address_userId_idx" ON public."Address" USING btree ("userId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: CartItem_cartId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "CartItem_cartId_idx" ON public."CartItem" USING btree ("cartId");


--
-- Name: CartItem_cartId_productId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON public."CartItem" USING btree ("cartId", "productId");


--
-- Name: CartItem_productId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "CartItem_productId_idx" ON public."CartItem" USING btree ("productId");


--
-- Name: Cart_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Cart_userId_idx" ON public."Cart" USING btree ("userId");


--
-- Name: Cart_userId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Cart_userId_key" ON public."Cart" USING btree ("userId");


--
-- Name: Category_slug_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Category_slug_idx" ON public."Category" USING btree (slug);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Category_sortOrder_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Category_sortOrder_idx" ON public."Category" USING btree ("sortOrder");


--
-- Name: DeliveryAssignment_deliveryPartnerId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DeliveryAssignment_deliveryPartnerId_idx" ON public."DeliveryAssignment" USING btree ("deliveryPartnerId");


--
-- Name: DeliveryAssignment_orderId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "DeliveryAssignment_orderId_key" ON public."DeliveryAssignment" USING btree ("orderId");


--
-- Name: DeliveryAssignment_status_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DeliveryAssignment_status_idx" ON public."DeliveryAssignment" USING btree (status);


--
-- Name: DeliveryPartner_isAvailable_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DeliveryPartner_isAvailable_idx" ON public."DeliveryPartner" USING btree ("isAvailable");


--
-- Name: DeliveryPartner_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DeliveryPartner_userId_idx" ON public."DeliveryPartner" USING btree ("userId");


--
-- Name: DeliveryPartner_userId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "DeliveryPartner_userId_key" ON public."DeliveryPartner" USING btree ("userId");


--
-- Name: DeliveryStatusHistory_assignmentId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DeliveryStatusHistory_assignmentId_idx" ON public."DeliveryStatusHistory" USING btree ("assignmentId");


--
-- Name: DriverLocationHistory_createdAt_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DriverLocationHistory_createdAt_idx" ON public."DriverLocationHistory" USING btree ("createdAt");


--
-- Name: DriverLocationHistory_driverId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DriverLocationHistory_driverId_idx" ON public."DriverLocationHistory" USING btree ("driverId");


--
-- Name: DriverLocationHistory_orderId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DriverLocationHistory_orderId_idx" ON public."DriverLocationHistory" USING btree ("orderId");


--
-- Name: DriverLocation_driverId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "DriverLocation_driverId_idx" ON public."DriverLocation" USING btree ("driverId");


--
-- Name: DriverLocation_driverId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "DriverLocation_driverId_key" ON public."DriverLocation" USING btree ("driverId");


--
-- Name: InventoryMovement_inventoryId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "InventoryMovement_inventoryId_idx" ON public."InventoryMovement" USING btree ("inventoryId");


--
-- Name: InventoryMovement_type_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "InventoryMovement_type_idx" ON public."InventoryMovement" USING btree (type);


--
-- Name: Inventory_productId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Inventory_productId_idx" ON public."Inventory" USING btree ("productId");


--
-- Name: Inventory_productId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Inventory_productId_key" ON public."Inventory" USING btree ("productId");


--
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: OrderStatusHistory_orderId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "OrderStatusHistory_orderId_idx" ON public."OrderStatusHistory" USING btree ("orderId");


--
-- Name: OrderStatusHistory_status_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "OrderStatusHistory_status_idx" ON public."OrderStatusHistory" USING btree (status);


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_customerId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Order_customerId_idx" ON public."Order" USING btree ("customerId");


--
-- Name: Order_orderNumber_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Order_orderNumber_idx" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_storeId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Order_storeId_idx" ON public."Order" USING btree ("storeId");


--
-- Name: PasswordResetToken_email_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "PasswordResetToken_email_idx" ON public."PasswordResetToken" USING btree (email);


--
-- Name: PasswordResetToken_tokenHash_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON public."PasswordResetToken" USING btree ("tokenHash");


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_orderId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Payment_orderId_key" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: ProductImage_productId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "ProductImage_productId_idx" ON public."ProductImage" USING btree ("productId");


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_isActive_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Product_isActive_idx" ON public."Product" USING btree ("isActive");


--
-- Name: Product_slug_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Product_slug_idx" ON public."Product" USING btree (slug);


--
-- Name: Product_storeId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Product_storeId_idx" ON public."Product" USING btree ("storeId");


--
-- Name: Product_storeId_slug_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Product_storeId_slug_key" ON public."Product" USING btree ("storeId", slug);


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: StoreStaff_storeId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "StoreStaff_storeId_idx" ON public."StoreStaff" USING btree ("storeId");


--
-- Name: StoreStaff_storeId_userId_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "StoreStaff_storeId_userId_key" ON public."StoreStaff" USING btree ("storeId", "userId");


--
-- Name: StoreStaff_userId_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "StoreStaff_userId_idx" ON public."StoreStaff" USING btree ("userId");


--
-- Name: Store_isActive_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Store_isActive_idx" ON public."Store" USING btree ("isActive");


--
-- Name: Store_slug_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "Store_slug_idx" ON public."Store" USING btree (slug);


--
-- Name: Store_slug_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "Store_slug_key" ON public."Store" USING btree (slug);


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: prerna
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: prerna
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: Address Address_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryAssignment DeliveryAssignment_deliveryPartnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryAssignment"
    ADD CONSTRAINT "DeliveryAssignment_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES public."DeliveryPartner"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryAssignment DeliveryAssignment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryAssignment"
    ADD CONSTRAINT "DeliveryAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryPartner DeliveryPartner_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryPartner"
    ADD CONSTRAINT "DeliveryPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryStatusHistory DeliveryStatusHistory_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DeliveryStatusHistory"
    ADD CONSTRAINT "DeliveryStatusHistory_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public."DeliveryAssignment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverLocationHistory DriverLocationHistory_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DriverLocationHistory"
    ADD CONSTRAINT "DriverLocationHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverLocation DriverLocation_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."DriverLocation"
    ADD CONSTRAINT "DriverLocation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."DeliveryPartner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InventoryMovement InventoryMovement_inventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public."Inventory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Inventory Inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderStatusHistory OrderStatusHistory_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderStatusHistory OrderStatusHistory_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public."Address"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StoreStaff StoreStaff_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."StoreStaff"
    ADD CONSTRAINT "StoreStaff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StoreStaff StoreStaff_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prerna
--

ALTER TABLE ONLY public."StoreStaff"
    ADD CONSTRAINT "StoreStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sipACUKzApStmRBqavRoSEicIBTw8UatdtjQSSpkBsXDhCcP9qCESaW8ZDLVSVC

