/**
 * sendOTPEmail.js
 * Sends a branded 6-digit OTP email using the existing SMTP config.
 */
const nodemailer = require('nodemailer');

/**
 * Creates a transporter on demand (lazy) so env vars are always resolved.
 * Uses `service: 'gmail'` for maximum compatibility — this automatically
 * configures host, port, TLS/STARTTLS settings for Gmail App Passwords.
 */
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}

/**
 * Test the SMTP connection — call this on server startup to catch
 * credential problems early rather than at first OTP send.
 */
async function verifyTransporter() {
    const transporter = createTransporter();
    // Diagnostic: print first 4 chars of EMAIL_PASSWORD so devs can spot CRLF corruption
    const passMasked = process.env.EMAIL_PASSWORD
        ? process.env.EMAIL_PASSWORD.replace(/[\r\n]/g, '⏎').slice(0, 4) + '****'
        : '(not set)';
    console.log(`[SMTP] Verifying Gmail: ${process.env.EMAIL_USER} | Pass prefix: ${passMasked}`);
    try {
        await transporter.verify();
        console.log('[SMTP] Gmail connection verified ✓ — OTP emails will be delivered.');
        return true;
    } catch (err) {
        console.error('[SMTP] ❌ Gmail connection FAILED:', err.message);
        console.error('[SMTP] Check EMAIL_USER and EMAIL_PASSWORD in .env — make sure the Gmail App Password is correct and 2FA is enabled on the account.');
        return false;
    }
}

/**
 * @param {string} toEmail   - Recipient email
 * @param {string} otp       - 6-digit code
 * @param {string} purpose   - 'register' | 'login'
 */
async function sendOTPEmail(toEmail, otp, purpose) {
    const actionLabel = purpose === 'register' ? 'Registration'
        : purpose === 'reset' ? 'Password Reset'
        : 'Login';
    const expireNote = purpose === 'reset' ? '10 minutes' : '5 minutes';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 1.6rem; letter-spacing: 1px; }
        .header p  { color: #b7e4c7; margin: 6px 0 0; font-size: 0.9rem; }
        .body { padding: 40px; text-align: center; }
        .otp-box { display: inline-block; background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 18px 40px; margin: 24px 0; }
        .otp-code { font-size: 2.8rem; font-weight: 800; color: #15803d; letter-spacing: 12px; font-family: monospace; }
        .note { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 6px; padding: 12px 16px; text-align: left; font-size: 0.9rem; color: #7c2d12; margin-top: 20px; }
        .footer { background: #f8f8f8; padding: 20px 40px; text-align: center; font-size: 0.78rem; color: #999; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🌿 Ayursutra</h1>
          <p>Email ${actionLabel} Verification</p>
        </div>
        <div class="body">
          <p style="color:#444;font-size:1rem;margin:0 0 8px;">Your one-time verification code for <strong>${actionLabel}</strong> is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p style="color:#666;font-size:0.9rem;">⏱ This code expires in <strong>${expireNote}</strong>.</p>
          <div class="note">
            🔒 <strong>Do not share this code with anyone.</strong><br/>
            Ayursutra will never ask for your OTP via phone or chat.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Ayursutra Wellness Platform · This is an automated email. Do not reply.
        </div>
      </div>
    </body>
    </html>`;

    const transporter = createTransporter();
    await transporter.sendMail({
        from:    `"Ayursutra OTP" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `${otp} — Your Ayursutra ${actionLabel} OTP`,
        html,
    });
}

module.exports = { sendOTPEmail, verifyTransporter };
