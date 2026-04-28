const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const DoctorSchedule = require('../models/DoctorSchedule');

/**
 * GET /api/doctor-schedule/:doctorId
 * Public — returns a doctor's schedule config so the slot picker & patient
 * booking flow can respect working hours, slot duration, and break times.
 * If no config exists yet, returns system defaults.
 */
router.get('/:doctorId', async (req, res) => {
    try {
        let schedule = await DoctorSchedule.findOne({ doctorId: req.params.doctorId });
        if (!schedule) {
            // Return defaults without persisting
            schedule = new DoctorSchedule({ doctorId: req.params.doctorId });
        }
        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/doctor-schedule
 * Protected — doctor fetches their OWN schedule config.
 */
router.get('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        let schedule = await DoctorSchedule.findOne({ doctorId: req.user.id });
        if (!schedule) {
            schedule = new DoctorSchedule({ doctorId: req.user.id });
            // Don't save – we return defaults until they explicitly save
        }
        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * PUT /api/doctor-schedule
 * Protected — doctor creates or updates their schedule config (upsert).
 */
router.put('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const {
            slotDuration,
            breakBetweenSlots,
            maxAppointmentsPerSlot,
            consultationFee,
            feeCurrency,
            qualifications,
            bio,
            languages,
            profileVisible,
            workingDays,
        } = req.body;

        // Validate slot duration
        const validDurations = [15, 20, 30, 45, 60, 90, 120];
        if (slotDuration && !validDurations.includes(Number(slotDuration))) {
            return res.status(400).json({
                success: false,
                message: `Invalid slotDuration. Must be one of: ${validDurations.join(', ')}`,
            });
        }

        // Validate break
        const validBreaks = [0, 5, 10, 15, 30];
        if (breakBetweenSlots !== undefined && !validBreaks.includes(Number(breakBetweenSlots))) {
            return res.status(400).json({
                success: false,
                message: `Invalid breakBetweenSlots. Must be one of: ${validBreaks.join(', ')}`,
            });
        }

        // Validate working days if provided
        if (workingDays && Array.isArray(workingDays)) {
            for (const day of workingDays) {
                if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
                    return res.status(400).json({ success: false, message: 'dayOfWeek must be 0-6' });
                }
                const startMins = (day.startHour || 0) * 60 + (day.startMinute || 0);
                const endMins   = (day.endHour   || 0) * 60 + (day.endMinute   || 0);
                if (endMins <= startMins) {
                    return res.status(400).json({
                        success: false,
                        message: `Working day ${day.dayOfWeek}: end time must be after start time`,
                    });
                }
            }
        }

        const updateData = {};
        if (slotDuration !== undefined)           updateData.slotDuration           = Number(slotDuration);
        if (breakBetweenSlots !== undefined)      updateData.breakBetweenSlots      = Number(breakBetweenSlots);
        if (maxAppointmentsPerSlot !== undefined) updateData.maxAppointmentsPerSlot = Number(maxAppointmentsPerSlot);
        if (consultationFee !== undefined)        updateData.consultationFee        = Number(consultationFee);
        if (feeCurrency !== undefined)            updateData.feeCurrency            = feeCurrency;
        if (qualifications !== undefined)         updateData.qualifications         = qualifications;
        if (bio !== undefined)                    updateData.bio                    = bio;
        if (languages !== undefined)              updateData.languages              = languages;
        if (profileVisible !== undefined)         updateData.profileVisible         = profileVisible;
        if (workingDays !== undefined)            updateData.workingDays            = workingDays;

        const schedule = await DoctorSchedule.findOneAndUpdate(
            { doctorId: req.user.id },
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        res.json({ success: true, data: schedule, message: 'Schedule updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
