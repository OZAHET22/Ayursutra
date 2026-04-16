const mongoose = require('mongoose');

const AbuseLogSchema = new mongoose.Schema({
    identifier: { type: String, required: true }, // email or phone
    failures: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null }
}, { timestamps: true });

// Auto expire after 1 day
AbuseLogSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('AbuseLog', AbuseLogSchema);
