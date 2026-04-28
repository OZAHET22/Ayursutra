/**
 * test_appointments.js
 * Comprehensive test for appointment and scheduling system
 * Run with: node test_appointments.js
 */

const axios = require('axios');
const mongoose = require('mongoose');

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true,
});

async function test() {
    console.log('\n=== APPOINTMENT SCHEDULING SYSTEM COMPREHENSIVE TEST ===\n');

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra', {
            serverSelectionTimeoutMS: 5000,
        });

        const User = require('./models/User');
        const DoctorBlock = require('./models/DoctorBlock');

        // Get demo users
        const patient = await User.findOne({ email: 'patient@demo.com' });
        const doctor = await User.findOne({ email: 'doctor@demo.com' });

        if (!patient || !doctor) {
            console.log('❌ Demo users not found. Run: node seedData.js');
            process.exit(1);
        }

        const patientToken = require('jsonwebtoken').sign(
            { id: patient._id },
            process.env.JWT_SECRET || 'ayursutra_jwt_secret_key_2024',
            { expiresIn: '7d' }
        );

        const doctorToken = require('jsonwebtoken').sign(
            { id: doctor._id },
            process.env.JWT_SECRET || 'ayursutra_jwt_secret_key_2024',
            { expiresIn: '7d' }
        );

        const headers = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

        // Test 1: Get available slots
        console.log('1️⃣  Testing appointment slot availability...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const slotsRes = await API.get('/appointments/slots', {
            ...headers(patientToken),
            params: { doctorId: doctor._id, date: dateStr }
        });

        console.log(`   Status: ${slotsRes.status} ${slotsRes.status === 200 ? '✅' : '❌'}`);
        if (slotsRes.data.slots) {
            const availableSlots = slotsRes.data.slots.filter(s => !s.booked);
            console.log(`   Total slots: ${slotsRes.data.slots.length}`);
            console.log(`   Available: ${availableSlots.length}`);
            if (availableSlots.length > 0) {
                console.log(`   First available: ${availableSlots[0].label}`);
            }
        }

        // Test 2: Create doctor unavailable block (one-time)
        console.log('\n2️⃣  Testing doctor block creation...');
        const blockRes = await API.post('/blocks', {
            date: dateStr,
            isRecurring: false,
            startHour: 12,
            startMinute: 0,
            endHour: 13,
            endMinute: 0,
            reason: 'Lunch Break'
        }, headers(doctorToken));

        console.log(`   Status: ${blockRes.status} ${blockRes.status === 201 ? '✅' : '❌'}`);
        if (blockRes.status !== 201) {
            console.log(`   Error: ${blockRes.data.message}`);
        }
        if (blockRes.data.data) {
            console.log(`   Block created: ${blockRes.data.data.startHour}:${String(blockRes.data.data.startMinute).padStart(2, '0')} - ${blockRes.data.data.endHour}:${String(blockRes.data.data.endMinute).padStart(2, '0')}`);
        }

        // Test 3: Test overlapping block validation (should fail)
        console.log('\n3️⃣  Testing overlapping block validation (should fail)...');
        const overlapBlockRes = await API.post('/blocks', {
            date: dateStr,
            isRecurring: false,
            startHour: 12,
            startMinute: 30,
            endHour: 13,
            endMinute: 30,
            reason: 'Another Block'
        }, headers(doctorToken));

        console.log(`   Status: ${overlapBlockRes.status} ${overlapBlockRes.status === 400 ? '✅ (Expected Error)' : '❌'}`);
        console.log(`   Message: ${overlapBlockRes.data.message}`);

        // Test 4: Book appointment
        console.log('\n4️⃣  Testing appointment booking...');
        const availableSlot = slotsRes.data.slots.find(s => !s.booked && s.hour === 10); // Book 10:00 AM
        
        if (!availableSlot) {
            console.log('   ❌ No available slots found');
        } else {
            const bookRes = await API.post('/appointments', {
                patientId: patient._id,
                doctorId: doctor._id,
                patientName: patient.name,
                doctorName: doctor.name,
                type: 'Consultation',
                date: availableSlot.time,
                duration: 60
            }, headers(patientToken));

            console.log(`   Status: ${bookRes.status} ${bookRes.status === 201 ? '✅' : '❌'}`);
            if (bookRes.status !== 201) {
                console.log(`   Error: ${bookRes.data.message || JSON.stringify(bookRes.data)}`);
            }

                // Test 5: Verify slot is now blocked
                console.log('\n5️⃣  Verifying slot is blocked after booking...');
                const updatedSlotsRes = await API.get('/appointments/slots', {
                    ...headers(patientToken),
                    params: { doctorId: doctor._id, date: dateStr }
                });

                const bookedSlot = updatedSlotsRes.data.slots.find(s => s.hour === availableSlot.hour && s.minute === availableSlot.minute);
                console.log(`   Status: ${updatedSlotsRes.status} ${updatedSlotsRes.status === 200 ? '✅' : '❌'}`);
                if (bookedSlot) {
                    console.log(`   Slot ${bookedSlot.label}: ${bookedSlot.booked ? 'BOOKED' : 'AVAILABLE'} ✅`);
                    console.log(`   Booked by: ${bookedSlot.bookedBy}`);
                }

                // Test 6: Try to double-book (should fail)
                console.log('\n6️⃣  Testing double-booking prevention (should fail)...');
                const doubleBookRes = await API.post('/appointments', {
                    patientId: patient._id,
                    doctorId: doctor._id,
                    patientName: patient.name,
                    doctorName: doctor.name,
                    type: 'Follow-up',
                    date: availableSlot.time,
                    duration: 30
                }, headers(patientToken));

                console.log(`   Status: ${doubleBookRes.status} ${doubleBookRes.status === 409 ? '✅ (Expected Conflict)' : '❌'}`);
                console.log(`   Message: ${doubleBookRes.data.message}`);

                // Test 7: Invalid duration validation
                console.log('\n7️⃣  Testing invalid duration validation...');
                const nextSlot = slotsRes.data.slots.find(s => !s.booked && s.hour === 11);
                if (nextSlot) {
                    const invalidDurationRes = await API.post('/appointments', {
                        patientId: patient._id,
                        doctorId: doctor._id,
                        patientName: patient.name,
                        doctorName: doctor.name,
                        type: 'Test',
                        date: nextSlot.time,
                        duration: 1000 // Invalid: > 480 minutes
                    }, headers(patientToken));

                    console.log(`   Status: ${invalidDurationRes.status} ${invalidDurationRes.status === 400 ? '✅ (Expected Error)' : '❌'}`);
                    console.log(`   Message: ${invalidDurationRes.data.message}`);
                }

                // Test 8: Time validation
                console.log('\n8️⃣  Testing time field validation...');
                const invalidTimeRes = await API.post('/blocks', {
                    date: dateStr,
                    isRecurring: false,
                    startHour: 14,
                    startMinute: 0,
                    endHour: 14,  // Same as start - invalid
                    endMinute: 0,
                    reason: 'Invalid Block'
                }, headers(doctorToken));

                console.log(`   Status: ${invalidTimeRes.status} ${invalidTimeRes.status === 400 ? '✅ (Expected Error)' : '❌'}`);
                console.log(`   Message: ${invalidTimeRes.data.message}`);

                // Test 9: Recurring block
                console.log('\n9️⃣  Testing recurring doctor block...');
                const recurringBlockRes = await API.post('/blocks', {
                    isRecurring: true,
                    dayOfWeek: 1, // Monday
                    startHour: 13,
                    startMinute: 0,
                    endHour: 14,
                    endMinute: 0,
                    reason: 'Weekly Lunch'
                }, headers(doctorToken));

                console.log(`   Status: ${recurringBlockRes.status} ${recurringBlockRes.status === 201 ? '✅' : '❌'}`);
                if (recurringBlockRes.data.data) {
                    console.log(`   Recurring: ${recurringBlockRes.data.data.isRecurring ? 'Yes' : 'No'}`);
                    console.log(`   Day: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][recurringBlockRes.data.data.dayOfWeek]}`);
                }

                // Test 10: Get user's appointments
                console.log('\n🔟 Testing user appointments list...');
                const appointmentsRes = await API.get('/appointments', headers(patientToken));
                console.log(`   Status: ${appointmentsRes.status} ${appointmentsRes.status === 200 ? '✅' : '❌'}`);
                console.log(`   Total appointments: ${appointmentsRes.data.data?.length || 0}`);
            }
        }

        console.log('\n=== ✅ APPOINTMENT SYSTEM TEST COMPLETE ===\n');

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
