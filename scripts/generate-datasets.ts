import * as fs from 'fs';
import * as path from 'path';
import { SEED_CATEGORIES, SEED_PRODUCTS_208 } from '../prisma/catalog-data';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Stores Dataset
const STORES = [
  {
    id: 'store-1',
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
    latitude: 28.4595,
    longitude: 77.0266,
    deliveryRadiusKm: 10.0,
    isActive: true,
    ownerName: 'Rakesh Sharma',
    totalProducts: 74,
  },
  {
    id: 'store-2',
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
    latitude: 28.4680,
    longitude: 77.0610,
    deliveryRadiusKm: 8.0,
    isActive: true,
    ownerName: 'Sunita Patel',
    totalProducts: 68,
  },
  {
    id: 'store-3',
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
    latitude: 28.4410,
    longitude: 77.0980,
    deliveryRadiusKm: 12.0,
    isActive: true,
    ownerName: 'Vikram Verma',
    totalProducts: 66,
  },
];

// Map categories by slug for fast lookup
const categoryMap = new Map();
SEED_CATEGORIES.forEach((cat, index) => {
  categoryMap.set(cat.slug, {
    id: `cat-${index + 1}`,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    sortOrder: cat.sortOrder,
  });
});

// 2. Transform 208 products with complete relations, inventory quantity & stock alerts
const PRODUCTS = SEED_PRODUCTS_208.map((p, index) => {
  const store = STORES[p.storeIndex % STORES.length];
  const cat = categoryMap.get(p.catSlug) || {
    id: `cat-1`,
    name: 'General Groceries',
    slug: p.catSlug,
  };

  const id = `prod-${index + 1}`;
  const stock = p.stock || 25;
  const lowThreshold = 10;
  const stockStatus = stock === 0 ? 'OUT_OF_STOCK' : stock <= lowThreshold ? 'LOW_STOCK' : 'IN_STOCK';

  return {
    id,
    storeId: store.id,
    storeName: store.name,
    categoryId: cat.id,
    categoryName: cat.name,
    categorySlug: cat.slug,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    mrp: p.mrp,
    unit: p.unit,
    sku: p.sku,
    availableQty: stock,
    reservedQty: 0,
    lowStockThreshold: lowThreshold,
    stockStatus,
    isActive: true,
    imageUrl: p.image,
    rating: Number((4.5 + (index % 5) * 0.1).toFixed(1)),
    createdAt: new Date(Date.now() - (208 - index) * 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

// 3. Pre-seed realistic orders for student viva demonstration
const ORDERS = [
  {
    id: 'ord-1001',
    orderNumber: 'PRN-20261019-9182',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    customer: {
      userId: 'usr-customer-1',
      name: 'Priya Sharma',
      email: 'customer@prernastore.local',
      phone: '+91 99887 76655',
    },
    store: {
      storeId: 'store-1',
      name: 'Sunrise Fresh Market',
      address: 'Shop 14-16, Galleria Market, DLF Phase 4, Gurugram',
    },
    deliveryAddress: {
      label: 'Home',
      street: 'Flat 402, Sunshine Heights, DLF Phase 4',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122009',
      latitude: 28.4682,
      longitude: 77.0851,
    },
    items: [
      {
        productId: 'prod-1',
        name: 'Shimla Fresh Royal Apples',
        price: 180,
        quantity: 2,
        subtotal: 360,
        unit: '1 kg (approx 4-5 pcs)',
      },
      {
        productId: 'prod-3',
        name: 'Amul Taaza Homogenised Toned Milk',
        price: 54,
        quantity: 3,
        subtotal: 162,
        unit: '1 L pouch',
      },
    ],
    billing: {
      subtotal: 522,
      deliveryFee: 25,
      tax: 26.1,
      totalAmount: 573.1,
    },
    payment: {
      transactionId: 'TXN_PAY_20261019_8821',
      method: 'TEST_PAYMENT',
      status: 'COMPLETED',
      paidAt: new Date(Date.now() - 44 * 60000).toISOString(),
    },
    orderStatus: 'DELIVERED',
    deliveryAssignment: {
      riderName: 'Vikram Singh (Two Wheeler)',
      riderPhone: '+91 98765 43213',
      vehicle: 'Hero Electric Optima - HR 26 EA 8821',
      status: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 32 * 60000).toISOString(),
    },
  },
  {
    id: 'ord-1002',
    orderNumber: 'PRN-20261019-9403',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    customer: {
      userId: 'usr-customer-2',
      name: 'Prerna Panel Customer',
      email: 'customer@gmail.com',
      phone: '+91 99887 00000',
    },
    store: {
      storeId: 'store-1',
      name: 'Sunrise Fresh Market',
      address: 'Shop 14-16, Galleria Market, DLF Phase 4, Gurugram',
    },
    deliveryAddress: {
      label: 'Home',
      street: 'Flat 502, DLF Cyber City Towers, Sector 25',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002',
      latitude: 28.4682,
      longitude: 77.0384,
    },
    items: [
      {
        productId: 'prod-7',
        name: 'Aashirvaad Shudh Chakki Atta (10kg)',
        price: 435,
        quantity: 1,
        subtotal: 435,
        unit: '10 kg bag',
      },
      {
        productId: 'prod-8',
        name: "Lay's India's Magic Masala Chips",
        price: 20,
        quantity: 4,
        subtotal: 80,
        unit: '50 g pouch',
      },
    ],
    billing: {
      subtotal: 515,
      deliveryFee: 25,
      tax: 25.75,
      totalAmount: 565.75,
    },
    payment: {
      transactionId: 'TXN_PAY_20261019_9942',
      method: 'TEST_PAYMENT',
      status: 'COMPLETED',
      paidAt: new Date(Date.now() - 14 * 60000).toISOString(),
    },
    orderStatus: 'OUT_FOR_DELIVERY',
    deliveryAssignment: {
      riderName: 'Ramesh Kumar (Electric Bike)',
      riderPhone: '+91 91234 99999',
      vehicle: 'Ather 450X - DL 01 EX 2026',
      status: 'OUT_FOR_DELIVERY',
      currentLat: 28.4645,
      currentLng: 77.0345,
      estimatedDeliveryMins: 8,
    },
  },
];

// Write files to data/ directory
fs.writeFileSync(path.join(dataDir, 'stores_dataset.json'), JSON.stringify(STORES, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'products_dataset.json'), JSON.stringify(PRODUCTS, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'orders_dataset.json'), JSON.stringify(ORDERS, null, 2), 'utf8');

console.log(`✅ Successfully generated Datasets:`);
console.log(`   - 🏬 Stores: ${STORES.length} stores -> ${path.join(dataDir, 'stores_dataset.json')}`);
console.log(`   - 📦 Products: ${PRODUCTS.length} products with stock quantity -> ${path.join(dataDir, 'products_dataset.json')}`);
console.log(`   - 💳 Orders: ${ORDERS.length} completed transactions -> ${path.join(dataDir, 'orders_dataset.json')}`);
