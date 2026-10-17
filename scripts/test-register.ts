import axios from 'axios';

async function testRegister() {
  try {
    const res = await axios.post('http://localhost:4001/api/v1/auth/register', {
      name: 'Test Customer',
      email: 'testuser' + Date.now() + '@example.com',
      phone: '+91 99999 11111',
      password: 'TestPassword123',
    });
    console.log('✅ Registration SUCCESS! Status:', res.status, res.data);
  } catch (e: any) {
    console.error('❌ Registration FAILED! Status:', e.response?.status, e.response?.data || e.message);
  }
}

testRegister();
