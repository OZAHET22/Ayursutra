/**
 * testEmail.js — Run with: node testEmail.js
 * Tests that the Gmail SMTP connection works and actually delivers an email.
 * Delete this file after confirming email delivery.
 */
const fs = require('fs');
const path = require('path');

// Load .env manually (same logic as server.js)
try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
        // Strip Windows carriage returns (\r) — CRLF files corrupt SMTP_PASS otherwise
        const trimmed = line.replace(/\r/g, '').trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                let val = trimmed.substring(eqIndex + 1).trim();
                val = val.replace(/#.*$/, '').trim(); // strip inline comments
                val = val.replace(/^['"]|['"]$/g, ''); // strip surrounding quotes
                if (!process.env[key]) process.env[key] = val;
            }
        }
    });
} catch (e) { console.error('Could not read .env:', e.message); }

const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_USER || !SMTP_PASS) {
    console.error('ERROR: SMTP_USER or SMTP_PASS missing from .env');
    process.exit(1);
}

console.log('Testing SMTP with user:', SMTP_USER);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
});

async function run() {
    // Step 1: Verify connection
    console.log('Step 1: Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('  SMTP connection OK');
    } catch (err) {
        console.error('  SMTP connection FAILED:', err.message);
        console.error('  Fix: Make sure 2FA is ON for', SMTP_USER, 'and the App Password is correct.');
        process.exit(1);
    }

    // Step 2: Send a real test email to the same account
    console.log('Step 2: Sending test OTP email to', SMTP_USER, '...');
    try {
        const info = await transporter.sendMail({
            from: 'Ayursutra OTP <' + SMTP_USER + '>',
            to: SMTP_USER,
            subject: '654321 — Ayursutra OTP Test Email',
            html: [
                '<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#f0fdf4;border-radius:12px;">',
                '<h2 style="color:#15803d">Ayursutra SMTP Test</h2>',
                '<p>If you receive this email, OTP delivery is working correctly.</p>',
                '<div style="font-size:2rem;font-weight:bold;color:#15803d;letter-spacing:8px;margin:20px 0;">654321</div>',
                '<p style="color:#666;font-size:0.9rem">This is a test message only — no action required.</p>',
                '</div>'
            ].join(''),
        });
        console.log('  Email sent! Message ID:', info.messageId);
        console.log('');
        console.log('SUCCESS: Check the inbox/spam of', SMTP_USER, 'for the test email.');
        console.log('If received, OTP emails are fully working. You can delete testEmail.js now.');
    } catch (err) {
        console.error('  Send FAILED:', err.message);
        process.exit(1);
    }
}

run();
