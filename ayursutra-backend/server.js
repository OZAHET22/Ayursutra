// Load env vars manually (compatible with all Node.js versions)
const fs = require('fs');
const path = require('path');
try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        // Strip Windows carriage returns (\r) before processing
        const trimmed = line.replace(/\r/g, '').trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                // Also strip inline comments (e.g. value # comment) and surrounding quotes
                let val = trimmed.substring(eqIndex + 1).trim();
                val = val.replace(/#.*$/, '').trim(); // remove inline comments
                val = val.replace(/^['"]|['"]$/g, ''); // strip surrounding quotes
                if (!process.env[key]) process.env[key] = val;
            }
        }
    });
} catch (e) { /* .env not found, use system env */ }

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
// Build allowed origins: always include localhost + any FRONTEND_URL env var
// Set FRONTEND_URL on Railway to your Vercel deployment URL (e.g. https://ayursutra.vercel.app)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://ayursutra-khaki.vercel.app',
];
if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map(u => u.trim()).filter(Boolean);
    urls.forEach(u => { if (!allowedOrigins.includes(u)) allowedOrigins.push(u); });
}

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
            return callback(new Error('CORS origin denied'), false);
        },
        credentials: true,
    }
});

// Attach io to app for route-level access  
app.set('io', io);

// Socket.io connection handler
io.on('connection', (socket) => {
    // Each user joins their own room for targeted notifications
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`[Socket] User ${userId} joined their room`);
        }
    });

    socket.on('disconnect', () => {
        // cleanup handled by socket.io automatically
    });
});

// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Ensure preflight and CORS headers are set even if routes error
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.indexOf(origin) !== -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        return res.sendStatus(204);
    }
    next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/therapies', require('./routes/therapies'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tracking', require('./routes/therapyTracking'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/diets', require('./routes/diets'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/centres', require('./routes/centres'));
app.use('/api/otp',       require('./routes/otp'));
app.use('/api/catalogue', require('./routes/catalogue'));
app.use('/api/blocks',           require('./routes/blocks'));
app.use('/api/doctor-schedule', require('./routes/doctorSchedule'));
app.use('/api/invoices',         require('./routes/invoices'));

// Health check (for Railway/monitoring services)
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Detailed health check for API
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Ayursutra API is running 🌿', time: new Date(), socketio: true });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// ─── CRON: Automated Notification Scheduler ───────────────────────────────────
// Gap 1: fires pre/post care reminders at the right time using notifyPatient()
const startCronScheduler = () => {
    const Appointment = require('./models/Appointment');
    const { getTemplate } = require('./services/notificationService');
    const { notifyPatient } = require('./utils/notifyPatient');
    const User = require('./models/User');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const windowMin = 60000; // 1-minute tolerance

            // ── PRE-PROCEDURE: appointments ~24h away ─────────────────────────
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

            // ── POST-PROCEDURE: sessions completed 2h+ ago, not yet reminded ──
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const justDone = await Appointment.find({
                status: 'completed',
                postCareReminderSent: { $ne: true },
                date: { $lt: twoHoursAgo },   // session started more than 2h ago
            });

            for (const appt of justDone) {
                // Verify session actually ended (start + duration < now - 2h)
                const sessionEnd = new Date(new Date(appt.date).getTime() + appt.duration * 60000);
                if (sessionEnd > twoHoursAgo) continue; // not 2h after end yet

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

            // ── AUTO-MISS: mark stale pending/confirmed appointments as 'missed' ──
            // Any session still pending/confirmed whose end time was 15+ minutes ago
            const missGracePeriod = new Date(now.getTime() - 15 * 60000);
            const missedResult = await Appointment.updateMany(
                {
                    status: { $in: ['pending', 'confirmed'] },
                    $expr: {
                        $lt: [
                            { $add: [{ $toLong: '$date' }, { $multiply: ['$duration', 60000] }] },
                            missGracePeriod.getTime(),
                        ],
                    },
                },
                { $set: { status: 'missed' } }
            );
            if (missedResult.modifiedCount > 0) {
                console.log(`[Cron] Auto-missed ${missedResult.modifiedCount} stale appointment(s)`);
                // Notify affected clients in real-time so dashboards update instantly
                try {
                    const missedAppts = await Appointment.find({
                        status: 'missed',
                        $expr: {
                            $lt: [
                                { $add: [{ $toLong: '$date' }, { $multiply: ['$duration', 60000] }] },
                                missGracePeriod.getTime(),
                            ],
                        },
                    }).select('_id patientId doctorId type date patientName').limit(50);
                    
                    for (const ma of missedAppts) {
                        const payload = { appointmentId: ma._id, status: 'missed', type: ma.type, date: ma.date };
                        
                        try {
                            // Broadcast status change to both users
                            io.to(`user_${ma.patientId}`).emit('appointment_status_changed', payload);
                            io.to(`user_${ma.doctorId}`).emit('appointment_status_changed', payload);
                            
                            // CRITICAL FIX: Send notifications with improved error handling
                            // Attempt to notify patient
                            try {
                                await notifyPatient({
                                    io,
                                    patientId: ma.patientId,
                                    type: 'warning',
                                    title: '⚠️ Appointment Marked as Missed',
                                    message: `Your ${ma.type} appointment on ${new Date(ma.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} has been automatically marked as missed because you did not attend.`,
                                    appointmentId: ma._id,
                                    therapyType: ma.type,
                                });
                            } catch (patientNotifErr) {
                                console.error(`[Cron] Failed to notify patient ${ma.patientId} of missed appointment:`, patientNotifErr.message);
                            }
                            
                            // Attempt to notify doctor
                            try {
                                await notifyPatient({
                                    io,
                                    patientId: ma.doctorId,
                                    type: 'warning',
                                    title: '⚠️ Appointment Marked as Missed',
                                    message: `${ma.patientName}'s ${ma.type} appointment on ${new Date(ma.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} has been automatically marked as missed (no-show).`,
                                    appointmentId: ma._id,
                                    therapyType: ma.type,
                                });
                            } catch (doctorNotifErr) {
                                console.error(`[Cron] Failed to notify doctor ${ma.doctorId} of missed appointment:`, doctorNotifErr.message);
                            }
                        } catch (appointmentErr) {
                            console.error(`[Cron] Error processing auto-missed appointment ${ma._id}:`, appointmentErr.message);
                        }
                    }
                } catch (emitErr) {
                    console.error('[Cron] Error fetching missed appointments:', emitErr.message);
                }
            }
        } catch (err) {
            console.error('[Cron] Scheduler error:', err.message);
        }
    });

    // ── INVOICE OVERDUE CRON: runs every hour ────────────────────────────────
    const Invoice = require('./models/Invoice');
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            // Find invoices past due date, still in actionable statuses, overdue not yet set
            const overdueInvoices = await Invoice.find({
                dueDate: { $lt: now },
                status: { $in: ['Sent', 'Unpaid', 'Partial'] },
                overdueNotificationSent: { $ne: true },
            });

            for (const inv of overdueInvoices) {
                inv.status = 'Overdue';
                inv.overdueNotificationSent = true;
                await inv.save();

                // Emit socket event
                io.to(`user_${inv.doctorId}`).emit('invoice_updated', {
                    invoiceId: inv._id,
                    invoiceNumber: inv.invoiceNumber,
                    status: 'Overdue',
                    patientId: inv.patientId,
                    doctorId: inv.doctorId,
                });

                // Notify patient (registered only)
                const mongoose = require('mongoose');
                if (inv.isRegisteredPatient && mongoose.Types.ObjectId.isValid(inv.patientId)) {
                    io.to(`user_${inv.patientId}`).emit('invoice_updated', {
                        invoiceId: inv._id,
                        invoiceNumber: inv.invoiceNumber,
                        status: 'Overdue',
                        patientId: inv.patientId,
                        doctorId: inv.doctorId,
                    });
                    try {
                        const { notifyPatient } = require('./utils/notifyPatient');
                        await notifyPatient({
                            io,
                            patientId: inv.patientId,
                            type: 'warning',
                            title: `⚠️ Invoice Overdue: ${inv.invoiceNumber}`,
                            message: `Your invoice ${inv.invoiceNumber} from Dr. ${inv.doctorName} is overdue. Balance due: ₹${inv.balance.toLocaleString('en-IN')}.`,
                        });
                    } catch (notifErr) {
                        console.error('[Invoice Cron] Notify error:', notifErr.message);
                    }
                }

                console.log(`[Invoice Cron] Marked overdue: ${inv.invoiceNumber}`);
            }

            if (overdueInvoices.length > 0) {
                console.log(`[Invoice Cron] Processed ${overdueInvoices.length} overdue invoice(s)`);
            }
        } catch (err) {
            console.error('[Invoice Cron] Error:', err.message);
        }
    });

    console.log('✅ Notification cron scheduler started (runs every minute)');
    console.log('✅ Invoice overdue cron started (runs every hour)');
};

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, async () => {
    console.log(`🚀 Ayursutra backend running on http://${HOST}:${PORT}`);
    console.log(`🔌 Socket.io enabled`);
    // Verify SMTP (Gmail) connection on startup — catch errors so the server stays up
    try {
        const { verifyTransporter } = require('./utils/sendOTPEmail');
        await verifyTransporter();
    } catch (err) {
        console.error('⚠️ verifyTransporter failed:', err && err.message ? err.message : err);
    }
    // Verify external WhatsApp connection on startup — catch errors
    try {
        const { verifyWhatsAppConnection } = require('./services/notificationService');
        await verifyWhatsAppConnection();
    } catch (err) {
        console.error('⚠️ verifyWhatsAppConnection failed:', err && err.message ? err.message : err);
    }
    // Start cron scheduler only after MongoDB is connected. If not connected,
    // wait for the 'connected' event and start the scheduler then.
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            startCronScheduler();
        } catch (err) {
            console.error('⚠️ startCronScheduler failed:', err && err.message ? err.message : err);
        }
    } else {
        console.warn('⚠️ MongoDB not connected — deferring cron scheduler until connected');
        mongoose.connection.once('connected', () => {
            console.log('🔁 MongoDB connected — starting cron scheduler');
            try {
                startCronScheduler();
            } catch (err) {
                console.error('⚠️ startCronScheduler failed:', err && err.message ? err.message : err);
            }
        });
    }
});
