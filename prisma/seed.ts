import { PrismaClient, Role, OrderStatus, PaymentMethod, PaymentStatus, DeliveryStatus, InventoryMovementType } from '@prisma/client';
import * as crypto from 'crypto';
import { SEED_CATEGORIES, SEED_PRODUCTS_208 } from './catalog-data';

const prisma = new PrismaClient();

let hashPassword = (password: string) => {
  try {
    const bcrypt = require('bcryptjs');
    return bcrypt.hashSync(password, 10);
  } catch (e) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `$pbkdf2$${salt}$${hash}`;
  }
};

async function main() {
  console.log('🌱 Starting Prerna Store seed...');

  try {
    const bcrypt = require('bcryptjs');
    hashPassword = (pw: string) => bcrypt.hashSync(pw, 10);
  } catch {}

  const defaultPasswordHash = hashPassword('Prerna@123');
  const panelPasswordHash = hashPassword('2026@prerna');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.deliveryAssignment.deleteMany();
  await prisma.deliveryPartner.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeStaff.deleteMany();
  await prisma.store.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 2. Create Administrators
  const admin = await prisma.user.create({
    data: {
      email: 'admin@prernastore.local',
      passwordHash: defaultPasswordHash,
      name: 'System Administrator',
      phone: '+91 98765 00000',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // University Panel Admin Account
  const panelAdmin = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      passwordHash: panelPasswordHash,
      name: 'Prerna Panel Admin',
      phone: '+91 98765 99999',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 3. Create Shopkeepers
  const shopkeepersData = [
    { email: 'shopkeeper1@prernastore.local', name: 'Rakesh Sharma', phone: '+91 98765 11111' },
    { email: 'shopkeeper2@prernastore.local', name: 'Sunita Patel', phone: '+91 98765 22222' },
    { email: 'shopkeeper3@prernastore.local', name: 'Vikram Verma', phone: '+91 98765 33333' },
  ];

  const shopkeepers = [];
  for (const sk of shopkeepersData) {
    const u = await prisma.user.create({
      data: {
        email: sk.email,
        passwordHash: defaultPasswordHash,
        name: sk.name,
        phone: sk.phone,
        role: Role.SHOPKEEPER,
        isActive: true,
      },
    });
    shopkeepers.push(u);
  }

  // University Panel Merchant Account
  const panelMerchant = await prisma.user.create({
    data: {
      email: 'merchant@gmail.com',
      passwordHash: panelPasswordHash,
      name: 'Prerna Panel Merchant',
      phone: '+91 98765 88888',
      role: Role.SHOPKEEPER,
      isActive: true,
    },
  });

  // 4. Create Delivery Partners
  const deliveryData = [
    { email: 'delivery1@prernastore.local', name: 'Amit Kumar', phone: '+91 91234 00001', vehicle: 'Hero Splendor (DL 04 AB 1234)' },
    { email: 'delivery2@prernastore.local', name: 'Rahul Yadav', phone: '+91 91234 00002', vehicle: 'Honda Activa (DL 05 CD 5678)' },
    { email: 'delivery3@prernastore.local', name: 'Deepak Singh', phone: '+91 91234 00003', vehicle: 'Bajaj Pulsar (DL 08 EF 9012)' },
    { email: 'delivery4@prernastore.local', name: 'Manoj Joshi', phone: '+91 91234 00004', vehicle: 'TVS Jupiter (DL 03 GH 3456)' },
    { email: 'delivery5@prernastore.local', name: 'Sanjay Mehra', phone: '+91 91234 00005', vehicle: 'Ather 450X (DL 09 IJ 7890)' },
  ];

  const deliveryPartners = [];
  for (const dp of deliveryData) {
    const u = await prisma.user.create({
      data: {
        email: dp.email,
        passwordHash: defaultPasswordHash,
        name: dp.name,
        phone: dp.phone,
        role: Role.DELIVERY_PARTNER,
        isActive: true,
        deliveryPartner: {
          create: {
            vehicleType: 'Two Wheeler',
            vehicleNumber: dp.vehicle,
            isAvailable: true,
          },
        },
      },
      include: { deliveryPartner: true },
    });
    deliveryPartners.push(u);
  }

  // University Panel Delivery Partner Account
  const panelDelivery = await prisma.user.create({
    data: {
      email: 'deliverypartner@gmail.com',
      passwordHash: panelPasswordHash,
      name: 'Prerna Panel Delivery Partner',
      phone: '+91 91234 99999',
      role: Role.DELIVERY_PARTNER,
      isActive: true,
      deliveryPartner: {
        create: {
          vehicleType: 'EV Scooter',
          vehicleNumber: 'DL 01 EX 2026',
          isAvailable: true,
        },
      },
    },
    include: { deliveryPartner: true },
  });

  // 5. Create Customers
  const customersData = [
    { email: 'customer@prernastore.local', name: 'Priya Sharma', phone: '+91 99887 76655', address: 'Flat 402, Sunshine Heights, Sector 14, Gurgaon' },
    { email: 'customer1@prernastore.local', name: 'Arjun Mehta', phone: '+91 99887 11111', address: 'B-12, Green Park Main, New Delhi' },
    { email: 'customer2@prernastore.local', name: 'Neha Gupta', phone: '+91 99887 22222', address: 'Plot 45, DLF Phase 2, Gurgaon' },
    { email: 'customer3@prernastore.local', name: 'Rohan Sen', phone: '+91 99887 33333', address: 'Flat 101, Palm Grove, Noida Sector 62' },
    { email: 'customer4@prernastore.local', name: 'Ananya Roy', phone: '+91 99887 44444', address: 'C-7, Indirapuram, Ghaziabad' },
  ];

  const customers = [];
  for (const c of customersData) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: defaultPasswordHash,
        name: c.name,
        phone: c.phone,
        role: Role.CUSTOMER,
        isActive: true,
        addresses: {
          create: {
            label: 'Home',
            street: c.address,
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122001',
            isDefault: true,
          },
        },
        cart: {
          create: {},
        },
      },
      include: { addresses: true, cart: true },
    });
    customers.push(u);
  }

  // University Panel Customer Account
  const panelCustomer = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      passwordHash: panelPasswordHash,
      name: 'Prerna Panel Customer',
      phone: '+91 99887 00000',
      role: Role.CUSTOMER,
      isActive: true,
      addresses: {
        create: [
          {
            label: 'Home',
            street: 'Flat 502, DLF Cyber City Towers, Sector 25',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122002',
            isDefault: true,
          },
          {
            label: 'Office',
            street: 'Unit 401, Tech Horizon Park, Golf Course Road',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122003',
            isDefault: false,
          },
        ],
      },
      cart: {
        create: {},
      },
    },
    include: { addresses: true, cart: true },
  });
  customers.push(panelCustomer);

  // 6. Create Stores
  const storesData = [
    {
      name: 'Sunrise Fresh Market',
      slug: 'sunrise-fresh-market',
      description: 'Handpicked fresh farm fruits, leafy organic greens and everyday dairy essentials.',
      address: 'Shop 14-16, Galleria Market, DLF Phase 4',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122009',
      phone: '+91 124 4567890',
      email: 'sunrise@prernastore.local',
      bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      ownerId: shopkeepers[0].id,
      extraStaffId: panelMerchant.id, // Panel merchant co-owns/manages Store 0
    },
    {
      name: 'Green Valley Organics',
      slug: 'green-valley-organics',
      description: 'Certified organic vegetables, cold-pressed oils, artisanal breads, and chemical-free pantry items.',
      address: 'SCO 28, Sector 29 Market',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002',
      phone: '+91 124 9876543',
      email: 'greenvalley@prernastore.local',
      bannerUrl: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=200&q=80',
      rating: 4.8,
      ownerId: shopkeepers[1].id,
    },
    {
      name: 'City Daily Mart',
      slug: 'city-daily-mart',
      description: 'Quick everyday groceries, packaged staples, chilled drinks, and snacks at wholesale prices.',
      address: 'Ground Floor, Central Plaza, Golf Course Road',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122003',
      phone: '+91 124 2345678',
      email: 'citydaily@prernastore.local',
      bannerUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=200&q=80',
      rating: 4.7,
      ownerId: shopkeepers[2].id,
    },
  ];

  const stores = [];
  for (const s of storesData) {
    const store = await prisma.store.create({
      data: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        address: s.address,
        city: s.city,
        state: s.state,
        postalCode: s.postalCode,
        phone: s.phone,
        email: s.email,
        bannerUrl: s.bannerUrl,
        logoUrl: s.logoUrl,
        rating: s.rating,
        staff: {
          create: [
            {
              userId: s.ownerId,
              role: 'STORE_OWNER',
            },
            ...(s.extraStaffId
              ? [
                  {
                    userId: s.extraStaffId,
                    role: 'STORE_OWNER',
                  },
                ]
              : []),
          ],
        },
      },
    });
    stores.push(store);
  }

  // 7. Create 14 Categories from catalog-data.ts
  const categoryMap = new Map<string, any>();
  for (const c of SEED_CATEGORIES) {
    const createdCat = await prisma.category.create({
      data: c,
    });
    categoryMap.set(c.slug, createdCat);
  }
  console.log(`📂 Seeded ${SEED_CATEGORIES.length} Categories.`);

  // 8. Create 208 Realistic Products from catalog-data.ts with Inventory
  const createdProducts = [];
  for (const p of SEED_PRODUCTS_208) {
    const store = stores[p.storeIndex % stores.length];
    const category = categoryMap.get(p.catSlug) || categoryMap.get('fresh-fruits');

    const prod = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: category.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        unit: p.unit,
        sku: p.sku,
        isActive: true,
        images: {
          create: [
            {
              url: p.image,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
        inventory: {
          create: {
            availableQty: p.stock,
            reservedQty: 0,
            lowStockThreshold: 10,
            movements: {
              create: {
                quantity: p.stock,
                type: InventoryMovementType.RESTOCK,
                reason: 'Initial opening stock batch',
              },
            },
          },
        },
      },
      include: { inventory: true },
    });
    createdProducts.push(prod);
  }

  console.log(`📦 Seeded ${createdProducts.length} products with inventory.`);

  // 9. Create Realistic Orders across various lifecycle statuses
  // Order 1: DELIVERED (Sunrise store, Customer 0)
  const o1Date = new Date(Date.now() - 3 * 3600 * 1000);
  await prisma.order.create({
    data: {
      orderNumber: 'PRN-20261013-0001',
      customerId: customers[0].id,
      storeId: stores[0].id,
      addressId: customers[0].addresses[0].id,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.COMPLETED,
      subtotal: 326.0,
      deliveryFee: 25.0,
      tax: 16.3,
      discount: 0.0,
      total: 367.3,
      createdAt: o1Date,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productName: createdProducts[0].name,
            unitPrice: createdProducts[0].price,
            quantity: 1,
            subtotal: createdProducts[0].price,
          },
          {
            productId: createdProducts[1].id,
            productName: createdProducts[1].name,
            unitPrice: createdProducts[1].price,
            quantity: 2,
            subtotal: createdProducts[1].price * 2,
          },
          {
            productId: createdProducts[10].id,
            productName: createdProducts[10].name,
            unitPrice: createdProducts[10].price,
            quantity: 1,
            subtotal: createdProducts[10].price,
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.COD,
          status: PaymentStatus.COMPLETED,
          amount: 367.3,
          transactionRef: 'COD-CASH-RECVD',
        },
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, notes: 'Order placed by customer', createdAt: o1Date },
          { status: OrderStatus.CONFIRMED, notes: 'Store accepted order', changedById: shopkeepers[0].id, createdAt: new Date(o1Date.getTime() + 2 * 60000) },
          { status: OrderStatus.PREPARING, notes: 'Items packed into bag', changedById: shopkeepers[0].id, createdAt: new Date(o1Date.getTime() + 6 * 60000) },
          { status: OrderStatus.READY_FOR_PICKUP, notes: 'Order ready for rider pickup', changedById: shopkeepers[0].id, createdAt: new Date(o1Date.getTime() + 10 * 60000) },
          { status: OrderStatus.ASSIGNED, notes: 'Assigned to Amit Kumar', changedById: admin.id, createdAt: new Date(o1Date.getTime() + 11 * 60000) },
          { status: OrderStatus.PICKED_UP, notes: 'Rider picked up parcel', changedById: deliveryPartners[0].id, createdAt: new Date(o1Date.getTime() + 15 * 60000) },
          { status: OrderStatus.OUT_FOR_DELIVERY, notes: 'Rider on the way to customer doorstep', changedById: deliveryPartners[0].id, createdAt: new Date(o1Date.getTime() + 18 * 60000) },
          { status: OrderStatus.DELIVERED, notes: 'Delivered at doorstep and payment collected', changedById: deliveryPartners[0].id, createdAt: new Date(o1Date.getTime() + 28 * 60000) },
        ],
      },
      deliveryAssignment: {
        create: {
          deliveryPartnerId: deliveryPartners[0].deliveryPartner!.id,
          status: DeliveryStatus.DELIVERED,
          assignedAt: new Date(o1Date.getTime() + 11 * 60000),
          pickedUpAt: new Date(o1Date.getTime() + 15 * 60000),
          deliveredAt: new Date(o1Date.getTime() + 28 * 60000),
          history: {
            create: [
              { status: DeliveryStatus.ASSIGNED, notes: 'Order assigned' },
              { status: DeliveryStatus.PICKED_UP, notes: 'Picked up from store' },
              { status: DeliveryStatus.OUT_FOR_DELIVERY, notes: 'Out for delivery' },
              { status: DeliveryStatus.DELIVERED, notes: 'Successfully handed over' },
            ],
          },
        },
      },
    },
  });

  // Order 2: PENDING (Sunrise store, Customer 1)
  const o2Date = new Date(Date.now() - 15 * 60000);
  await prisma.order.create({
    data: {
      orderNumber: 'PRN-20261013-0002',
      customerId: customers[1].id,
      storeId: stores[0].id,
      addressId: customers[1].addresses[0].id,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.TEST_PAYMENT,
      paymentStatus: PaymentStatus.COMPLETED,
      subtotal: 550.0,
      deliveryFee: 25.0,
      tax: 27.5,
      discount: 0.0,
      total: 602.5,
      createdAt: o2Date,
      items: {
        create: [
          {
            productId: createdProducts[11].id,
            productName: createdProducts[11].name,
            unitPrice: createdProducts[11].price,
            quantity: 2,
            subtotal: createdProducts[11].price * 2,
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.TEST_PAYMENT,
          status: PaymentStatus.COMPLETED,
          amount: 602.5,
          transactionRef: 'TEST_PAY_TXN_998273',
        },
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, notes: 'Order placed via Test Online Payment', createdAt: o2Date },
        ],
      },
    },
  });

  // Order 3: READY_FOR_PICKUP (Sunrise store, Panel Customer)
  const o3Date = new Date(Date.now() - 25 * 60000);
  await prisma.order.create({
    data: {
      orderNumber: 'PRN-20261013-0003',
      customerId: panelCustomer.id,
      storeId: stores[0].id,
      addressId: panelCustomer.addresses[0].id,
      status: OrderStatus.READY_FOR_PICKUP,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: 290.0,
      deliveryFee: 25.0,
      tax: 14.5,
      discount: 0.0,
      total: 329.5,
      createdAt: o3Date,
      items: {
        create: [
          {
            productId: createdProducts[12].id,
            productName: createdProducts[12].name,
            unitPrice: createdProducts[12].price,
            quantity: 1,
            subtotal: createdProducts[12].price,
          },
          {
            productId: createdProducts[13].id,
            productName: createdProducts[13].name,
            unitPrice: createdProducts[13].price,
            quantity: 2,
            subtotal: createdProducts[13].price * 2,
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.COD,
          status: PaymentStatus.PENDING,
          amount: 329.5,
        },
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, notes: 'Order placed by customer', createdAt: o3Date },
          { status: OrderStatus.CONFIRMED, notes: 'Accepted by merchant', changedById: panelMerchant.id, createdAt: new Date(o3Date.getTime() + 2 * 60000) },
          { status: OrderStatus.PREPARING, notes: 'Packing items in carry bag', changedById: panelMerchant.id, createdAt: new Date(o3Date.getTime() + 6 * 60000) },
          { status: OrderStatus.READY_FOR_PICKUP, notes: 'Awaiting delivery partner assignment', changedById: panelMerchant.id, createdAt: new Date(o3Date.getTime() + 10 * 60000) },
        ],
      },
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n======================================================');
  console.log('🎓 UNIVERSITY EXAMINATION PANEL ACCOUNTS (2026@prerna):');
  console.log('1. Admin:            admin@gmail.com           / 2026@prerna');
  console.log('2. Customer:         customer@gmail.com        / 2026@prerna');
  console.log('3. Merchant:         merchant@gmail.com        / 2026@prerna (Sunrise Fresh Market)');
  console.log('4. Delivery Partner: deliverypartner@gmail.com / 2026@prerna (DL 01 EX 2026)');
  console.log('------------------------------------------------------');
  console.log('🔑 BACKWARD-COMPATIBLE TEST ACCOUNTS (Prerna@123):');
  console.log('1. Admin:            admin@prernastore.local');
  console.log('2. Shopkeeper:       shopkeeper1@prernastore.local');
  console.log('3. Delivery:         delivery1@prernastore.local');
  console.log('4. Customer:         customer@prernastore.local');
  console.log(`📦 Total Products:   ${createdProducts.length} across 14 categories`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
