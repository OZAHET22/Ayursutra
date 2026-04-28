/**
 * routes/otp.js
 * POST /api/otp/send    — generate & email OTP (with disposable email blocks)
 * POST /api/otp/verify  — verify OTP → issue JWT
 */
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const axios   = require('axios');

const OTP          = require('../models/OTP');
const User         = require('../models/User');
const AbuseLog     = require('../models/AbuseLog');
const { validateEmail } = require('../utils/emailValidator');
const { validatePhone } = require('../utils/phoneValidator');
const { sendOTPEmail }  = require('../utils/sendOTPEmail');

const OTP_EXPIRE_MINUTES = 5;
const MAX_ATTEMPTS       = 5;
const RESEND_COOLDOWN_S  = 30; // seconds between resend requests

const DEMO_EMAILS = new Set(['patient@demo.com', 'doctor@demo.com', 'admin@demo.com']);

function generateOTP() {
    return String(crypto.randomInt(100000, 999999));
}

// ── Rate limiter helper ───────────────────────────────────────────
async function checkAbuseWait(target) {
    let log = await AbuseLog.findOne({ identifier: target });
    if (!log) return null;
    if (log.lockedUntil && new Date() < log.lockedUntil) {
        return Math.ceil((log.lockedUntil - new Date()) / 1000 / 60); // minutes
    }
    return null;
}

// ── POST /api/otp/send ────────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
    try {
        // Fallback for legacy requests sending just "email"
        let target = req.body.target || req.body.email;
        let targetType = req.body.targetType || 'email';
        const { purpose } = req.body;

        if (!target || !purpose) {
            return res.status(400).json({ success: false, message: 'Target and purpose are required.' });
        }
        
        target = target.trim();
        if (targetType === 'email') target = target.toLowerCase();

        // 1. Abuse Lock Check
        let waitMins = await checkAbuseWait(target);
        if (waitMins) {
            return res.status(429).json({ success: false, message: `Too many failed attempts. Locked for ${waitMins} minutes.` });
        }

        // 2. Strict Validation & Blocklists
        let validatedTarget = target;
        if (targetType === 'email') {
            const val = await validateEmail(target);
            if (!val.success) return res.status(400).json({ success: false, code: val.code, message: val.message });
        } else if (targetType === 'phone') {
            const val = await validatePhone(target);
            if (!val.success) return res.status(400).json({ success: false, code: val.code, message: val.message });
            validatedTarget = val.phone; // use cleaned e.g. +91XXXXXXXXXX
        }

        // 3a. For login — user must already exist
        if (purpose === 'login') {
            let searchQuery;
            if (targetType === 'email') {
                searchQuery = { email: validatedTarget };
            } else {
                // DB stores phone as +91XXXXXXXXXX (from phoneValidator) — search both formats
                const raw10 = validatedTarget.replace('+91', '');
                searchQuery = { $or: [{ phone: validatedTarget }, { phone: raw10 }] };
            }
            const existing = await User.findOne(searchQuery);
            if (!existing) {
                return res.status(404).json({ success: false, message: `No account found with this ${targetType}.` });
            }
        }

        // 3b. For register — email must NOT already be in use (cross-role uniqueness enforcement)
        if (purpose === 'register' && targetType === 'email') {
            const existing = await User.findOne({ email: validatedTarget }).select('role');
            if (existing) {
                const roleLabel = existing.role === 'doctor' ? 'Doctor'
                    : existing.role === 'admin' ? 'Admin' : 'Patient';
                return res.status(400).json({
                    success: false,
                    code: 'EMAIL_TAKEN',
                    existingRole: existing.role,
                    message: `This email is already registered as a ${roleLabel}. Each email can only be linked to one account across the platform. Please use a different email or log in.`,
                });
            }
        }

        // 4. Rate Limiting: Max 3 requests per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyCount = await OTP.countDocuments({ target: validatedTarget, targetType, purpose, createdAt: { $gte: oneHourAgo } });
        if (hourlyCount >= 3) {
            return res.status(429).json({ success: false, message: 'Max 3 OTP requests allowed per hour. Please try again later.' });
        }

        // 5. Resend cooldown
        const recent = await OTP.findOne({ target: validatedTarget, targetType, purpose }).sort({ createdAt: -1 });
        if (recent) {
            const ageSecs = (Date.now() - new Date(recent.createdAt).getTime()) / 1000;
            if (ageSecs < RESEND_COOLDOWN_S) {
                const wait = Math.ceil(RESEND_COOLDOWN_S - ageSecs);
                return res.status(429).json({ success: false, code: 'RESEND_COOLDOWN', message: `Wait ${wait} sec before new OTP.`, waitSeconds: wait });
            }
        }

        // 6. Invalidate previous OTPs
        await OTP.deleteMany({ target: validatedTarget, targetType, purpose });

        // 7. Generate & Save
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
        await OTP.create({ target: validatedTarget, targetType, code, purpose, expiresAt });

        // 8. Dispatch OTP
        let sent = false;
        let pErr = null;
        let savedOtp = null;

        // Re-fetch the doc we just created so we can delete it on failure
        savedOtp = await OTP.findOne({ target: validatedTarget, targetType, purpose, used: false }).sort({ createdAt: -1 });

        if (targetType === 'email') {
            if (DEMO_EMAILS.has(validatedTarget)) { sent = true; }
            else {
                try { await sendOTPEmail(validatedTarget, code, purpose); sent = true; } 
                catch(e) { 
                    pErr = e.message;
                    // Surface the real SMTP error in server logs for easy debugging
                    console.error(`[OTP/send] ❌ SMTP delivery FAILED for ${validatedTarget} (${purpose}):`, e.message);
                    console.error('[OTP/send] Check EMAIL_USER and EMAIL_PASSWORD in .env — run: node testEmail.js');
                }
            }
        } else {
            // Phone OTP via SMS not supported — treat as sent for phone-only flows
            console.log(`[OTP/send] Phone OTP requested for ${validatedTarget} — SMS not configured, OTP: ${code}`);
            sent = true;
        }

        // If dispatch genuinely failed (not a demo shortcut), clean up the saved OTP
        // so the user is not stuck behind a RESEND_COOLDOWN for a code that was never delivered.
        if (!sent && pErr) {
            if (savedOtp) await OTP.deleteOne({ _id: savedOtp._id });
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email. Please verify your email address is correct and try again.',
            });
        }

        res.json({
            success: true,
            message: `OTP sent to your ${targetType}.`,
        });
    } catch (err) {
        console.error('[OTP/send]', err);
        res.status(500).json({ success: false, message: 'Failed to send OTP.' });
    }
});

// ── POST /api/otp/check ───────────────────────────────────────────────────────
// Validates that an OTP is correct & not expired WITHOUT marking it as used.
// Used by the forgot-password flow to gate the "new password" step
// while leaving the OTP unconsumed for the final /auth/reset-password call.
router.post('/check', async (req, res) => {
    try {
        let target = (req.body.target || req.body.email || '').trim();
        let targetType = req.body.targetType || 'email';
        let { code, purpose } = req.body;

        if (!target || !code || !purpose) {
            return res.status(400).json({ success: false, message: 'target, code, and purpose are required.' });
        }

        if (targetType === 'email') target = target.toLowerCase();

        const otpDoc = await OTP.findOne({ target, targetType, purpose }).sort({ createdAt: -1 });

        if (!otpDoc) return res.status(400).json({ success: false, code: 'NOT_FOUND', message: 'No OTP found. Please request a new one.' });
        if (otpDoc.used) return res.status(400).json({ success: false, code: 'ALREADY_USED', message: 'OTP already used.' });
        if (new Date() > otpDoc.expiresAt) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ success: false, code: 'EXPIRED', message: 'OTP has expired. Please request a new one.' });
        }
        if (otpDoc.code !== String(code).trim()) {
            otpDoc.attempts = (otpDoc.attempts || 0) + 1;
            await otpDoc.save();
            const remaining = Math.max(0, MAX_ATTEMPTS - otpDoc.attempts);
            if (remaining === 0) {
                await OTP.deleteOne({ _id: otpDoc._id });
                return res.status(400).json({ success: false, code: 'LOCKED', message: 'Maximum attempts reached. Please request a new OTP.' });
            }
            return res.status(400).json({ success: false, code: 'INVALID', attemptsRemaining: remaining, message: `Incorrect OTP. ${remaining} attempt(s) remaining.` });
        }

        // Valid — do NOT mark as used (the consuming endpoint will do that)
        res.json({ success: true, valid: true, message: 'OTP is valid.' });
    } catch (err) {
        console.error('[OTP/check]', err);
        res.status(500).json({ success: false, message: 'Check failed.' });
    }
});


router.post('/verify', async (req, res) => {
    try {
        let target = req.body.target || req.body.email;
        let targetType = req.body.targetType || 'email';
        let { code, purpose } = req.body;

        if (!target || !code || !purpose) {
            return res.status(400).json({ success: false, message: 'target, code, and purpose are required.' });
        }

        target = target.trim();
        if (targetType === 'email') target = target.toLowerCase();
        // Match validated output string 
        if (targetType === 'phone') target = target.replace(/[^\d+]/g, '');
        if (targetType === 'phone' && !target.startsWith('+91')) {
             if (target.length === 10) target = '+91' + target;
        }

        let waitMins = await checkAbuseWait(target);
        if (waitMins) return res.status(429).json({ success: false, message: `Too many failed attempts. Locked for ${waitMins} minutes.` });

        const otpDoc = await OTP.findOne({ target, targetType, purpose }).sort({ createdAt: -1 });

        if (!otpDoc) return res.status(400).json({ success: false, code: 'NOT_FOUND', message: 'No OTP found.' });
        if (otpDoc.used) return res.status(400).json({ success: false, code: 'ALREADY_USED', message: 'OTP already used.' });
        if (new Date() > otpDoc.expiresAt) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ success: false, code: 'EXPIRED', message: 'OTP has expired.' });
        }

        if (otpDoc.code !== String(code).trim()) {
            otpDoc.attempts = (otpDoc.attempts || 0) + 1;
            await otpDoc.save();

            // Handle abusive guessing
            if (otpDoc.attempts >= MAX_ATTEMPTS) {
                await OTP.deleteOne({ _id: otpDoc._id });

                let log = await AbuseLog.findOne({ identifier: target });
                if (!log) log = new AbuseLog({ identifier: target });
                log.failures += 1;
                log.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 mins lock
                await log.save();

                return res.status(400).json({ success: false, code: 'LOCKED', message: 'Maximum attempts reached. You are locked out for 10 minutes.' });
            }

            const remaining = MAX_ATTEMPTS - otpDoc.attempts;
            return res.status(400).json({
                success: false,
                code: 'INVALID',
                attemptsRemaining: remaining,
                message: `Incorrect OTP. ${remaining} attempt(s) remaining.`
            });
        }

        otpDoc.used = true;
        await otpDoc.save();

        // Always issue a short-lived JWT as the OTP verification proof.
        // The frontend uses this to confirm the OTP was accepted; the actual
        // session token comes from the earlier /auth/login call stored in pendingSession.
        const token = jwt.sign(
            { [targetType]: target, purpose, verified: true },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ success: true, verified: true, token, tokenType: 'jwt', message: 'OTP verified successfully.' });
    } catch (err) {
        console.error('[OTP/verify]', err);
        res.status(500).json({ success: false, message: 'Verification failed.' });
    }
});

module.exports = router;
