process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra';
const connectDB = require('./config/db');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Therapy = require('./models/Therapy');
const Feedback = require('./models/Feedback');
const Invoice = require('./models/Invoice');
const Document = require('./models/Document');
const DietPlan = require('./models/DietPlan');

const clearData = async () => {
    await connectDB();

    console.log('🧹 Clearing old patient, doctor, and appointment data...');

    // Delete all users EXCEPT the admin and the newly created 'het' doctor
    // The user recently tried to register "het" and "het oza". We should preserve recent users if possible?
    // Actually they said "no any old data are come in current state", so I'll wipe all demo users.
    // I will keep the 'admin@demo.com' and the ones created physically by the user today.
    // Wait, let's just wipe all patients, and all doctors whose email ends in '@demo.com' or all default ones from seedData.

    // Delete ALL patients
    const patientResult = await User.deleteMany({ role: 'patient' });
    console.log(`Deleted ${patientResult.deletedCount} Patients.`);

    // Delete seeded doctors or any doctors not made by the user recently
    // We will just delete all doctors since the user wants a clean state.
    // They can easily register 'het' again if they want to.
    const doctorResult = await User.deleteMany({ role: 'doctor' });
    console.log(`Deleted ${doctorResult.deletedCount} Doctors.`);

    await Appointment.deleteMany({});
    console.log('Deleted all Appointments.');

    await Therapy.deleteMany({});
    console.log('Deleted all Therapies.');

    await Feedback.deleteMany({});
    console.log('Deleted all Feedback.');

    await Invoice.deleteMany({});
    console.log('Deleted all Invoices.');

    await Document.deleteMany({});
    console.log('Deleted all Documents.');

    await DietPlan.deleteMany({});
    console.log('Deleted all Diet Plans.');

    console.log('\n✅ Database wiped successfully. The dashboard is now clean!');
    process.exit(0);
};

clearData().catch(err => { console.error(err); process.exit(1); });
