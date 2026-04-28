/**
 * quick_test.js
 * Quick test of key auth endpoints
 * Run with: node quick_test.js
 */

const axios = require('axios');

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true,
});

async function test() {
    console.log('\n=== QUICK AUTH ENDPOINTS TEST ===\n');

    try {
        // Test 1: Check demo email
        console.log('1️⃣  Testing email check endpoint...');
        const checkRes = await API.post('/auth/check-email', { 
            email: 'patient@demo.com' 
        });
        console.log(`   Status: ${checkRes.status} ${checkRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Response:`, checkRes.data);

        // Test 2: Login with demo account
        console.log('\n2️⃣  Testing login with demo credentials...');
        const loginRes = await API.post('/auth/login', {
            email: 'patient@demo.com',
            password: 'demo123'
        });
        console.log(`   Status: ${loginRes.status} ${loginRes.status === 200 ? '✅' : '❌'}`);
        if (loginRes.data.user) {
            console.log(`   User: ${loginRes.data.user.name}`);
            console.log(`   Token: ${loginRes.data.token.substring(0, 30)}...`);
        } else {
            console.log(`   Error: ${loginRes.data.message}`);
        }

        // Test 3: Get user profile with token
        if (loginRes.data.token) {
            console.log('\n3️⃣  Testing /auth/me endpoint with token...');
            const meRes = await API.get('/auth/me', {
                headers: { Authorization: `Bearer ${loginRes.data.token}` }
            });
            console.log(`   Status: ${meRes.status} ${meRes.status === 200 ? '✅' : '❌'}`);
            if (meRes.data.user) {
                console.log(`   User retrieved: ${meRes.data.user.name} (${meRes.data.user.email})`);
            } else {
                console.log(`   Error: ${meRes.data.message}`);
            }
        }

        // Test 4: Send OTP for login
        console.log('\n4️⃣  Testing OTP send endpoint...');
        const sendOTPRes = await API.post('/otp/send', {
            target: 'patient@demo.com',
            targetType: 'email',
            purpose: 'login'
        });
        console.log(`   Status: ${sendOTPRes.status} ${sendOTPRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Message: ${sendOTPRes.data.message}`);

        // Test 5: Health check
        console.log('\n5️⃣  Testing health endpoint...');
        const healthRes = await API.get('/health');
        console.log(`   Status: ${healthRes.status} ${healthRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Message: ${healthRes.data.message}`);

        console.log('\n=== ✅ ALL ENDPOINT TESTS COMPLETED ===\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

test().then(() => process.exit(0));
