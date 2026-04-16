const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// GET /api/notifications — get all for current user
router.get('/', protect, async (req, res) => {
    try {
        const notifs = await Notification.find({ userId: req.user.id, channel: 'in_app' })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = notifs.filter(n => n.status !== 'read').length;
        res.json({ success: true, data: notifs, unreadCount });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { status: 'read' },
            { new: true }
        );
        if (!notif) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: notif });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all/mark', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, status: { $ne: 'read' } },
            { status: 'read' }
        );
        res.json({ success: true, message: 'All marked as read' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/notifications/send — doctor sends manual notification to a patient
router.post('/send', protect, async (req, res) => {
    try {
        if (!['doctor', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Only doctors or admins can send notifications.' });
        }
        const { patientId, type, title, message, therapyType, channels } = req.body;
        if (!patientId || !title || !message) {
            return res.status(400).json({ success: false, message: 'patientId, title, and message are required' });
        }
        const patient = await User.findById(patientId);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        const io = req.app.get('io');
        const selectedChannels = channels || ['in_app'];
        const results = [];

        // ─── In-App ───────────────────────────────────────────────
        if (selectedChannels.includes('in_app')) {
            try {
                const { createInApp, emitToUser } = require('../services/notificationService');
                const notif = await createInApp(patientId, null, type || 'general', title, message, therapyType || '');
                if (notif && io) emitToUser(io, patientId.toString(), 'new_notification', { _id: notif._id, title, message, type, therapyType, createdAt: notif.createdAt });
                results.push({ channel: 'in_app', success: true });
            } catch (err) {
                results.push({ channel: 'in_app', success: false, reason: err.message });
            }
        }

        // ─── Email ────────────────────────────────────────────────
        if (selectedChannels.includes('email')) {
            if (!patient.email) {
                results.push({ channel: 'email', success: false, reason: 'Patient has no email on record' });
            } else if (!process.env.SMTP_USER || process.env.SMTP_USER.startsWith('your')) {
                results.push({ channel: 'email', success: false, reason: 'SMTP not configured in .env' });
            } else {
                try {
                    const { sendEmail } = require('../services/notificationService');
                    const html = `<div style="font-family:sans-serif;padding:20px;background:#f9f9f9;border-radius:8px;"><h2 style="color:#2a7d2e;">🌿 Ayursutra — ${title}</h2><p>${message}</p><hr/><small style="color:#999;">Ayursutra Wellness Platform · ${new Date().toLocaleDateString()}</small></div>`;
                    const ok = await sendEmail(patient.email, `Ayursutra: ${title}`, html);
                    results.push({ channel: 'email', success: !!ok, reason: ok ? undefined : 'SMTP send failed — check server logs' });
                } catch (err) {
                    results.push({ channel: 'email', success: false, reason: err.message });
                }
            }
        }

        // ─── WhatsApp ─────────────────────────────────────────────
        if (selectedChannels.includes('whatsapp')) {
            if (!patient.phone) {
                results.push({ channel: 'whatsapp', success: false, reason: 'Patient has no phone number' });
            } else if (!process.env.WHAPI_TOKEN || process.env.WHAPI_TOKEN.startsWith('your')) {
                results.push({ channel: 'whatsapp', success: false, reason: 'WHAPI_TOKEN not configured in .env' });
            } else {
                try {
                    const { sendWhatsApp } = require('../services/notificationService');
                    const ok = await sendWhatsApp(patient.phone, `🌿 *Ayursutra*\n*${title}*\n\n${message}`);
                    results.push({ channel: 'whatsapp', success: !!ok, reason: ok ? undefined : 'WhatsApp API call failed — check server logs' });
                } catch (err) {
                    results.push({ channel: 'whatsapp', success: false, reason: err.message });
                }
            }
        }

        // ─── SMS ──────────────────────────────────────────────────
        if (selectedChannels.includes('sms')) {
            if (!patient.phone) {
                results.push({ channel: 'sms', success: false, reason: 'Patient has no phone number' });
            } else if (!process.env.FAST2SMS_API_KEY || process.env.FAST2SMS_API_KEY.startsWith('your')) {
                results.push({ channel: 'sms', success: false, reason: 'FAST2SMS_API_KEY not configured in .env' });
            } else {
                try {
                    const { sendSMS } = require('../services/notificationService');
                    const ok = await sendSMS(patient.phone, `Ayursutra: ${title}\n\n${message}`);
                    results.push({ channel: 'sms', success: !!ok, reason: ok ? undefined : 'SMS API call failed — check server logs' });
                } catch (err) {
                    results.push({ channel: 'sms', success: false, reason: err.message });
                }
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        res.json({
            success: successCount > 0,
            message: `${successCount}/${totalCount} channels sent`,
            results,
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/notifications/prefs — patient gets notification preferences (from user doc)
router.get('/prefs', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notificationPrefs');
        res.json({ success: true, data: user?.notificationPrefs || { in_app: true, email: false, whatsapp: false, sms: false } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/notifications/prefs — patient updates notification preferences
router.put('/prefs', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { notificationPrefs: req.body },
            { new: true }
        ).select('notificationPrefs');
        res.json({ success: true, data: user.notificationPrefs });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/notifications/test-whatsapp — doctor/admin sends a test WhatsApp to any phone number
router.post('/test-whatsapp', protect, async (req, res) => {
    try {
        if (!['doctor', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });
        const { sendWhatsApp } = require('../services/notificationService');
        const result = await sendWhatsApp(phone, '🌿 *Ayursutra Test*\n\nYour WhatsApp notifications are working correctly! ✅');
        if (result) {
            res.json({ success: true, message: `✅ WhatsApp test message sent to ${phone}` });
        } else {
            res.status(500).json({ success: false, message: '❌ WhatsApp send failed — check WHAPI_TOKEN in .env and ensure the number is a valid WhatsApp account. See backend console for details.' });
        }
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/notifications/test-sms — doctor/admin sends a test SMS to any phone number
router.post('/test-sms', protect, async (req, res) => {
    try {
        if (!['doctor', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });
        const { sendSMS } = require('../services/notificationService');
        const result = await sendSMS(phone, 'Ayursutra Test: Your SMS notifications are working correctly!');
        if (result) {
            res.json({ success: true, message: `✅ SMS test message sent to ${phone}` });
        } else {
            res.status(500).json({ success: false, message: '❌ SMS send failed — check FAST2SMS_API_KEY in .env. See backend console for details.' });
        }
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
