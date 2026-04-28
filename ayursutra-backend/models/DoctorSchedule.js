const mongoose = require('mongoose');

/**
 * DoctorSchedule — stores a doctor's custom time-management configuration.
 * Controls slot generation: duration, breaks, working hours per day, etc.
 */

const WorkingDaySchema = new mongoose.Schema({
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 6=Sat
    enabled:   { type: Boolean, default: true },
    startHour: { type: Number, default: 9,  min: 0, max: 23 },
    startMinute: { type: Number, default: 0, min: 0, max: 59 },
    endHour:   { type: Number, default: 17, min: 0, max: 23 },
    endMinute: { type: Number, default: 0,  min: 0, max: 59 },
}, { _id: false });

const DoctorScheduleSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },

    // Slot configuration
    slotDuration: {
        type: Number,
        enum: [15, 20, 30, 45, 60, 90, 120],
        default: 30,
    },
    breakBetweenSlots: {
        type: Number,
        enum: [0, 5, 10, 15, 30],
        default: 0,
    },
    maxAppointmentsPerSlot: {
        type: Number,
        default: 1,
        min: 1,
        max: 10,
    },

    // Consultation fee (shown on doctor profile)
    consultationFee: { type: Number, default: 0 },
    feeCurrency:     { type: String, default: 'INR' },

    // Doctor's bio/profile extras (visible to patients)
    qualifications: { type: String, default: '' },
    bio:            { type: String, default: '' },
    languages:      { type: [String], default: ['English'] },
    profileVisible: { type: Boolean, default: true },

    // Per-day working hours (7 entries: Sun-Sat)
    workingDays: {
        type: [WorkingDaySchema],
        default: () => [
            { dayOfWeek: 0, enabled: false, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
            { dayOfWeek: 1, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
            { dayOfWeek: 2, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
            { dayOfWeek: 3, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
            { dayOfWeek: 4, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
            { dayOfWeek: 5, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
            { dayOfWeek: 6, enabled: false, startHour: 9, startMinute: 0, endHour: 14, endMinute: 0 },
        ],
    },
}, { timestamps: true });

// NOTE: doctorId already has { unique: true } on the field — do NOT add schema.index() here too.
// Doing both causes the Mongoose "Duplicate schema index" warning on startup.

module.exports = mongoose.model('DoctorSchedule', DoctorScheduleSchema);
