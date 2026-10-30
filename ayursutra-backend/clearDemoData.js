process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayursutra';
const connectDB = require('./config/db');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Therapy = require('./models/Therapy');
const Feedback = require('./models/Feedback');
const Document = require('./models/Document');
const DietPlan = require('./models/DietPlan');

const clearData = async () => {
    await connectDB();

    console.log('🧹 Clearing old patient, doctor, and appointment data...');

    const patientResult = await User.deleteMany({ role: 'patient' });
    console.log(`Deleted ${patientResult.deletedCount} Patients.`);

    const doctorResult = await User.deleteMany({ role: 'doctor' });
    console.log(`Deleted ${doctorResult.deletedCount} Doctors.`);

    await Appointment.deleteMany({});
    console.log('Deleted all Appointments.');

    await Therapy.deleteMany({});
    console.log('Deleted all Therapies.');

    await Feedback.deleteMany({});
    console.log('Deleted all Feedback.');

    await Document.deleteMany({});
    console.log('Deleted all Documents.');

    await DietPlan.deleteMany({});
    console.log('Deleted all Diet Plans.');

    console.log('\n✅ Database wiped successfully. The dashboard is now clean!');
    process.exit(0);
};

clearData().catch(err => { console.error(err); process.exit(1); });
