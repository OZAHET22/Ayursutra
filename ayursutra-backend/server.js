try {
    require('dotenv').config();
} catch (e) {
    // In production platforms (Render, Railway, etc.), variables are supplied via host environment
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Essential for hosting behind reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// ─── CORS Configuration ────────────────────────────────────────────────────────
const staticAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://ayursutra-frontend-xi.vercel.app',
    'https://ayursutra-neon.vercel.app',
    'https://ayursutra-khaki.vercel.app',
    'https://frontend.ayursutra.qd.je',
    'https://api.ayursutra.qd.je',
];

const isAllowedOrigin = (origin) => {
    // Allow non-browser requests (mobile apps, server-to-server, curl, health checks)
    if (!origin) return true;

    // Check predefined list
    if (staticAllowedOrigins.includes(origin)) return true;

    // Check custom FRONTEND_URL env var (comma-separated list supported)
    if (process.env.FRONTEND_URL) {
        const configuredUrls = process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/$/, '')).filter(Boolean);
        if (configuredUrls.includes(origin)) return true;
    }

    // Allow Vercel preview/production deployments & Render domains
    if (/^https:\/\/[a-z0-9-]+(\.vercel\.app|\.onrender\.com)$/i.test(origin)) {
        return true;
    }

    return false;
};

const corsOptions = {
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS origin '${origin}' not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Explicit CORS & OPTIONS handling middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
        return res.sendStatus(204);
    }
    next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io Setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 25000,
});

// Helper: Provide .trigger(channel, event, data) for backwards compatibility with Pusher-style calls
io.trigger = (channel, event, data) => {
    try {
        if (!channel || channel === 'global') {
            io.emit(event, data);
        } else {
            io.to(channel).emit(event, data);
        }
    } catch (err) {
        console.error('[Socket.io] trigger error:', err.message);
    }
};

// Expose io instance to Express routes (under both 'io' and 'pusher' keys for 100% route compatibility)
app.set('io', io);
app.set('pusher', io);

// Socket connection & room subscriptions
io.on('connection', (socket) => {
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
        }
    });

    socket.on('disconnect', () => {
        // Automatically cleaned up by Socket.io
    });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/appointments',    require('./routes/appointments'));
app.use('/api/therapies',       require('./routes/therapies'));
app.use('/api/feedback',        require('./routes/feedback'));
app.use('/api/documents',       require('./routes/documents'));
app.use('/api/notifications',   require('./routes/notifications'));
app.use('/api/tracking',        require('./routes/therapyTracking'));
app.use('/api/analytics',       require('./routes/analytics'));
app.use('/api/diets',           require('./routes/diets'));
app.use('/api/prescriptions',   require('./routes/prescriptions'));
app.use('/api/stats',           require('./routes/stats'));
app.use('/api/centres',         require('./routes/centres'));
app.use('/api/otp',             require('./routes/otp'));
app.use('/api/catalogue',       require('./routes/catalogue'));
app.use('/api/blocks',          require('./routes/blocks'));
app.use('/api/doctor-schedule', require('./routes/doctorSchedule'));
app.use('/api/invoices',        require('./routes/invoices'));

// ─── Health Checks ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    res.json({
        success: true,
        message: 'Ayursutra API is running 🌿',
        database: isDbConnected ? 'connected' : 'disconnected',
        socketio: true,
        time: new Date()
    });
});

// ─── Serve Static Frontend if Built ───────────────────────────────────────────
const clientBuildPath = path.join(__dirname, '..', 'ayursutra-react', 'dist');
if (fs.existsSync(clientBuildPath)) {
    console.log(`📦 Serving React frontend from: ${clientBuildPath}`);
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path === '/health') return next();
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.json({
            status: 'OK',
            message: 'Ayursutra API Running 🌿',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        });
    });
}

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err.stack || err.message);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
        success: false,
        message: isProd ? 'Internal Server Error' : (err.message || 'Server error'),
        ...(isProd ? {} : { stack: err.stack })
    });
});

// ─── Automated Notification & Maintenance Cron Scheduler ───────────────────────
const startCronScheduler = () => {
    const Appointment = require('./models/Appointment');
    const { getTemplate } = require('./services/notificationService');
    const { notifyPatient } = require('./utils/notifyPatient');
    const User = require('./models/User');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const windowMin = 60000;

            // 1. Pre-Procedure: appointments ~24h away
            const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const upcoming = await Appointment.find({
                status: { $in: ['pending', 'confirmed'] },
                notificationsScheduled: { $ne: true },
                date: {
                    $gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
                    $lte: new Date(in24h.getTime() + windowMin),
                },
            });

            for (const appt of upcoming) {
                const patient = await User.findById(appt.patientId).select('email phone notificationPrefs name');
                if (!patient) continue;
                const precautions = appt.precautions || getTemplate(appt.type, 'pre');
                const diffH = Math.round((new Date(appt.date) - now) / (60 * 60 * 1000));
                const label = diffH >= 20 ? '24 hours' : '1 hour';

                await notifyPatient({
                    io,
                    patientId: appt.patientId,
                    type: diffH >= 20 ? 'pre_24h' : 'pre_1h',
                    title: `Reminder: ${appt.type} in ${label}`,
                    message: `You have a ${appt.type} session on ${new Date(appt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} with ${appt.doctorName}.\n\n📋 Pre-Procedure: ${precautions}`,
                    appointmentId: appt._id,
                    therapyType: appt.type,
                });

                await Appointment.findByIdAndUpdate(appt._id, { notificationsScheduled: true });
                console.log(`[Cron] Pre-notification sent for appt ${appt._id} (${label} reminder)`);
            }

            // 2. Post-Procedure: sessions completed 2h+ ago
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const justDone = await Appointment.find({
                status: 'completed',
                postCareReminderSent: { $ne: true },
                date: { $lt: twoHoursAgo },
            });

            for (const appt of justDone) {
                const sessionEnd = new Date(new Date(appt.date).getTime() + (appt.duration || 60) * 60000);
                if (sessionEnd > twoHoursAgo) continue;

                const postCare = appt.postCare || getTemplate(appt.type, 'post');
                if (!postCare) {
                    await Appointment.findByIdAndUpdate(appt._id, { postCareReminderSent: true });
                    continue;
                }

                await notifyPatient({
                    io,
                    patientId: appt.patientId,
                    type: 'post_session',
                    title: `Post-Procedure Care: ${appt.type}`,
                    message: `Your ${appt.type} session has ended. Please follow these care instructions:\n\n${postCare}`,
                    appointmentId: appt._id,
                    therapyType: appt.type,
                });

                await Appointment.findByIdAndUpdate(appt._id, { postCareReminderSent: true });
                console.log(`[Cron] Post-care reminder sent for appt ${appt._id}`);
            }

            // 3. Auto-Miss: mark stale pending/confirmed appointments as 'missed'
            const missGracePeriod = new Date(now.getTime() - 15 * 60000);
            const missedResult = await Appointment.updateMany(
                {
                    status: { $in: ['pending', 'confirmed'] },
                    $expr: {
                        $lt: [
                            { $add: [{ $toLong: '$date' }, { $multiply: [{ $ifNull: ['$duration', 60] }, 60000] }] },
                            missGracePeriod.getTime(),
                        ],
                    },
                },
                { $set: { status: 'missed' } }
            );
            if (missedResult.modifiedCount > 0) {
                console.log(`[Cron] Auto-missed ${missedResult.modifiedCount} stale appointment(s)`);
            }
        } catch (err) {
            console.error('[Cron] Scheduler error:', err.message);
        }
    });

    console.log('✅ Notification cron scheduler started');
};

// ─── Server Startup ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, async () => {
    console.log(`🚀 Ayursutra backend running on http://${HOST}:${PORT}`);
    console.log(`🔌 Socket.io enabled on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

    try {
        const { verifyTransporter } = require('./utils/sendOTPEmail');
        await verifyTransporter();
    } catch (err) {
        console.error('⚠️ verifyTransporter failed:', err?.message || err);
    }

    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            startCronScheduler();
        } catch (err) {
            console.error('⚠️ startCronScheduler failed:', err?.message || err);
        }
    } else {
        mongoose.connection.once('connected', () => {
            console.log('🔁 MongoDB connected — starting cron scheduler');
            try {
                startCronScheduler();
            } catch (err) {
                console.error('⚠️ startCronScheduler failed:', err?.message || err);
            }
        });
    }
});

// ─── Graceful Shutdown for Cloud Deployments ──────────────────────────────────
const handleShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('🔒 HTTP & Socket server closed.');
        try {
            await mongoose.connection.close(false);
            console.log('💾 MongoDB connection closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing MongoDB connection:', err);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error('⚠️ Forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = { app, server };
