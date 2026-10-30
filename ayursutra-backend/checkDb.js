// Load env vars manually (same approach as server.js)
const fs = require('fs');
const path = require('path');
try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.replace(/\r/g, '').trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                let val = trimmed.substring(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) process.env[key] = val;
            }
        }
    });
} catch (e) { /* .env not found */ }
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
