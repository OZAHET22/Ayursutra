/**
 * test_signup.js
 * Test new user signup with OTP verification
 * Run with: node test_signup.js
 */

const axios = require('axios');
const mongoose = require('mongoose');

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true,
});

const TEST_EMAIL = `newuser_${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'TestPass@123';

async function test() {
    console.log('\n=== NEW USER SIGNUP TEST WITH OTP ===\n');

    try {
        // Connect to MongoDB to retrieve OTP codes
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra', {
            serverSelectionTimeoutMS: 5000,
        });
        const OTPModel = require('./models/OTP');
        console.log('✅ Connected\n');

        // Step 1: Check email availability
        console.log('1️⃣  Checking email availability...');
        const checkRes = await API.post('/auth/check-email', { email: TEST_EMAIL });
        console.log(`   Status: ${checkRes.status} ${checkRes.status === 200 ? '✅' : '❌'}`);
        if (!checkRes.data.available) {
            console.log(`   ❌ Email already taken`);
            return;
        }
        console.log(`   Email available: ${TEST_EMAIL}`);

        // Step 2: Send registration OTP
        console.log('\n2️⃣  Sending registration OTP...');
        const sendOTPRes = await API.post('/otp/send', {
            target: TEST_EMAIL,
            targetType: 'email',
            purpose: 'register'
        });
        console.log(`   Status: ${sendOTPRes.status} ${sendOTPRes.status === 200 ? '✅' : '❌'}`);
        if (sendOTPRes.status !== 200) {
            console.log(`   ❌ Error: ${sendOTPRes.data.message}`);
            return;
        }
        console.log(`   Message: ${sendOTPRes.data.message}`);

        // Step 3: Retrieve OTP from database
        console.log('\n3️⃣  Retrieving OTP code from database...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const otpDoc = await OTPModel.findOne({
            target: TEST_EMAIL,
            purpose: 'register'
        }).sort({ createdAt: -1 });

        if (!otpDoc) {
            console.log('   ❌ No OTP found in database');
            return;
        }

        const otpCode = otpDoc.code;
        console.log(`   ✅ OTP Code: ${otpCode}`);

        // Step 4: Verify OTP
        console.log('\n4️⃣  Verifying OTP...');
        const verifyOTPRes = await API.post('/otp/verify', {
            target: TEST_EMAIL,
            targetType: 'email',
            code: otpCode,
            purpose: 'register'
        });
        console.log(`   Status: ${verifyOTPRes.status} ${verifyOTPRes.status === 200 ? '✅' : '❌'}`);
        
        if (verifyOTPRes.status !== 200) {
            console.log(`   ❌ Error: ${verifyOTPRes.data.message}`);
            return;
        }

        console.log(`   ✅ OTP verified`);
        console.log(`   Token: ${verifyOTPRes.data.token.substring(0, 30)}...`);

        // Step 5: Register new user
        console.log('\n5️⃣  Registering new user...');
        const uniquePhone = `+919${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
        const registerRes = await API.post('/auth/register', {
            name: 'New Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'patient',
            phone: uniquePhone
        });
        console.log(`   Status: ${registerRes.status} ${registerRes.status === 201 ? '✅' : '❌'}`);
        
        if (registerRes.status !== 201) {
            console.log(`   ❌ Error: ${registerRes.data.message}`);
            console.log(`   Full response:`, JSON.stringify(registerRes.data, null, 2));
            return;
        }

        console.log(`   ✅ User registered successfully`);
        console.log(`   User ID: ${registerRes.data.user.id}`);
        console.log(`   User Name: ${registerRes.data.user.name}`);
        console.log(`   User Email: ${registerRes.data.user.email}`);
        console.log(`   Token: ${registerRes.data.token.substring(0, 30)}...`);

        // Step 6: Login with new credentials
        console.log('\n6️⃣  Testing login with new user...');
        const loginRes = await API.post('/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        console.log(`   Status: ${loginRes.status} ${loginRes.status === 200 ? '✅' : '❌'}`);
        
        if (loginRes.status !== 200) {
            console.log(`   ❌ Error: ${loginRes.data.message}`);
            return;
        }

        console.log(`   ✅ Login successful`);
        console.log(`   User: ${loginRes.data.user.name}`);
        if (loginRes.data.token) {
            console.log(`   Token: ${loginRes.data.token.substring(0, 30)}...`);
        }

        // Step 7: Get user profile
        console.log('\n7️⃣  Getting user profile...');
        const meRes = await API.get('/auth/me', {
            headers: { Authorization: `Bearer ${loginRes.data.token}` }
        });
        console.log(`   Status: ${meRes.status} ${meRes.status === 200 ? '✅' : '❌'}`);
        
        if (meRes.status === 200) {
            console.log(`   ✅ Profile retrieved`);
            console.log(`   User: ${meRes.data.user.name} (${meRes.data.user.email})`);
        }

        console.log('\n=== ✅ SIGNUP FLOW TEST PASSED ===\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    } finally {
        await mongoose.connection.close();
    }
}

test().then(() => process.exit(0));
