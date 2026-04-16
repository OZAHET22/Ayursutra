/**
 * notifyPatient.js — Unified notification dispatcher (Gap 4)
 * Sends Socket.io + SMS + Email for any patient-facing event.
 * Used by appointment routes, tracking routes, and cron jobs.
 */

const { sendEmail, sendSMS, createInApp, emitToUser } = require('../services/notificationService');
const User = require('../models/User');

/**
 * @param {object} opts
 * @param {string}  opts.io           - Socket.io server instance
 * @param {string}  opts.patientId    - MongoDB ObjectId of patient
 * @param {string}  opts.type         - Notification type key
 * @param {string}  opts.title        - Notification title
 * @param {string}  opts.message      - Notification body
 * @param {string}  [opts.appointmentId] - Optional linked appointment
 * @param {string}  [opts.therapyType]   - Optional therapy name
 * @returns {Promise<{socketSent, smsSent, emailSent, smsError, emailError}>}
 */
async function notifyPatient({ io, patientId, type, title, message, appointmentId = null, therapyType = '' }) {
    const result = {
        socketSent: false,
        smsSent: false,
        emailSent: false,
        smsError: null,
        emailError: null,
    };

    // ── Fetch patient info ────────────────────────────────────────────────────
    let patient;
    try {
        patient = await User.findById(patientId).select('email phone name notificationPrefs');
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

    // ── 2. SMS ─────────────────────────────────────────────────────────────────
    const apiKey = process.env.FAST2SMS_API_KEY || '';
    if (apiKey && !apiKey.startsWith('your') && patient.phone) {
        try {
            const ok = await sendSMS(patient.phone, `Ayursutra: ${title}\n\n${message}`);
            result.smsSent = !!ok;
            if (!ok) result.smsError = 'SMS API returned failure';
        } catch (err) {
            result.smsError = err.message;
            console.error('[notifyPatient] SMS error:', err.message);
        }
    } else {
        result.smsError = apiKey ? 'Patient has no phone' : 'FAST2SMS_API_KEY not configured';
    }

    // ── 3. Email ───────────────────────────────────────────────────────────────
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
