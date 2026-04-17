const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Safe diagnostic: print only the host part of the MONGO_URI (never print the password)
        const raw = process.env.MONGO_URI || '';
        if (raw) {
            const m = raw.match(/@([^/]+)/);
            const host = m ? m[1].split('?')[0] : 'unknown';
            console.log(`🔎 Using MONGO host: ${host}`);
        } else {
            console.log('🔎 MONGO_URI not set');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
