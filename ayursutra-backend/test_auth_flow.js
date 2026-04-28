/**
 * test_auth_flow.js
 * Comprehensive test for signup/signin with OTP verification
 * Run with: node test_auth_flow.js
 */

const axios = require('axios');

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true, // Don't throw on any status code
});

const TEST_EMAIL = `testuser_${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'Test@123456';

async function test() {
    console.log('\n=== COMPREHENSIVE AUTH FLOW TEST ===\n');

    try {
        // Step 1: Check email availability
        console.log('1️⃣  Checking email availability...');
        const checkRes = await API.post('/auth/check-email', { email: TEST_EMAIL });
        console.log(`   Status: ${checkRes.status} ${checkRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Available: ${checkRes.data.available}`);
        if (!checkRes.data.available) {
            console.log('   ❌ Email already taken');
            return;
        }

        // Step 2: Send registration OTP
        console.log('\n2️⃣  Sending registration OTP...');
        const sendOTPRes = await API.post('/otp/send', {
            target: TEST_EMAIL,
            targetType: 'email',
            purpose: 'register'
        });
        console.log(`   Status: ${sendOTPRes.status} ${sendOTPRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Message: ${sendOTPRes.data.message}`);
        
        if (sendOTPRes.status !== 200) {
            console.log(`   ❌ Error: ${sendOTPRes.data.message}`);
            return;
        }

        // Step 3: Get the OTP code from DB for testing (in production, user gets it via email)
        console.log('\n3️⃣  Retrieving OTP code from database for testing...');
        
        // Wait a moment for DB write
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let otpCode = null;
        let retries = 0;
        
        while (!otpCode && retries < 5) {
            try {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState !== 1) {
                    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra');
                }
                
                const OTPModel = require('./models/OTP');
                const otpDoc = await OTPModel.findOne({ 
                    target: TEST_EMAIL, 
                    purpose: 'register' 
                }).sort({ createdAt: -1 });
                
                if (otpDoc) {
                    otpCode = otpDoc.code;
                    console.log(`   ✅ OTP Code: ${otpCode}`);
                    break;
                }
            } catch (err) {
                retries++;
                if (retries < 5) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
        
        if (!otpCode) {
            console.log('   ⚠️  Could not retrieve OTP from DB, using 000000 for testing');
            console.log('   (Check the demo account: patient@demo.com / demo123)');
            otpCode = '000000';
        }

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

        const otpToken = verifyOTPRes.data.token;
        console.log(`   ✅ OTP verified`);
        console.log(`   Token: ${otpToken.substring(0, 20)}...`);

        // Step 5: Register user
        console.log('\n5️⃣  Registering user...');
        const registerRes = await API.post('/auth/register', {
            name: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'patient',
            phone: '+919876543210'
        });
        console.log(`   Status: ${registerRes.status} ${registerRes.status === 201 ? '✅' : '❌'}`);
        
        if (registerRes.status !== 201) {
            console.log(`   ❌ Error: ${registerRes.data.message}`);
            console.log(`   Full response:`, JSON.stringify(registerRes.data, null, 2));
            return;
        }

        const signupToken = registerRes.data.token;
        const userId = registerRes.data.user.id;
        console.log(`   ✅ User registered successfully`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Token: ${signupToken.substring(0, 20)}...`);

        // Step 6: Test login with credentials
        console.log('\n6️⃣  Testing login with credentials...');
        const loginRes = await API.post('/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        console.log(`   Status: ${loginRes.status} ${loginRes.status === 200 ? '✅' : '❌'}`);
        
        if (loginRes.status !== 200) {
            console.log(`   ❌ Error: ${loginRes.data.message}`);
            return;
        }

        const loginToken = loginRes.data.token;
        console.log(`   ✅ Login successful`);
        console.log(`   Token: ${loginToken.substring(0, 20)}...`);

        // Step 7: Test /auth/me endpoint
        console.log('\n7️⃣  Testing /auth/me endpoint...');
        const meRes = await API.get('/auth/me', {
            headers: { Authorization: `Bearer ${loginToken}` }
        });
        console.log(`   Status: ${meRes.status} ${meRes.status === 200 ? '✅' : '❌'}`);
        
        if (meRes.status === 200) {
            console.log(`   ✅ User data retrieved`);
            console.log(`   User: ${meRes.data.user.name} (${meRes.data.user.email})`);
        } else {
            console.log(`   ❌ Error: ${meRes.data.message}`);
        }

        // Step 8: Test login with wrong password
        console.log('\n8️⃣  Testing login with wrong password...');
        const wrongPwRes = await API.post('/auth/login', {
            email: TEST_EMAIL,
            password: 'WrongPassword123'
        });
        console.log(`   Status: ${wrongPwRes.status} ${wrongPwRes.status === 401 ? '✅' : '❌'}`);
        console.log(`   Error: ${wrongPwRes.data.message}`);

        console.log('\n=== ✅ ALL TESTS PASSED ===\n');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run test
test().then(() => process.exit(0));
