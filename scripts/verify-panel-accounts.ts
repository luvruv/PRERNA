import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- 1. Testing 4 University Examination Panel accounts ---');
  const accounts = [
    { email: 'admin@gmail.com', role: 'ADMIN' },
    { email: 'customer@gmail.com', role: 'CUSTOMER' },
    { email: 'merchant@gmail.com', role: 'SHOPKEEPER' },
    { email: 'deliverypartner@gmail.com', role: 'DELIVERY_PARTNER' },
  ];

  for (const acc of accounts) {
    try {
      const res = await axios.post('http://localhost:4001/api/v1/auth/login', {
        email: acc.email,
        password: '2026@prerna',
      });
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.accessToken || res.data.accessToken;
      console.log(`✅ [PASS] ${acc.role} (${acc.email}) -> Role: ${user.role}, Name: "${user.name}", Token length: ${token?.length}`);
    } catch (e: any) {
      console.error(`❌ [FAIL] ${acc.email}:`, e.response?.data || e.message);
    }
  }

  console.log('\n--- 2. Database Counts ---');
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const userCount = await prisma.user.count();
  const storeCount = await prisma.store.count();
  const orderCount = await prisma.order.count();

  console.log(`✅ Total Products in DB:   ${productCount}`);
  console.log(`✅ Total Categories in DB: ${categoryCount}`);
  console.log(`✅ Total Users in DB:      ${userCount}`);
  console.log(`✅ Total Stores in DB:     ${storeCount}`);
  console.log(`✅ Total Orders in DB:     ${orderCount}`);

  console.log('\n--- 3. API Products Pagination Check ---');
  try {
    const apiRes = await axios.get('http://localhost:4001/api/v1/products?limit=250');
    const items = apiRes.data.data?.items || apiRes.data.items || [];
    const meta = apiRes.data.data?.meta || apiRes.data.meta || {};
    console.log(`✅ Products returned by API query: ${items.length} items`);
    console.log(`✅ Pagination metadata:`, meta);
  } catch (e: any) {
    console.error('API product query failed:', e.message);
  }

  await prisma.$disconnect();
}

verify();
