require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./models/User');
    const Centre = require('./models/Centre');
    const Appointment = require('./models/Appointment');
    const u = await User.countDocuments();
    const c = await Centre.countDocuments({ active: true });
    const a = await Appointment.countDocuments();
    const demos = await User.find({ email: { $in: ['patient@demo.com','doctor@demo.com','admin@demo.com'] } }).select('email role approved');
    console.log('Users:', u, '| Active Centres:', c, '| Appointments:', a);
    console.log('Demo accounts:', JSON.stringify(demos.map(d => ({ email: d.email, role: d.role, approved: d.approved }))));
    process.exit(0);
}).catch(e => { console.error('DB error:', e.message); process.exit(1); });
