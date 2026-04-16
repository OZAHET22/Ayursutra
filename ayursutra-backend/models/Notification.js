const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    type: {
        type: String,
        enum: ['pre_24h', 'pre_1h', 'post_session', 'medication', 'followup', 'general'],
        default: 'general'
    },
    channel: { type: String, enum: ['in_app', 'email', 'whatsapp', 'sms'], default: 'in_app' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    therapyType: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' },
    scheduledAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
