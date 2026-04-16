const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Appointment  = require('../models/Appointment');
const DoctorBlock  = require('../models/DoctorBlock');
const { getTemplate } = require('../services/notificationService');
const { notifyPatient } = require('../utils/notifyPatient');


// GET /api/appointments — role-filtered
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patientId = req.user.id;
        else if (req.user.role === 'doctor') query.doctorId = req.user.id;
        const appointments = await Appointment.find(query).sort({ date: 1 });
        res.json({ success: true, data: appointments });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/appointments/slots — full slot grid (8AM-7PM) with booked/free status (30-min base slots)
router.get('/slots', protect, async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        const slotSize = parseInt(req.query.slotSize, 10) || 30; // default 30-min slots
        if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date required' });

        // ── Build day boundaries using LOCAL time ─────────────────────────────
        const [yr, mo, dy] = date.split('-').map(Number);
        const dayStart = new Date(yr, mo - 1, dy, 0, 0, 0, 0);     // local midnight
        const dayEnd   = new Date(yr, mo - 1, dy, 23, 59, 59, 999); // local 23:59

        const existing = await Appointment.find({
            doctorId,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] },
        }).select('date duration status type patientName _id');

        // Build busy windows (ms timestamps)
        const busyWindows = existing.map(a => ({
            id: a._id.toString(),
            start: new Date(a.date).getTime(),
            end:   new Date(a.date).getTime() + a.duration * 60000,
            label: `${a.type} \u2014 ${a.patientName}`,
            patientName: a.patientName,
            type:   a.type,
            status: a.status,
        }));

        // Fetch doctor unavailability blocks for this date
        const dayOfWeek = new Date(yr, mo - 1, dy).getDay();
        const activeBlocks = await DoctorBlock.find({
            doctorId,
            active: true,
            $or: [
                { isRecurring: false, date },
                { isRecurring: true,  dayOfWeek },
            ],
        });

        // Build 30-minute slot grid (8:00 AM – 6:30 PM → 22 slots)
        const WORK_START_H = 8;
        const WORK_END_H   = 19; // exclusive — last slot starts at 18:30
        const slots = [];

        for (let h = WORK_START_H; h < WORK_END_H; h++) {
            for (let m = 0; m < 60; m += slotSize) {
                // Don't generate a slot that starts at or after 19:00
                if (h === WORK_END_H - 1 && m + slotSize > 60) break;

                const slotStart   = new Date(yr, mo - 1, dy, h, m, 0, 0);
                const slotStartMs = slotStart.getTime();
                const slotEndMs   = slotStartMs + slotSize * 60000;

                // Check appointment overlap
                const overlap = busyWindows.find(w => slotStartMs < w.end && slotEndMs > w.start);

                // Check doctor block overlap
                const blocked = activeBlocks.find(b => {
                    const bStartMs = new Date(yr, mo-1, dy, b.startHour, b.startMinute, 0).getTime();
                    const bEndMs   = new Date(yr, mo-1, dy, b.endHour,   b.endMinute,   0).getTime();
                    return slotStartMs < bEndMs && slotEndMs > bStartMs;
                });

                slots.push({
                    time:    slotStart.toISOString(),
                    hour:    h,
                    minute:  m,
                    label:   `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
                    booked:       !!overlap || !!blocked,
                    blocked:      !!blocked,
                    blockReason:  blocked ? blocked.reason : null,
                    bookedBy:     overlap ? overlap.patientName : null,
                    bookedType:   overlap ? overlap.type        : null,
                    bookedStatus: overlap ? overlap.status      : null,
                    appointmentId: overlap ? overlap.id         : null,
                });
            }
        }

        // Legacy suggestions for backward compat
        const suggestions = slots.filter(s => !s.booked).map(s => s.time).slice(0, 5);

        res.json({ success: true, slots, busyWindows, suggestions, slotSize });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});


// POST /api/appointments — book appointment (atomic overlap check)
router.post('/', protect, async (req, res) => {
    try {
        const body = { ...req.body };
        if (req.user.role === 'patient') body.patientId = req.user.id;

        // ── True overlap conflict check ────────────────────────────────────────
        // A conflict exists when:  existing.start < newEnd  AND  existing.end > newStart
        // i.e.  existing.date < newEnd  AND  existing.date + existing.duration > newStart
        const { doctorId, date, duration = 60 } = body;
        if (doctorId && date) {
            const newStartMs = new Date(date).getTime();
            const newEndMs   = newStartMs + parseInt(duration) * 60000;

            const conflict = await Appointment.findOne({
                doctorId,
                status:  { $nin: ['cancelled'] },
                date:    { $lt: new Date(newEndMs) },          // existing starts before new ends
                $expr: {                                        // existing ends after new starts
                    $gt: [
                        { $add: [{ $toLong: '$date' }, { $multiply: ['$duration', 60000] }] },
                        newStartMs
                    ]
                }
            });

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: `Conflict: Doctor already has \u201c${conflict.type}\u201d from ${new Date(conflict.date).toLocaleTimeString()} for ${conflict.duration} min`,
                    conflict: { date: conflict.date, type: conflict.type, patientName: conflict.patientName },
                });
            }
        }

        // Auto-generate checklist
        body.checklistItems = [
            { label: 'Confirm appointment time with reception', done: false },
            { label: 'Read pre-procedure instructions',         done: false },
            { label: 'Arrange transport',                       done: false },
            { label: 'Fast if required (check with doctor)',   done: false },
        ];
        body.precautions = getTemplate(body.type, 'pre');
        body.postCare    = getTemplate(body.type, 'post');

        const appt = await Appointment.create(body);

        // Real-time: notify doctor room + broadcast global slots_updated
        const io = req.app.get('io');
        if (io && appt.doctorId) {
            io.to(`user_${appt.doctorId}`).emit('appointment_booked', {
                appointmentId: appt._id,
                patientName:   appt.patientName,
                type:          appt.type,
                date:          appt.date,
                duration:      appt.duration,
            });
            // All open slot pickers (doctor & patient) refresh automatically
            io.emit('slots_updated', {
                doctorId: appt.doctorId.toString(),
                date:     appt.date,
            });
        }

        // Notify patient
        let notifResult = {};
        if (appt.patientId) {
            notifResult = await notifyPatient({
                io,
                patientId:    appt.patientId,
                type:         'general',
                title:        `Appointment Scheduled: ${appt.type}`,
                message:      `Your ${appt.type} session is scheduled for ${new Date(appt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} with ${appt.doctorName}. Duration: ${appt.duration} min.`,
                appointmentId: appt._id,
                therapyType:  appt.type,
            });
        }

        res.status(201).json({ success: true, data: appt, notifResult });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/appointments/:id — update/reschedule
router.put('/:id', protect, async (req, res) => {
    try {
        const existing = await Appointment.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Appointment not found' });

        // Ownership check: patient can only update their own; doctor can only update their own
        if (req.user.role === 'patient' && existing.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment' });
        }
        if (req.user.role === 'doctor' && existing.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment' });
        }

        const update = { ...req.body };

        // ── Conflict check when rescheduling to a new date/time ──────────────
        if (req.body.date && new Date(req.body.date).getTime() !== new Date(existing.date).getTime()) {
            const newStartMs = new Date(req.body.date).getTime();
            const newDuration = parseInt(req.body.duration || existing.duration) * 60000;
            const newEndMs = newStartMs + newDuration;
            const rescheduleConflict = await Appointment.findOne({
                doctorId: existing.doctorId,
                status:   { $nin: ['cancelled'] },
                _id:      { $ne: req.params.id },   // exclude self
                date:     { $lt: new Date(newEndMs) },
                $expr:    {
                    $gt: [
                        { $add: [{ $toLong: '$date' }, { $multiply: ['$duration', 60000] }] },
                        newStartMs
                    ]
                }
            });
            if (rescheduleConflict) {
                return res.status(409).json({
                    success: false,
                    message: `Conflict: Doctor already has "${rescheduleConflict.type}" from ${new Date(rescheduleConflict.date).toLocaleTimeString()} for ${rescheduleConflict.duration} min`,
                    conflict: {
                        date:        rescheduleConflict.date,
                        type:        rescheduleConflict.type,
                        patientName: rescheduleConflict.patientName,
                    },
                });
            }
        }

        // Track reschedule history
        if (req.body.date && new Date(req.body.date).getTime() !== new Date(existing.date).getTime()) {
            update.$push = {
                rescheduleHistory: {
                    from:        existing.date,
                    to:          new Date(req.body.date),
                    reason:      req.body.rescheduleReason || '',
                    requestedBy: req.user.role === 'doctor' ? 'doctor' : 'patient',
                    requestedAt: new Date(),
                }
            };
            delete update.rescheduleReason;
        }

        const appt = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true });

        // Broadcast slot refresh
        const io = req.app.get('io');
        if (io && appt.doctorId) {
            io.emit('slots_updated', {
                doctorId: appt.doctorId.toString(),
                date:     appt.date,
            });
        }

        // Notify the other party
        let notifResult = {};
        const notifyUserId = req.user.role === 'doctor' ? appt.patientId : appt.doctorId;

        if (req.body.date) {
            notifResult = await notifyPatient({
                io,
                patientId:    notifyUserId,
                type:         'general',
                title:        'Appointment Rescheduled',
                message:      `Your ${appt.type} appointment has been rescheduled to ${new Date(appt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.`,
                appointmentId: appt._id,
                therapyType:  appt.type,
            });
        }
        if (req.body.status) {
            notifResult = await notifyPatient({
                io,
                patientId:    notifyUserId,
                type:         'general',
                title:        `Appointment ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}`,
                message:      `Your ${appt.type} appointment status has been updated to \u201c${req.body.status}\u201d.`,
                appointmentId: appt._id,
                therapyType:  appt.type,
            });
        }

        res.json({ success: true, data: appt, notifResult });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/appointments/:id/notes — practitioner saves session notes
router.post('/:id/notes', protect, async (req, res) => {
    try {
        const appt = await Appointment.findByIdAndUpdate(
            req.params.id,
            { sessionNotes: req.body.notes },
            { new: true }
        );
        if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: appt });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/appointments/:id/symptom-log — patient symptom submission
router.post('/:id/symptom-log', protect, async (req, res) => {
    try {
        const { symptoms, severity, notes } = req.body;
        const appt = await Appointment.findByIdAndUpdate(
            req.params.id,
            { $push: { symptomLog: { loggedAt: new Date(), symptoms, severity, notes } } },
            { new: true }
        );
        if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
        const io = req.app.get('io');
        if (io) io.to(`user_${appt.doctorId}`).emit('symptom_logged', { patientName: appt.patientName, severity, symptoms, appointmentId: appt._id });
        res.json({ success: true, data: appt });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/appointments/:id/checklist-item — patient marks checklist item done
router.put('/:id/checklist-item', protect, async (req, res) => {
    try {
        const { itemId, done } = req.body;
        const appt = await Appointment.findOneAndUpdate(
            { _id: req.params.id, 'checklistItems._id': itemId },
            { $set: { 'checklistItems.$.done': done } },
            { new: true }
        );
        if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: appt });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/appointments/bulk/delete — admin bulk-delete (MUST be ABOVE /:id to avoid shadowing)
router.delete('/bulk/delete', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
        const { status, before } = req.body;
        const filter = {};
        if (status) filter.status = { $in: Array.isArray(status) ? status : [status] };
        if (before)  filter.date  = { $lt: new Date(before) };
        if (Object.keys(filter).length === 0) return res.status(400).json({ success: false, message: 'Provide status or before date' });
        const result = await Appointment.deleteMany(filter);
        res.json({ success: true, message: `${result.deletedCount} appointment(s) deleted.`, deletedCount: result.deletedCount });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/appointments/:id — doctor/patient soft-cancel; admin = hard delete
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const appt = await Appointment.findByIdAndDelete(req.params.id);
            if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
            return res.json({ success: true, message: 'Appointment permanently deleted.' });
        }
        // Doctor / Patient: soft cancel
        const appt = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!appt) return res.status(404).json({ success: false, message: 'Not found' });

        // Broadcast so slot grids update immediately after cancellation
        const io = req.app.get('io');
        if (io && appt.doctorId) {
            io.emit('slots_updated', {
                doctorId: appt.doctorId.toString(),
                date:     appt.date,
            });
        }

        res.json({ success: true, message: 'Appointment cancelled' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
