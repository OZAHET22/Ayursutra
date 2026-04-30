/**
 * notificationService.js — Email + In-App notifications
 * SMS (Fast2SMS) and WhatsApp (Whapi) have been removed as they are not used.
 */
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Therapy-specific pre/post care templates
const THERAPY_TEMPLATES = {
    Panchakarma: {
        pre: 'Please avoid heavy meals 2 hours before your Panchakarma session. Wear comfortable, loose-fitting clothing. Stay hydrated.',
        post: 'Rest for at least 1 hour after your session. Avoid cold water and raw foods for 24 hours. Follow the prescribed diet chart.',
        medications: 'Take the prescribed herbal oil as directed. Ghee should be consumed on an empty stomach if prescribed.',
    },
    Abhyanga: {
        pre: 'Avoid eating for 1 hour before the session. A warm shower beforehand is recommended.',
        post: 'Do not shower for 2 hours after the session to allow oil absorption. Rest and avoid direct sunlight.',
        medications: 'Apply the prescribed medicated oil as directed.',
    },
    Shirodhara: {
        pre: 'Do not eat a heavy meal before the session. Avoid caffeine on the day of treatment.',
        post: 'Rest in a quiet, warm room. Avoid screen time for 2 hours. Protect your head from cold wind.',
        medications: 'Continue your prescribed Ashwagandha or Brahmi supplements as directed.',
    },
    Basti: {
        pre: 'Follow prescribed dietary guidelines the day before. Stay well hydrated. Report any digestive issues to your practitioner.',
        post: 'Light diet recommended for 24 hours. Avoid cold and gas-forming foods.',
        medications: 'Take the prescribed intestinal herbs as directed.',
    },
    Nasya: {
        pre: 'Avoid cold exposure before the session. Clear nasal passages gently.',
        post: 'Keep head covered for 1 hour after. Avoid speaking loudly and cold foods.',
        medications: 'Use prescribed nasal drops morning and evening as directed.',
    },
    Virechana: {
        pre: 'Only liquid diet the day before. Stay at home - this is a cleansing therapy.',
        post: 'Rest completely. Light rice gruel (peya) recommended. Report any excessive discomfort.',
        medications: 'Take prescribed laxative herbs as timed by your practitioner.',
    },
    Vamana: {
        pre: 'Pre-treatment oleation required. Follow strict dietary prep as prescribed.',
        post: 'Complete rest recommended. Gradual diet re-introduction as per schedule.',
        medications: 'Follow the samsarjana krama (dietary regimen) exactly as prescribed.',
    },
    Consultation: {
        pre: 'Prepare a list of your current symptoms and medications. Bring any previous reports.',
        post: 'Follow the prescribed diet and lifestyle recommendations diligently.',
        medications: 'Take all prescribed herbs and supplements as directed by your doctor.',
    },
};

const getTemplate = (therapyType, templateType) => {
    const t = THERAPY_TEMPLATES[therapyType] || THERAPY_TEMPLATES['Consultation'];
    return t[templateType] || '';
};

// Email transport (Nodemailer) — only if credentials present
const getTransport = () => {
    const user = process.env.SMTP_USER || '';
    if (!user || user === 'your@email.com' || user.startsWith('your')) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user, pass: process.env.SMTP_PASS },
    });
};

// Send Email
const sendEmail = async (to, subject, html) => {
    const transport = getTransport();
    if (!transport) {
        console.log('[Notification] Email skipped — SMTP not configured');
        return false;
    }
    try {
        await transport.sendMail({ from: `"Ayursutra" <${process.env.SMTP_USER}>`, to, subject, html });
        console.log(`[Notification] Email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('[Notification] Email error:', err.message);
        return false;
    }
};

// Create an in-app notification in DB
const createInApp = async (userId, appointmentId, type, title, message, therapyType = '') => {
    try {
        const notif = await Notification.create({
            userId,
            appointmentId,
            type,
            channel: 'in_app',
            title,
            message,
            therapyType,
            status: 'sent',
            sentAt: new Date(),
        });
        return notif;
    } catch (err) {
        console.error('[Notification] DB create error:', err.message);
        return null;
    }
};

// Emit socket event to a specific user room
const emitToUser = (io, userId, event, data) => {
    if (io) io.to(`user_${userId}`).emit(event, data);
};

// Build full notification (in-app + optional email)
const sendNotification = async (io, { userId, appointmentId, type, title, message, therapyType, channels, email }) => {
    const results = {};

    // Always create in-app
    if (!channels || channels.includes('in_app')) {
        const notif = await createInApp(userId, appointmentId, type, title, message, therapyType);
        if (notif) {
            results.in_app = true;
            emitToUser(io, userId.toString(), 'new_notification', {
                _id: notif._id,
                title,
                message,
                type,
                therapyType,
                createdAt: notif.createdAt,
            });
        }
    }

    // Email
    if (channels && channels.includes('email') && email) {
        const html = `<div style="font-family:sans-serif;padding:20px;background:#f9f9f9;border-radius:8px;">
            <h2 style="color:#2a7d2e;">🌿 Ayursutra — ${title}</h2>
            <p>${message}</p>
            <hr/>
            <small style="color:#999;">Ayursutra Wellness Platform · ${new Date().toLocaleDateString()}</small>
        </div>`;
        results.email = await sendEmail(email, `Ayursutra: ${title}`, html);
        if (results.email) {
            await Notification.create({ userId, appointmentId, type, channel: 'email', title, message, therapyType, status: 'sent', sentAt: new Date() });
        }
    }

    return results;
};



module.exports = { sendNotification, createInApp, sendEmail, emitToUser, getTemplate, THERAPY_TEMPLATES };
