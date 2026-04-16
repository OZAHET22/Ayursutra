const mongoose = require('mongoose');

/**
 * DoctorBlock — a time range where the doctor is unavailable.
 * Can be one-time (date-specific) or recurring (every week on dayOfWeek).
 */
const DoctorBlockSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // One-time block: set date
    date: { type: String, default: null },  // 'YYYY-MM-DD', null if recurring

    // Recurring block: set dayOfWeek (0=Sun … 6=Sat), null if one-time
    isRecurring: { type: Boolean, default: false },
    dayOfWeek:   { type: Number, default: null },  // 0–6

    startHour:   { type: Number, required: true },  // 0–23
    startMinute: { type: Number, default: 0 },       // 0 or 30
    endHour:     { type: Number, required: true },
    endMinute:   { type: Number, default: 0 },

    reason: { type: String, default: 'Unavailable' }, // e.g. 'Lunch Break', 'Meeting'
    active: { type: Boolean, default: true },
}, { timestamps: true });

DoctorBlockSchema.index({ doctorId: 1, date: 1 });
DoctorBlockSchema.index({ doctorId: 1, isRecurring: 1, dayOfWeek: 1 });

module.exports = mongoose.model('DoctorBlock', DoctorBlockSchema);
