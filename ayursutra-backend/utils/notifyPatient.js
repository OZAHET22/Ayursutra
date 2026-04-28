/**
 * notifyPatient.js — Unified notification dispatcher
 * Sends Socket.io (in-app) + Email for any patient-facing event.
 * SMS and WhatsApp have been removed as they are not used in this project.
 */

const { sendEmail, createInApp, emitToUser } = require('../services/notificationService');
const User = require('../models/User');

/**
 * @param {object} opts
 * @param {object}  opts.io              - Socket.io server instance
 * @param {string}  opts.patientId       - MongoDB ObjectId of patient
 * @param {string}  opts.type            - Notification type key
 * @param {string}  opts.title           - Notification title
 * @param {string}  opts.message         - Notification body
 * @param {string}  [opts.appointmentId] - Optional linked appointment
 * @param {string}  [opts.therapyType]   - Optional therapy name
 * @returns {Promise<{socketSent, emailSent, emailError}>}
 */
async function notifyPatient({ io, patientId, type, title, message, appointmentId = null, therapyType = '' }) {
    const result = {
        socketSent: false,
        emailSent: false,
        emailError: null,
    };

    // ── Fetch patient info ────────────────────────────────────────────────────
    let patient;
    try {
        patient = await User.findById(patientId).select('email name');
    } catch (err) {
        console.error('[notifyPatient] Could not fetch patient:', err.message);
        return result;
    }
    if (!patient) return result;

    // ── 1. Socket.io (in-app) — ALWAYS ───────────────────────────────────────
    try {
        const notif = await createInApp(patientId, appointmentId, type, title, message, therapyType);
        if (notif && io) {
            emitToUser(io, patientId.toString(), 'new_notification', {
                _id: notif._id, title, message, type, therapyType, createdAt: notif.createdAt,
            });
            result.socketSent = true;
        }
    } catch (err) {
        console.error('[notifyPatient] Socket/in-app error:', err.message);
    }

    // ── 2. Email ───────────────────────────────────────────────────────────────
    const smtpUser = process.env.SMTP_USER || '';
    if (smtpUser && !smtpUser.startsWith('your') && patient.email) {
        try {
            const html = `<div style="font-family:sans-serif;padding:20px;background:#f9f9f9;border-radius:8px;">
                <h2 style="color:#2a7d2e;">🌿 Ayursutra — ${title}</h2>
                <p style="color:#444;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</p>
                <hr/>
                <small style="color:#999;">Ayursutra Wellness Platform · ${new Date().toLocaleDateString('en-IN')}</small>
            </div>`;
            const ok = await sendEmail(patient.email, `Ayursutra: ${title}`, html);
            result.emailSent = !!ok;
            if (!ok) result.emailError = 'SMTP send returned failure';
        } catch (err) {
            result.emailError = err.message;
            console.error('[notifyPatient] Email error:', err.message);
        }
    } else {
        result.emailError = smtpUser ? 'Patient has no email' : 'SMTP not configured';
    }

    return result;
}

module.exports = { notifyPatient };
