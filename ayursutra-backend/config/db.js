const dns = require('dns');
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

        // Prevent querySrv ECONNREFUSED on Windows / residential ISP routers
        if (raw.startsWith('mongodb+srv://')) {
            try {
                dns.setServers(['8.8.8.8', '1.1.1.1']);
            } catch (dnsErr) {
                // Ignore if not supported in environment
            }
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
        return conn;
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        if (err.message && err.message.includes('querySrv')) {
            try {
                console.log('🔄 Retrying MongoDB connection with public DNS resolvers (8.8.8.8, 1.1.1.1)...');
                dns.setServers(['8.8.8.8', '1.1.1.1']);
                const conn = await mongoose.connect(process.env.MONGO_URI);
                console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
                return conn;
            } catch (retryErr) {
                console.error(`❌ Retry connection error: ${retryErr.message}`);
            }
        }
        // Don't exit the process here; keep the server running so we can
        // inspect logs and return healthy HTTP responses for diagnostics.
        // The server's routes should handle DB unavailability gracefully.
        return null;
    }
};

module.exports = connectDB;
