const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    target:    { type: String, required: true }, // email (lowercased at route) OR phone (+91XXXXXXXXXX)
    targetType:{ type: String, enum: ['email', 'phone'], required: true },
    code:      { type: String, required: true },
    purpose:   { type: String, enum: ['register', 'login', 'reset'], required: true },
    attempts:  { type: Number, default: 0 },      // wrong attempts counter
    used:      { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

// MongoDB auto-deletes documents at expiresAt (expireAfterSeconds:0 = delete at the indexed date)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Fast lookup
OTPSchema.index({ target: 1, targetType: 1, purpose: 1 });

module.exports = mongoose.model('OTP', OTPSchema);
