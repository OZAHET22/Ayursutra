const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    // Doctor fields
    speciality: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    experience: { type: String, default: '' },
    hospitalName: { type: String, default: '' }, // Doctor's affiliated hospital/clinic name
    centre: { type: String, default: '' },
    centreId: { type: String, default: '' },
    available: { type: Boolean, default: true },
    approved: { type: Boolean, default: true }, // immediately visible; admin can revoke
    // Patient fields
    preferredDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    age: { type: Number, default: null },
    gender: { type: String, default: '' },
    condition: { type: String, default: '' },
    dosha: {
        vata: { type: Number, default: 33 },
        pitta: { type: Number, default: 33 },
        kapha: { type: Number, default: 34 },
    },
    avatar: { type: String, default: '👤' },
    notificationPrefs: {
        in_app: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
    },
}, { timestamps: true });

// Hash password before save (Mongoose v9 async pre-save)
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function (entered) {
    return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
