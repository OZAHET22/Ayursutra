const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    type: { type: String, default: 'other' }, // prescription, lab-report, therapy-plan, etc.
    fileType: { type: String, default: 'pdf' }, // pdf, word, image
    fileUrl:  { type: String, default: '' },    // URL or base64 data URI of the actual file
    description: { type: String, default: '' }, // optional note from patient
    date: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: String, default: '' },
    notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
