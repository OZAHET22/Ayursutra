const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'missed', 'scheduled'], default: 'completed' },
    notes: { type: String, default: '' },
}, { _id: true });

const MilestoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    description: { type: String, default: '' },
    achievedAt: { type: Date, default: Date.now },
}, { _id: true });

const DoctorActionSchema = new mongoose.Schema({
    action: { type: String, default: 'no_change' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const TherapySymptomSchema = new mongoose.Schema({
    loggedAt: { type: Date, default: Date.now },
    symptoms: { type: String, default: '' },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    notes: { type: String, default: '' },
    sessionRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    doctorAction: { type: DoctorActionSchema, default: null },
}, { _id: true });

// Per-patient therapy session slot (doctor-scheduled individual session times)
const TherapySlotSchema = new mongoose.Schema({
    slotIndex: { type: Number, required: true },   // 1, 2, 3 … N
    date: { type: String, default: '' },            // 'YYYY-MM-DD'
    time: { type: String, default: '' },            // 'HH:MM'
    duration: { type: Number, default: 60 },        // minutes
    notes: { type: String, default: '' },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'missed', 'rescheduled', 'cancelled'],
        default: 'scheduled',
    },
    scheduledAt: { type: Date, default: Date.now },
}, { _id: false });

const TherapySchema = new mongoose.Schema({
    name: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'active', 'completed', 'paused'], default: 'upcoming' },
    sessions: { type: Number, default: 1 },
    completed: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    centre: { type: String, default: '' },
    sessionsList: [SessionSchema],
    milestones: [MilestoneSchema],
    symptomLog: [TherapySymptomSchema],
    practitionerNotes: { type: String, default: '' },
    therapySlots: [TherapySlotSchema],   // ← doctor-scheduled per-patient slots
}, { timestamps: true });

module.exports = mongoose.model('Therapy', TherapySchema);
