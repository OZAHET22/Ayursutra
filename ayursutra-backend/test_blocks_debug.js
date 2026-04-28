/**
 * test_blocks_debug.js
 * Debug block creation
 */

const axios = require('axios');
const mongoose = require('mongoose');

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true,
});

async function test() {
    console.log('\n=== DEBUG BLOCK CREATION ===\n');

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra', {
            serverSelectionTimeoutMS: 5000,
        });

        const User = require('./models/User');

        const doctor = await User.findOne({ email: 'doctor@demo.com' });
        if (!doctor) {
            console.log('❌ Doctor not found');
            process.exit(1);
        }

        const doctorToken = require('jsonwebtoken').sign(
            { id: doctor._id },
            process.env.JWT_SECRET || 'ayursutra_jwt_secret_key_2024',
            { expiresIn: '7d' }
        );

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        console.log('Creating block with:');
        const payload = {
            date: dateStr,
            isRecurring: false,
            startHour: 12,
            startMinute: 0,
            endHour: 13,
            endMinute: 0,
            reason: 'Test Block'
        };
        console.log(JSON.stringify(payload, null, 2));

        const res = await API.post('/blocks', payload, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });

        console.log('\nResponse:', res.status);
        console.log(JSON.stringify(res.data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

test().then(() => process.exit(0));
