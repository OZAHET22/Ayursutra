const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

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
// Supports channels: in_app, email
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
                results.push({ channel: 'email', success: false, reason: 'SMTP not configured' });
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

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        res.json({
            success: successCount > 0,
            message: `${successCount}/${totalCount} channels sent`,
            results,
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/notifications/prefs — patient gets notification preferences
router.get('/prefs', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notificationPrefs');
        res.json({ success: true, data: user?.notificationPrefs || { in_app: true, email: false } });
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

module.exports = router;
