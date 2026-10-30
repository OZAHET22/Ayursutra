require('dotenv').config();
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ayursutra_jwt_secret_key_2024';
const connectDB = require('./config/db');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Therapy = require('./models/Therapy');
const Feedback = require('./models/Feedback');
const Centre = require('./models/Centre');
const CatalogueItem = require('./models/CatalogueItem');

const seed = async () => {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Therapy.deleteMany({});
    await Feedback.deleteMany({});
    await Centre.deleteMany({});
    await CatalogueItem.deleteMany({});

    console.log('🧹 Cleared existing data');

    // ── Seed Centres ──────────────────────────────────────────────────────────
    await Centre.insertMany([
        { name: 'Mehsana Healing Centre',     slug: 'mehsana',     active: true },
        { name: 'Ahmadabad Healing Centre',   slug: 'ahmadabad',   active: true },
        { name: 'Gandhinagar Healing Centre', slug: 'gandhinagar', active: true },
    ]);
    console.log('🏛️  Centres seeded');

    // Create users
    const admin = await User.create({
        name: 'Admin User', email: 'admin@demo.com', password: 'demo123',
        role: 'admin', avatar: '🔑',
    });

    const doctor1 = await User.create({
        name: 'Dr. Rajesh Sharma', email: 'doctor@demo.com', password: 'demo123',
        role: 'doctor', speciality: 'Panchakarma Specialist',
        centre: 'Mehsana Healing Centre', centreId: 'mehsana',
        experience: '12 years', phone: '9876500001', avatar: '👨‍⚕️', available: true, approved: true,
    });

    const doctor2 = await User.create({
        name: 'Dr. Priya Gupta', email: 'doctor2@demo.com', password: 'demo123',
        role: 'doctor', speciality: 'Ayurvedic Physician',
        centre: 'Mehsana Healing Centre', centreId: 'mehsana',
        experience: '8 years', phone: '9876500002', avatar: '👩‍⚕️', available: true, approved: true,
    });

    const patient1 = await User.create({
        name: 'Aarav Patel', email: 'patient@demo.com', password: 'demo123',
        role: 'patient', phone: '9876500003', avatar: '🧘',
        centre: 'Mehsana Healing Centre', centreId: 'mehsana',
        medicalHistory: 'Chronic back pain, Vata imbalance',
        emergencyContact: { name: 'Sunita Patel', relationship: 'Mother', phone: '9876500099' },
    });

    const patient2 = await User.create({
        name: 'Diya Shah', email: 'patient2@demo.com', password: 'demo123',
        role: 'patient', phone: '9876500004', avatar: '🌸',
        centre: 'Mehsana Healing Centre', centreId: 'mehsana',
        medicalHistory: 'Insomnia, Pitta aggravation',
        emergencyContact: { name: 'Kiran Shah', relationship: 'Father', phone: '9876500098' },
    });

    console.log('👤 Users seeded');

    // Seed Catalogue Items
    await CatalogueItem.insertMany([
        { doctorId: doctor1._id, type: 'Therapy', name: 'Abhyanga', desc: 'Full body warm herbal oil massage', price: 1500, gst: 18 },
        { doctorId: doctor1._id, type: 'Therapy', name: 'Shirodhara', desc: 'Pouring medicated oil on forehead', price: 2000, gst: 18 },
        { doctorId: doctor1._id, type: 'Consultation', name: 'Initial Ayurvedic Consultation', desc: 'Complete Nadi and Dosha evaluation', price: 500, gst: 0 },
        { doctorId: doctor2._id, type: 'Therapy', name: 'Swedana', desc: 'Herbal steam therapy', price: 1000, gst: 18 },
    ]);
    console.log('📦 Catalogue Items seeded');

    // Seed Patient Therapies
    const today = new Date();
    const endDate1 = new Date(today);
    endDate1.setDate(endDate1.getDate() + 14);

    const therapies = await Therapy.insertMany([
        {
            name: 'Abhyanga Full Body Course',
            patientId: patient1._id,
            patientName: patient1.name,
            doctorId: doctor1._id,
            doctorName: doctor1.name,
            description: 'Course of warm herbal oil massages for Vata calming.',
            type: 'Abhyanga',
            status: 'active',
            sessions: 5,
            completed: 2,
            progress: 40,
            startDate: today,
            endDate: endDate1,
        },
        {
            name: 'Shirodhara Rejuvenation',
            patientId: patient2._id,
            patientName: patient2.name,
            doctorId: doctor2._id,
            doctorName: doctor2.name,
            description: 'Medicated oil therapy for stress and sleep.',
            type: 'Shirodhara',
            status: 'upcoming',
            sessions: 3,
            completed: 0,
            progress: 0,
            startDate: today,
            endDate: endDate1,
        },
    ]);
    console.log('🌿 Therapies seeded');

    // Seed appointments
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    await Appointment.insertMany([
        {
            patientId: patient1._id,
            patientName: patient1.name,
            doctorId: doctor1._id,
            doctorName: doctor1.name,
            type: 'Abhyanga',
            date: tomorrow,
            duration: 60,
            status: 'confirmed',
            centre: 'Mehsana Healing Centre',
            notes: 'Follow-up session for back pain',
        },
        {
            patientId: patient2._id,
            patientName: patient2.name,
            doctorId: doctor2._id,
            doctorName: doctor2.name,
            type: 'Shirodhara',
            date: dayAfter,
            duration: 45,
            status: 'pending',
            centre: 'Mehsana Healing Centre',
            notes: 'First Shirodhara consultation',
        },
    ]);
    console.log('📅 Appointments seeded');

    // Seed feedback
    await Feedback.create({
        patientId: patient1._id,
        patientName: patient1.name,
        doctorId: doctor1._id,
        content: 'Excellent Abhyanga therapy! Dr. Rajesh was very attentive, professional, and skilled.',
        rating: 5,
        replied: false,
    });
    console.log('⭐ Feedback seeded');

    console.log('\n✅ Demo data seeded successfully into MongoDB Atlas!');
    console.log('------------------------------------------------');
    console.log('Admin:   admin@demo.com   / demo123');
    console.log('Doctor:  doctor@demo.com  / demo123');
    console.log('Patient: patient@demo.com / demo123');
    console.log('------------------------------------------------');
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
});
