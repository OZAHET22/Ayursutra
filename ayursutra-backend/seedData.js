// Set env vars directly (no dotenv dependency needed)
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ayursutra_jwt_secret_key_2024';
const connectDB = require('./config/db');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Therapy = require('./models/Therapy');
const Feedback = require('./models/Feedback');
const Centre = require('./models/Centre');

const seed = async () => {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Therapy.deleteMany({});
    await Feedback.deleteMany({});
    await Centre.deleteMany({});

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

    const doctor3 = await User.create({
        name: 'Dr. Amit Patel', email: 'doctor3@demo.com', password: 'demo123',
        role: 'doctor', speciality: 'Detox Specialist',
        centre: 'Ahmadabad Healing Centre', centreId: 'ahmadabad',
        experience: '10 years', phone: '9876500003', avatar: '👨‍⚕️', available: true, approved: true,
    });

    const patient1 = await User.create({
        name: 'Priya Sharma', email: 'patient@demo.com', password: 'demo123',
        role: 'patient', age: 35, gender: 'Female',
        phone: '9876543210', address: 'Mehsana',
        centre: 'Mehsana Healing Centre', centreId: 'mehsana',
        condition: 'Stress & Insomnia',
        dosha: { vata: 60, pitta: 25, kapha: 15 }, avatar: '🏥',
    });

    const patient2 = await User.create({
        name: 'Rahul Verma', email: 'patient2@demo.com', password: 'demo123',
        role: 'patient', age: 42, gender: 'Male',
        phone: '9876543211', address: 'Mehsana',
        centre: 'Mehsana Healing Centre', centreId: 'mehsana',
        condition: 'Joint Pain',
        dosha: { vata: 30, pitta: 40, kapha: 30 }, avatar: '🏥',
    });

    const patient3 = await User.create({
        name: 'Sita Patel', email: 'patient3@demo.com', password: 'demo123',
        role: 'patient', age: 28, gender: 'Female',
        phone: '9876543212', address: 'Ahmadabad',
        centre: 'Ahmadabad Healing Centre', centreId: 'ahmadabad',
        condition: 'Digestive Issues',
        dosha: { vata: 20, pitta: 60, kapha: 20 }, avatar: '🏥',
    });

    console.log('👥 Users created');

    // Create appointments
    const now = new Date();
    await Appointment.insertMany([
        { patientId: patient1._id, patientName: 'Priya Sharma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', type: 'Panchakarma', date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), duration: 60, status: 'confirmed', centre: 'pune' },
        { patientId: patient1._id, patientName: 'Priya Sharma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', type: 'Abhyanga', date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), duration: 45, status: 'pending', centre: 'pune' },
        { patientId: patient2._id, patientName: 'Rahul Verma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', type: 'Consultation', date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), duration: 30, status: 'pending', centre: 'pune' },
        { patientId: patient2._id, patientName: 'Rahul Verma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', type: 'Basti', date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), duration: 90, status: 'completed', centre: 'pune' },
        { patientId: patient3._id, patientName: 'Sita Patel', doctorId: doctor2._id, doctorName: 'Dr. Priya Gupta', type: 'Shirodhara', date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), duration: 60, status: 'confirmed', centre: 'pune' },
    ]);
    console.log('📅 Appointments created');

    // Create therapies
    await Therapy.insertMany([
        { name: 'Panchakarma Detox', patientId: patient1._id, patientName: 'Priya Sharma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', description: 'Complete detox therapy', type: 'panchakarma', status: 'active', sessions: 12, completed: 8, progress: 66, startDate: new Date('2026-01-01'), endDate: new Date('2026-04-15'), centre: 'pune' },
        { name: 'Stress Management', patientId: patient1._id, patientName: 'Priya Sharma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', description: 'Shirodhara based stress relief', type: 'shirodhara', status: 'upcoming', sessions: 8, completed: 0, progress: 0, startDate: new Date('2026-04-01'), endDate: new Date('2026-04-30'), centre: 'pune' },
        { name: 'Joint Pain Relief', patientId: patient2._id, patientName: 'Rahul Verma', doctorId: doctor1._id, doctorName: 'Dr. Rajesh Sharma', description: 'Basti therapy for joint pain', type: 'basti', status: 'active', sessions: 10, completed: 3, progress: 30, startDate: new Date('2026-02-01'), endDate: new Date('2026-05-01'), centre: 'pune' },
    ]);
    console.log('💆 Therapies created');

    // Create feedback
    await Feedback.insertMany([
        { patientId: patient1._id, patientName: 'Priya Sharma', doctorId: doctor1._id, content: 'Feeling much more relaxed after the Shirodhara session. Sleep improved!', rating: 5, replied: true, reply: 'Thank you! Continue the diet plan.' },
        { patientId: patient2._id, patientName: 'Rahul Verma', doctorId: doctor1._id, content: 'Noticed improvement in digestion. Following diet recommendations.', rating: 4, replied: true, reply: 'Great progress Rahul!' },
        { patientId: patient3._id, patientName: 'Sita Patel', doctorId: doctor2._id, content: 'Basti treatment was effective. Feeling lighter.', rating: 3, replied: false, reply: '' },
    ]);
    console.log('💬 Feedback created');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Demo login credentials:');
    console.log('  Patient: patient@demo.com / demo123');
    console.log('  Doctor:  doctor@demo.com / demo123');
    console.log('  Admin:   admin@demo.com / demo123');

    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
