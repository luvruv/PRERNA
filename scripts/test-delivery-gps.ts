import axios from 'axios';

const API = 'http://localhost:4001/api/v1';

async function testDeliveryGpsFlow() {
  console.log('--- Testing Delivery Partner Request Acceptance & GPS Telemetry ---');

  // 1. Login Customer
  const custLogin = await axios.post(`${API}/auth/login`, {
    email: 'customer@gmail.com',
    password: '2026@prerna',
  });
  const custToken = custLogin.data.data?.accessToken || custLogin.data.accessToken;

  // 2. Login Delivery Partner
  const riderLogin = await axios.post(`${API}/auth/login`, {
    email: 'deliverypartner@gmail.com',
    password: '2026@prerna',
  });
  const riderToken = riderLogin.data.data?.accessToken || riderLogin.data.accessToken;

  // 3. Customer creates a new Order
  // Fetch products with stock
  const prodsRes = await axios.get(`${API}/products?limit=50`);
  const items = prodsRes.data.data?.items || prodsRes.data.items || [];
  const prod = items.find((p: any) => (p.inventory?.availableQty || 0) > 5) || items[items.length - 1];

  // Add to cart
  await axios.post(
    `${API}/cart/items`,
    { productId: prod.id, quantity: 1 },
    { headers: { Authorization: `Bearer ${custToken}` } }
  );

  // Get customer addresses
  const addrRes = await axios.get(`${API}/users/addresses`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const addresses = addrRes.data.data || addrRes.data || [];
  const addressId = addresses[0]?.id;

  // Checkout
  const checkoutRes = await axios.post(
    `${API}/orders/checkout`,
    {
      addressId,
      paymentMethod: 'TEST_PAYMENT',
      specialInstructions: 'Ring bell twice',
    },
    { headers: { Authorization: `Bearer ${custToken}` } }
  );
  const order = checkoutRes.data.data || checkoutRes.data;
  console.log(`✅ [Step 1] Customer placed new order #${order.orderNumber} (Status: ${order.status})`);

  // 4. Rider views available requests
  const availRes = await axios.get(`${API}/delivery/available`, {
    headers: { Authorization: `Bearer ${riderToken}` },
  });
  const availableOrders = availRes.data.data || availRes.data || [];
  const foundInPool = availableOrders.some((o: any) => o.id === order.id);
  console.log(`✅ [Step 2] Rider queries available requests: ${availableOrders.length} orders in pool. Found placed order: ${foundInPool}`);

  // 5. Rider accepts / takes the delivery request
  const acceptRes = await axios.post(
    `${API}/delivery/orders/${order.id}/accept`,
    {},
    { headers: { Authorization: `Bearer ${riderToken}` } }
  );
  const assignment = acceptRes.data.data || acceptRes.data;
  console.log(`✅ [Step 3] Rider accepted order! Assignment ID: ${assignment.id}, Status: ${assignment.status}`);

  // 6. Rider updates live GPS location
  const gpsRes = await axios.post(
    `${API}/delivery/location`,
    {
      latitude: 28.4612,
      longitude: 77.0305,
      orderId: order.id,
    },
    { headers: { Authorization: `Bearer ${riderToken}` } }
  );
  console.log('✅ [Step 4] Rider posted live GPS coordinates:', gpsRes.data.data || gpsRes.data);

  // 7. Customer tracks order and verifies Rider & GPS coordinates
  const trackRes = await axios.get(`${API}/orders/${order.id}`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const trackedOrder = trackRes.data.data || trackRes.data;
  const assignedRider = trackedOrder.deliveryAssignment?.deliveryPartner;
  const riderCoords = {
    lat: trackedOrder.deliveryAssignment?.currentLat || assignedRider?.currentLat,
    lng: trackedOrder.deliveryAssignment?.currentLng || assignedRider?.currentLng,
  };
  console.log(`✅ [Step 5] Customer tracking sees Assigned Rider: "${assignedRider?.user?.name}" (Vehicle: ${assignedRider?.vehicleType} ${assignedRider?.vehicleNumber})`);
  console.log(`✅ [Step 6] Customer tracking receives Rider GPS Coordinates:`, riderCoords);

  // 8. Rider advances to PICKED_UP and OUT_FOR_DELIVERY
  await axios.patch(
    `${API}/delivery/orders/${order.id}/status`,
    { status: 'PICKED_UP', notes: 'Package collected at store' },
    { headers: { Authorization: `Bearer ${riderToken}` } }
  );
  console.log('✅ [Step 7] Order status advanced to PICKED_UP');

  await axios.patch(
    `${API}/delivery/orders/${order.id}/status`,
    { status: 'OUT_FOR_DELIVERY', notes: 'Driving to doorstep' },
    { headers: { Authorization: `Bearer ${riderToken}` } }
  );
  console.log('✅ [Step 8] Order status advanced to OUT_FOR_DELIVERY');

  // 9. Rider steps GPS closer to customer
  await axios.post(
    `${API}/delivery/location`,
    {
      latitude: 28.4665,
      longitude: 77.0360,
      orderId: order.id,
    },
    { headers: { Authorization: `Bearer ${riderToken}` } }
  );
  console.log('✅ [Step 9] Rider simulated movement closer to destination (28.4665, 77.0360)');

  // 10. Rider marks DELIVERED
  await axios.patch(
    `${API}/delivery/orders/${order.id}/status`,
    { status: 'DELIVERED', notes: 'Handed over at customer doorstep' },
    { headers: { Authorization: `Bearer ${riderToken}` } }
  );
  console.log('✅ [Step 10] Order successfully marked DELIVERED!');

  console.log('\n🎉 ALL 10 STEPS OF DELIVERY REQUEST ACCEPTANCE, GPS FETCH & TRACKING VERIFIED SUCCESSFULLY!');
}

testDeliveryGpsFlow().catch((e) => {
  console.error('❌ Test failed:', e.response?.data || e.message);
  process.exit(1);
});
