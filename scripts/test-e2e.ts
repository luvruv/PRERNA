import axios from 'axios';

const API_BASE = 'http://localhost:4001/api/v1';

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 PRERNA STORE V1 - AUTOMATED END-TO-END TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. AUTH & RBAC TESTS
  console.log('--- 1. Testing Authentication & RBAC ---');
  let customerToken = '';
  let customerUser: any = null;
  let shopkeeperToken = '';
  let deliveryToken = '';
  let adminToken = '';


  try {
    const custRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer@prernastore.local',
      password: 'Prerna@123',
    });
    customerToken = custRes.data.data.accessToken;
    customerUser = custRes.data.data.user;
    assert(!!customerToken, 'Customer login succeeds and returns JWT access token');
  } catch (e: any) {
    assert(false, 'Customer login failed', e.message);
  }

  try {
    const skRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'shopkeeper1@prernastore.local',
      password: 'Prerna@123',
    });
    shopkeeperToken = skRes.data.data.accessToken;
    assert(!!shopkeeperToken, 'Shopkeeper login succeeds and returns JWT access token');
  } catch (e: any) {
    assert(false, 'Shopkeeper login failed', e.message);
  }

  try {
    const delRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'delivery1@prernastore.local',
      password: 'Prerna@123',
    });
    deliveryToken = delRes.data.data.accessToken;
    assert(!!deliveryToken, 'Delivery partner login succeeds and returns JWT access token');
  } catch (e: any) {
    assert(false, 'Delivery partner login failed', e.message);
  }

  try {
    const admRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@prernastore.local',
      password: 'Prerna@123',
    });
    adminToken = admRes.data.data.accessToken;
    assert(!!adminToken, 'Admin login succeeds and returns JWT access token');
  } catch (e: any) {
    assert(false, 'Admin login failed', e.message);
  }

  // RBAC Tests: Customer trying to access Admin or Shopkeeper endpoints
  try {
    await axios.get(`${API_BASE}/admin/metrics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(false, 'Customer calling /admin/metrics should be rejected');
  } catch (e: any) {
    assert(e.response?.status === 403, 'RBAC Guard: Customer calling /admin/metrics returns 403 Forbidden');
  }

  try {
    await axios.get(`${API_BASE}/shopkeeper/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(false, 'Customer calling /shopkeeper/dashboard should be rejected');
  } catch (e: any) {
    assert(e.response?.status === 403, 'RBAC Guard: Customer calling /shopkeeper/dashboard returns 403 Forbidden');
  }

  // 2. SEARCH & INVENTORY BOUNDS
  console.log('\n--- 2. Testing Search & Inventory Bounds ---');
  let skProduct: any = null;
  try {
    const searchRes = await axios.get(`${API_BASE}/products?q=milk`);
    const items = searchRes.data.data.items;
    assert(items.length > 0, `Search "?q=milk" returns ${items.length} real PostgreSQL results`);
  } catch (e: any) {
    assert(false, 'Search ?q=milk failed', e.message);
  }

  try {
    // Get a product belonging to shopkeeper 1's store with available stock
    const skProductsRes = await axios.get(`${API_BASE}/shopkeeper/products`, {
      headers: { Authorization: `Bearer ${shopkeeperToken}` },
    });
    skProduct = skProductsRes.data.data.find(
      (p: any) => p.inventory && p.inventory.availableQty >= 5,
    );
    if (!skProduct) {
      skProduct = skProductsRes.data.data[0];
      await axios.patch(
        `${API_BASE}/shopkeeper/inventory/${skProduct.id}/adjust`,
        { quantityDelta: 50, type: 'PURCHASE', reason: 'Replenish for E2E suite' },
        { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
      );
    }
    assert(!!skProduct, `Found shopkeeper 1 product: "${skProduct.name}" (storeId: ${skProduct.storeId})`);

    // Test negative stock prevention on own product
    try {
      await axios.patch(
        `${API_BASE}/shopkeeper/inventory/${skProduct.id}/adjust`,
        { quantityDelta: -999999, type: 'ADJUSTMENT', reason: 'Test illegal deduction' },
        { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
      );
      assert(false, 'Stock deduction below 0 should fail');
    } catch (e: any) {
      assert(
        e.response?.status === 400,
        'Inventory Guard: Stock deduction below 0 is blocked with 400 Bad Request',
      );
    }

    // Shopkeeper Ownership Guard: Shopkeeper 2 attempting to adjust Shopkeeper 1's product stock
    try {
      const sk2Res = await axios.post(`${API_BASE}/auth/login`, {
        email: 'shopkeeper2@prernastore.local',
        password: 'Prerna@123',
      });
      const sk2Token = sk2Res.data.data.accessToken;

      await axios.patch(
        `${API_BASE}/shopkeeper/inventory/${skProduct.id}/adjust`,
        { quantityDelta: 5, type: 'RESTOCK', reason: 'Unauthorized stock attempt' },
        { headers: { Authorization: `Bearer ${sk2Token}` } },
      );
      assert(false, 'Cross-store stock adjustment should be rejected');
    } catch (e: any) {
      assert(
        e.response?.status === 403,
        'Store Ownership Guard: Shopkeeper 2 cannot modify inventory of Store 1 (403 Forbidden)',
      );
    }
  } catch (e: any) {
    assert(false, 'Inventory tests failed', e.message);
  }

  // 3. CART OPERATIONS
  console.log('\n--- 3. Testing Database-Backed Cart ---');
  try {
    // Clear cart first
    await axios.delete(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    // Add 2 units of shopkeeper's product
    const addRes = await axios.post(
      `${API_BASE}/cart/items`,
      { productId: skProduct.id, quantity: 2 },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    assert(addRes.data.data.items.length === 1, 'Added item to database cart');
    assert(addRes.data.data.totalItems === 2, 'Cart totalItems reflects added quantity');
    assert(addRes.data.data.subtotal > 0, 'Cart subtotal calculated correctly server-side');
  } catch (e: any) {
    assert(false, 'Cart operation failed', e.message);
  }

  // 4. CONCURRENCY TEST (Simultaneous checkouts for the last item)
  console.log('\n--- 4. Testing Concurrency (Race Condition on Last Item) ---');
  try {
    // Create a product with exactly 1 unit of stock
    const createProdRes = await axios.post(
      `${API_BASE}/shopkeeper/products`,
      {
        name: `Limited Edition Farm Butter ${Date.now()}`,
        categoryId: skProduct.categoryId,
        price: 350,
        mrp: 400,
        unit: '250 g block',
        initialStock: 1, // EXACTLY 1 IN STOCK!
      },
      { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
    );
    const scarceProduct = createProdRes.data.data;

    // Get 2 customers: customer 0 and customer 1
    const cust1Res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer1@prernastore.local',
      password: 'Prerna@123',
    });
    const cust1Token = cust1Res.data.data.accessToken;

    const cust0AddrRes = await axios.get(`${API_BASE}/users/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const cust0Addr = cust0AddrRes.data.data[0];

    const cust1AddrRes = await axios.get(`${API_BASE}/users/addresses`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const cust1Addr = cust1AddrRes.data.data[0];

    // Clear carts and both add the 1 scarce item
    await axios.delete(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${customerToken}` } });
    await axios.delete(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${cust1Token}` } });

    await axios.post(
      `${API_BASE}/cart/items`,
      { productId: scarceProduct.id, quantity: 1 },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    await axios.post(
      `${API_BASE}/cart/items`,
      { productId: scarceProduct.id, quantity: 1 },
      { headers: { Authorization: `Bearer ${cust1Token}` } },
    );

    // Fire 2 simultaneous checkout requests in parallel
    const [resA, resB] = await Promise.allSettled([
      axios.post(
        `${API_BASE}/orders/checkout`,
        { addressId: cust0Addr.id, paymentMethod: 'COD' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      ),
      axios.post(
        `${API_BASE}/orders/checkout`,
        { addressId: cust1Addr.id, paymentMethod: 'COD' },
        { headers: { Authorization: `Bearer ${cust1Token}` } },
      ),
    ]);

    const aSucceeded = resA.status === 'fulfilled';
    const bSucceeded = resB.status === 'fulfilled';

    assert(
      (aSucceeded && !bSucceeded) || (!aSucceeded && bSucceeded),
      'Concurrency Protection: Exactly one simultaneous checkout succeeded, the other was blocked',
      `Result A: ${resA.status}, Result B: ${resB.status}`,
    );

    // Check inventory never went negative
    const verifyProd = await axios.get(`${API_BASE}/products/${scarceProduct.id}`);
    assert(
      verifyProd.data.data.inventory.availableQty === 0,
      'Final available stock is exactly 0 and never went negative',
    );
  } catch (e: any) {
    assert(false, 'Concurrency test failed', e.message);
  }

  // 5. FULL END-TO-END ORDER LIFECYCLE & STATE MACHINE TRANSITIONS
  console.log('\n--- 5. Testing Full Order Lifecycle & State Machine Transitions ---');
  let placedOrder: any = null;

  try {
    // 5.1 Customer adds item and places order
    const addressesRes = await axios.get(`${API_BASE}/users/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const address = addressesRes.data.data[0];

    await axios.delete(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${customerToken}` } });
    await axios.post(
      `${API_BASE}/cart/items`,
      { productId: skProduct.id, quantity: 1 },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );

    const checkoutRes = await axios.post(
      `${API_BASE}/orders/checkout`,
      { addressId: address.id, paymentMethod: 'COD', specialInstructions: 'Ring doorbell please' },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    placedOrder = checkoutRes.data.data;
    assert(placedOrder.status === 'PENDING', `Step 1: Order created with status PENDING (#${placedOrder.orderNumber})`);
    assert(placedOrder.items.length > 0, 'Order items created with price snapshot');
    assert(!!placedOrder.payment, 'Payment record initialized with COD method');

    // 5.2 Invalid jump test: Shopkeeper attempts to set DELIVERED directly
    try {
      await axios.patch(
        `${API_BASE}/shopkeeper/orders/${placedOrder.id}/status`,
        { status: 'DELIVERED' },
        { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
      );
      assert(false, 'Shopkeeper setting DELIVERED directly should be rejected');
    } catch (e: any) {
      assert(
        e.response?.status === 400,
        'State Machine: Shopkeeper jumping directly from PENDING to DELIVERED is rejected (400 Bad Request)',
      );
    }

    // 5.3 Shopkeeper 1 accepts order -> CONFIRMED
    const confRes = await axios.patch(
      `${API_BASE}/shopkeeper/orders/${placedOrder.id}/status`,
      { status: 'CONFIRMED', notes: 'Store accepted order' },
      { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
    );
    assert(confRes.data.data.status === 'CONFIRMED', 'Step 2: Shopkeeper accepts order -> CONFIRMED');

    // 5.4 Shopkeeper starts preparing -> PREPARING
    const prepRes = await axios.patch(
      `${API_BASE}/shopkeeper/orders/${placedOrder.id}/status`,
      { status: 'PREPARING', notes: 'Items packed in paper bag' },
      { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
    );
    assert(prepRes.data.data.status === 'PREPARING', 'Step 3: Shopkeeper prepares items -> PREPARING');

    // 5.5 Shopkeeper marks ready -> READY_FOR_PICKUP
    const readyRes = await axios.patch(
      `${API_BASE}/shopkeeper/orders/${placedOrder.id}/status`,
      { status: 'READY_FOR_PICKUP', notes: 'Ready on pickup counter' },
      { headers: { Authorization: `Bearer ${shopkeeperToken}` } },
    );
    assert(readyRes.data.data.status === 'READY_FOR_PICKUP', 'Step 4: Shopkeeper marks ready -> READY_FOR_PICKUP');

    // 5.6 Admin assigns delivery partner (delivery1) -> ASSIGNED
    const partnersRes = await axios.get(`${API_BASE}/admin/delivery-partners`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const partner1 = partnersRes.data.data[0];

    const assignRes = await axios.post(
      `${API_BASE}/admin/orders/${placedOrder.id}/assign-delivery`,
      { deliveryPartnerId: partner1.id },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    assert(assignRes.data.data.status === 'ASSIGNED', 'Step 5: Admin assigns delivery partner -> ASSIGNED');

    // Delivery Partner Authorization Guard: Delivery Partner 2 (unassigned) trying to update status
    try {
      const del2Res = await axios.post(`${API_BASE}/auth/login`, {
        email: 'delivery2@prernastore.local',
        password: 'Prerna@123',
      });
      const del2Token = del2Res.data.data.accessToken;

      await axios.patch(
        `${API_BASE}/delivery/orders/${placedOrder.id}/status`,
        { status: 'PICKED_UP', notes: 'Unauthorized rider pickup attempt' },
        { headers: { Authorization: `Bearer ${del2Token}` } },
      );
      assert(false, 'Unassigned delivery partner should not be able to update order');
    } catch (e: any) {
      assert(
        e.response?.status === 403,
        'Delivery Authorization Guard: Unassigned Delivery Partner 2 rejected with 403 Forbidden',
      );
    }

    // 5.7 Delivery partner marks PICKED_UP
    const pickupRes = await axios.patch(
      `${API_BASE}/delivery/orders/${placedOrder.id}/status`,
      { status: 'PICKED_UP', notes: 'Rider picked up bag from counter' },
      { headers: { Authorization: `Bearer ${deliveryToken}` } },
    );
    assert(pickupRes.data.data.status === 'PICKED_UP', 'Step 6: Delivery partner collects parcel -> PICKED_UP');

    // 5.8 Delivery partner marks OUT_FOR_DELIVERY
    const outRes = await axios.patch(
      `${API_BASE}/delivery/orders/${placedOrder.id}/status`,
      { status: 'OUT_FOR_DELIVERY', notes: 'En route to customer address' },
      { headers: { Authorization: `Bearer ${deliveryToken}` } },
    );
    assert(outRes.data.data.status === 'OUT_FOR_DELIVERY', 'Step 7: Delivery partner drives -> OUT_FOR_DELIVERY');

    // 5.9 Delivery partner marks DELIVERED
    const delivRes = await axios.patch(
      `${API_BASE}/delivery/orders/${placedOrder.id}/status`,
      { status: 'DELIVERED', notes: 'Delivered at customer door' },
      { headers: { Authorization: `Bearer ${deliveryToken}` } },
    );
    assert(delivRes.data.data.status === 'DELIVERED', 'Step 8: Delivery partner hands over parcel -> DELIVERED');

    // 5.10 Customer views delivered order
    const custViewRes = await axios.get(`${API_BASE}/orders/${placedOrder.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custViewRes.data.data.status === 'DELIVERED', 'Step 9: Customer sees order status as DELIVERED in live tracking');
    assert(custViewRes.data.data.statusHistory.length >= 8, 'Complete status history timeline logged in database');

    // 5.11 Admin sees order, metrics, and audit records
    const auditRes = await axios.get(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditRes.data.data.items.length > 0, 'Step 10: Admin verifies audit log records created throughout lifecycle');

    // 5.12 Admin Store & Catalog Management
    const adminStoresRes = await axios.get(`${API_BASE}/admin/stores`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStoresRes.data.data.length > 0, 'Step 11: Admin lists all registered merchant stores');

    const adminCatsRes = await axios.get(`${API_BASE}/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminCatsRes.data.data.length > 0, 'Step 12: Admin lists product categories with product counts');
  } catch (e: any) {
    assert(false, 'Order lifecycle test failed', e.response?.data?.error?.message || e.message);
  }

  console.log('\n=============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
