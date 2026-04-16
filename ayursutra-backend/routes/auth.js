const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP  = require('../models/OTP');
const { protect } = require('../middleware/auth');
const { validateEmail } = require('../utils/emailValidator');
const { validatePhone } = require('../utils/phoneValidator');
const { sendOTPEmail } = require('../utils/sendOTPEmail');

// POST /api/auth/check-email — lightweight pre-check before sending OTP
// Returns { available: true } or { available: false, role: 'doctor'|'patient'|'admin', message: '...' }
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
        const normalEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalEmail }).select('role name');
        if (existing) {
            const roleLabel = existing.role === 'doctor' ? 'Doctor' : existing.role === 'admin' ? 'Admin' : 'Patient';
            return res.json({
                success: true,
                available: false,
                role: existing.role,
                message: `This email is already registered as a ${roleLabel}. Each email can only be linked to one account. Please use a different email or log in.`,
            });
        }
        return res.json({ success: true, available: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        let { name, email, password, role, phone, centre, centreId, speciality, licenseNumber, experience, age, gender, condition, preferredDoctor } = req.body;
        
        // 1. Validate Email (Catch disposable domains bypassing OTP flow with APIs)
        const emailCheck = await validateEmail(email);
        if (!emailCheck.success) {
            return res.status(400).json({ success: false, message: emailCheck.message });
        }
        const normalEmail = email.trim().toLowerCase();
        
        const existing = await User.findOne({ email: normalEmail }).select('role');
        if (existing) {
            const roleLabel = existing.role === 'doctor' ? 'Doctor' : existing.role === 'admin' ? 'Admin' : 'Patient';
            return res.status(400).json({
                success: false,
                code: 'EMAIL_TAKEN',
                existingRole: existing.role,
                message: `This email is already registered as a ${roleLabel}. Each email may only be linked to one account across the platform.`,
            });
        }

        // 2. Validate Phone (Catch fake VoIP / invalid formats)
        let formattedPhone = '';
        if (phone && phone.trim() !== '') {
            const phoneCheck = await validatePhone(phone);
            if (!phoneCheck.success) {
                return res.status(400).json({ success: false, message: phoneCheck.message });
            }
            formattedPhone = phoneCheck.phone;
            
            // Allow existing phone check without +91 as well for backward compatibility
            const existingPhone = await User.findOne({ $or: [{ phone: formattedPhone }, { phone: phoneCheck.raw10 }] });
            if (existingPhone) return res.status(400).json({ success: false, message: 'Mobile number already registered' });
        }

        if (!name || !password) {
            return res.status(400).json({ success: false, message: 'Name and password are required.' });
        }

        const user = await User.create({
            name, email: normalEmail, password,
            role: role || 'patient',
            phone: formattedPhone || '',
            centre: centre || '',
            centreId: centreId || '',
            speciality: speciality || '',
            licenseNumber: licenseNumber || '',
            experience: experience || '',
            age: age || null,
            gender: gender || '',
            condition: condition || '',
            preferredDoctor: (role === 'patient' && preferredDoctor) ? preferredDoctor : null,
            avatar: (role === 'doctor') ? '👨‍⚕️' : (role === 'admin' ? '🔑' : '🏥'),
            approved: (role === 'doctor') ? false : true, // doctors need admin approval
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                centre: user.centre,
                centreId: user.centreId,
                speciality: user.speciality,
                licenseNumber: user.licenseNumber,
                avatar: user.avatar,
                phone: user.phone,
                age: user.age,
                condition: user.condition,
                approved: user.approved,
                preferredDoctor: user.preferredDoctor || null,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Normalize email — always lowercase
        const normalEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalEmail });
        if (!user) {
            return res.status(401).json({ success: false, message: 'No account found with this email. Please sign up first.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        // Doctor-specific: check approval
        if (user.role === 'doctor' && !user.approved) {
            return res.status(403).json({
                success: false,
                code: 'DOCTOR_NOT_APPROVED',
                message: 'Your doctor account is pending admin approval. You will be notified once approved.',
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                centre: user.centre,
                centreId: user.centreId,
                speciality: user.speciality,
                licenseNumber: user.licenseNumber,
                avatar: user.avatar,
                phone: user.phone,
                age: user.age,
                condition: user.condition,
                approved: user.approved,
                preferredDoctor: user.preferredDoctor || null,
            }
        });
    } catch (err) {
        console.error('[login]', err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/migrate-doctors — one-time: approve all existing doctors (admin only)
router.post('/migrate-doctors', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required.' });
        }
        const result = await User.updateMany(
            { role: 'doctor', approved: { $ne: true } },
            { $set: { approved: true } }
        );
        res.json({ success: true, message: `Approved ${result.modifiedCount} existing doctor(s)` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD FLOW
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
// Step 1: Validate email exists, generate 6-digit OTP and send via email.
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

        const normalEmail = email.trim().toLowerCase();

        // Check user exists
        const user = await User.findOne({ email: normalEmail }).select('name email');
        if (!user) {
            // Return generic message — don't reveal if email is registered
            return res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
        }

        // Rate limit: max 3 reset OTPs per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const count = await OTP.countDocuments({ target: normalEmail, purpose: 'reset', createdAt: { $gte: oneHourAgo } });
        if (count >= 3) {
            return res.status(429).json({ success: false, message: 'Too many reset requests. Please wait an hour before trying again.' });
        }

        // Resend cooldown: 30 seconds
        const recent = await OTP.findOne({ target: normalEmail, purpose: 'reset' }).sort({ createdAt: -1 });
        if (recent) {
            const ageSecs = (Date.now() - new Date(recent.createdAt).getTime()) / 1000;
            if (ageSecs < 30) {
                const wait = Math.ceil(30 - ageSecs);
                return res.status(429).json({ success: false, code: 'RESEND_COOLDOWN', message: `Wait ${wait}s before requesting a new OTP.`, waitSeconds: wait });
            }
        }

        // Invalidate old reset OTPs for this email
        await OTP.deleteMany({ target: normalEmail, purpose: 'reset' });

        // Generate & save new OTP
        const code = String(crypto.randomInt(100000, 999999));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min for reset
        await OTP.create({ target: normalEmail, targetType: 'email', code, purpose: 'reset', expiresAt });

        // Send email
        try {
            await sendOTPEmail(normalEmail, code, 'reset');
        } catch (emailErr) {
            console.error('[forgot-password] Email send failed:', emailErr.message);
            // Don't expose email error to client
        }

        res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
    } catch (err) {
        console.error('[forgot-password]', err);
        res.status(500).json({ success: false, message: 'Failed to process request.' });
    }
});

// POST /api/auth/reset-password
// Step 2: Verify OTP + set new password.
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'email, otp and newPassword are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const normalEmail = email.trim().toLowerCase();

        // Find and validate OTP
        const otpDoc = await OTP.findOne({ target: normalEmail, targetType: 'email', purpose: 'reset' }).sort({ createdAt: -1 });
        if (!otpDoc) return res.status(400).json({ success: false, code: 'NOT_FOUND', message: 'No reset OTP found. Please request a new one.' });
        if (otpDoc.used) return res.status(400).json({ success: false, code: 'ALREADY_USED', message: 'This OTP has already been used.' });
        if (new Date() > otpDoc.expiresAt) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ success: false, code: 'EXPIRED', message: 'OTP has expired. Please request a new one.' });
        }

        if (otpDoc.code !== String(otp).trim()) {
            otpDoc.attempts = (otpDoc.attempts || 0) + 1;
            await otpDoc.save();
            const remaining = Math.max(0, 5 - otpDoc.attempts);
            if (remaining === 0) {
                await OTP.deleteOne({ _id: otpDoc._id });
                return res.status(400).json({ success: false, code: 'LOCKED', message: 'Too many wrong attempts. Please request a new OTP.' });
            }
            return res.status(400).json({ success: false, code: 'INVALID', message: `Incorrect OTP. ${remaining} attempt(s) remaining.` });
        }

        // Mark OTP as used
        otpDoc.used = true;
        await otpDoc.save();

        // Update password (Mongoose pre-save hook will hash it)
        const user = await User.findOne({ email: normalEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (err) {
        console.error('[reset-password]', err);
        res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
});

module.exports = router;

