const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    replied: { type: Boolean, default: false },
    reply: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
