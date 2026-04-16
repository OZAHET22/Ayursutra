const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
}, { _id: true });

const SymptomLogSchema = new mongoose.Schema({
    loggedAt: { type: Date, default: Date.now },
    symptoms: { type: String, default: '' },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    notes: { type: String, default: '' },
    // Gap 2: doctor action saved per symptom entry
    doctorAction: {
        action: { type: String, default: '' },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: null },
    },
}, { _id: true });

const RescheduleHistorySchema = new mongoose.Schema({
    from: { type: Date },
    to: { type: Date },
    reason: { type: String, default: '' },
    requestedBy: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
    requestedAt: { type: Date, default: Date.now },
}, { _id: true });

const AppointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },
    type: { type: String, required: true },
    date: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'missed', 'cancelled'], default: 'pending' },
    centre: { type: String, default: '' },
    notes: { type: String, default: '' },
    // Scheduling & tracking extras
    sessionNotes: { type: String, default: '' },
    precautions: { type: String, default: '' },
    postCare: { type: String, default: '' },
    missedReason: { type: String, default: '' },
    checklistItems: [ChecklistItemSchema],
    symptomLog: [SymptomLogSchema],
    rescheduleHistory: [RescheduleHistorySchema],
    notificationsScheduled: { type: Boolean, default: false },
    postCareReminderSent: { type: Boolean, default: false },  // Gap 1: deduplicate post-care cron
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
