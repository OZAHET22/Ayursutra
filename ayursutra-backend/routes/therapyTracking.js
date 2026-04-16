const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Therapy = require('../models/Therapy');
const Appointment = require('../models/Appointment');
const { notifyPatient } = require('../utils/notifyPatient');

// GET /api/tracking/therapies — get live therapy data for current user
router.get('/therapies', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patientId = req.user.id;
        else if (req.user.role === 'doctor') query.doctorId = req.user.id;
        const therapies = await Therapy.find(query).sort({ updatedAt: -1 });
        res.json({ success: true, data: therapies });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/tracking/milestone — add milestone to a therapy (Gap 4: notifyPatient)
router.post('/milestone', protect, async (req, res) => {
    try {
        const { therapyId, name, icon, description } = req.body;
        if (!therapyId || !name) return res.status(400).json({ success: false, message: 'therapyId and name are required' });
        const therapy = await Therapy.findByIdAndUpdate(
            therapyId,
            { $push: { milestones: { name, icon: icon || '🏆', description: description || '', achievedAt: new Date() } } },
            { new: true }
        );
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });

        // Gap 4: use notifyPatient instead of raw socket emit
        const io = req.app.get('io');
        const notifResult = await notifyPatient({
            io,
            patientId: therapy.patientId,
            type: 'general',
            title: `🏆 Milestone Achieved: ${name}`,
            message: `Congratulations! Your doctor has marked a new milestone in your ${therapy.name} therapy: "${name}". Keep up the great work!`,
            appointmentId: null,
            therapyType: therapy.type || '',
        });

        res.json({ success: true, data: therapy, notifResult });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/tracking/feedback — patient submits post-session symptom feedback
router.post('/feedback', protect, async (req, res) => {
    try {
        const { appointmentId, therapyId, symptoms, severity, notes } = req.body;
        const logEntry = { loggedAt: new Date(), symptoms: symptoms || '', severity: severity || 'mild', notes: notes || '' };

        if (appointmentId) {
            await Appointment.findByIdAndUpdate(
                appointmentId,
                { $push: { symptomLog: logEntry } },
                { new: true }
            );
        }
        if (therapyId) {
            await Therapy.findByIdAndUpdate(
                therapyId,
                { $push: { symptomLog: { ...logEntry, sessionRef: appointmentId || null } } },
                { new: true }
            );
        }

        // Notify doctor via socket (real-time symptom alert)
        if (appointmentId) {
            const appt = await Appointment.findById(appointmentId);
            if (appt) {
                const io = req.app.get('io');
                if (io) io.to(`user_${appt.doctorId}`).emit('symptom_logged', {
                    patientName: appt.patientName,
                    appointmentId,
                    severity,
                    symptoms,
                });
            }
        }

        res.json({ success: true, message: 'Feedback submitted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/tracking/practitioner-notes/:therapyId — doctor updates practitioner notes
router.put('/practitioner-notes/:therapyId', protect, async (req, res) => {
    try {
        const therapy = await Therapy.findByIdAndUpdate(
            req.params.therapyId,
            { practitionerNotes: req.body.notes },
            { new: true }
        );
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });
        res.json({ success: true, data: therapy });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/tracking/session/:appointmentId — live session status
router.get('/session/:appointmentId', protect, async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.appointmentId);
        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
        const now = new Date();
        const sessionStart = new Date(appt.date);
        const sessionEnd = new Date(sessionStart.getTime() + appt.duration * 60000);
        let liveStatus = 'upcoming';
        if (appt.status === 'completed') liveStatus = 'completed';
        else if (appt.status === 'cancelled') liveStatus = 'cancelled';
        else if (now >= sessionStart && now <= sessionEnd) liveStatus = 'in_progress';
        else if (now > sessionEnd) liveStatus = 'overdue';
        res.json({ success: true, data: { appointment: appt, liveStatus, sessionStart, sessionEnd } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GAP 2: PATCH /api/tracking/:therapyId/symptom-action
// Doctor flags a symptom + chooses action (postpone / add_recovery / update_post_care / no_change)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:therapyId/symptom-action', protect, async (req, res) => {
    try {
        const { therapyId } = req.params;
        const { symptomId, action, doctorNote, appointmentId } = req.body;

        if (!symptomId || !action) {
            return res.status(400).json({ success: false, message: 'symptomId and action are required' });
        }

        const therapy = await Therapy.findById(therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });

        const symptomEntry = therapy.symptomLog.id(symptomId);
        if (!symptomEntry) return res.status(404).json({ success: false, message: 'Symptom entry not found' });

        // ── Save doctor action on the symptom entry ────────────────────────────
        symptomEntry.doctorAction = {
            action,
            note: doctorNote || '',
            timestamp: new Date(),
        };
        // Also mirror on the Appointment symptomLog if appointmentId provided
        if (appointmentId) {
            await Appointment.findOneAndUpdate(
                { _id: appointmentId, 'symptomLog._id': symptomId },
                { $set: { 'symptomLog.$.doctorAction': { action, note: doctorNote || '', timestamp: new Date() } } }
            );
        }

        const io = req.app.get('io');
        let notifResult = {};

        if (action === 'postpone_session') {
            // ── Find next scheduled appointment for this therapy patient+doctor ──
            const nextAppt = await Appointment.findOne({
                patientId: therapy.patientId,
                doctorId: therapy.doctorId,
                status: { $in: ['pending', 'confirmed'] },
                date: { $gt: new Date() },
            }).sort({ date: 1 });

            if (nextAppt) {
                // Compute new date: +1 day from current appointment date
                const newDate = new Date(nextAppt.date.getTime() + 24 * 60 * 60 * 1000);

                // Check conflict using busyWindows logic (same as Schedule tab)
                const dayStart = new Date(newDate); dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(newDate); dayEnd.setHours(23, 59, 59, 999);
                const existingAppts = await Appointment.find({
                    doctorId: therapy.doctorId,
                    date: { $gte: dayStart, $lte: dayEnd },
                    status: { $nin: ['cancelled'] },
                    _id: { $ne: nextAppt._id },
                });
                const busyWindows = existingAppts.map(a => ({
                    start: new Date(a.date).getTime(),
                    end: new Date(a.date).getTime() + a.duration * 60000,
                }));
                const startMs = newDate.getTime();
                const endMs = startMs + nextAppt.duration * 60000;
                const conflict = busyWindows.find(w => w.start < endMs && startMs < w.end);

                if (!conflict) {
                    await Appointment.findByIdAndUpdate(nextAppt._id, {
                        date: newDate,
                        $push: {
                            rescheduleHistory: {
                                from: nextAppt.date,
                                to: newDate,
                                reason: `Doctor flagged symptom: ${symptomEntry.symptoms}`,
                                requestedBy: 'doctor',
                                requestedAt: new Date(),
                            }
                        }
                    });
                    notifResult = await notifyPatient({
                        io,
                        patientId: therapy.patientId,
                        type: 'general',
                        title: 'Session Rescheduled Due to Symptoms',
                        message: `Your next ${nextAppt.type} session has been adjusted due to reported symptoms. New date: ${newDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.`,
                        appointmentId: nextAppt._id,
                        therapyType: therapy.type || '',
                    });
                } else {
                    // Conflict found — still save the note but don't auto-reschedule
                    console.warn('[Gap2] Postpone conflict — doctor must reschedule manually');
                }
            }

        } else if (action === 'update_post_care') {
            // ── Update postCare on the linked appointment and re-send reminder ──
            if (appointmentId) {
                await Appointment.findByIdAndUpdate(appointmentId, { postCare: doctorNote });
                notifResult = await notifyPatient({
                    io,
                    patientId: therapy.patientId,
                    type: 'post_session',
                    title: `Updated Post-Care: ${therapy.name}`,
                    message: `Your doctor has updated your post-care instructions: ${doctorNote}`,
                    appointmentId,
                    therapyType: therapy.type || '',
                });
            }
        }
        // add_recovery_day and no_change: only save note, no extra actions needed

        await therapy.save();
        res.json({ success: true, data: therapy, notifResult });
    } catch (err) {
        console.error('[Gap2] symptom-action error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GAP 3: GET /api/tracking/:therapyId/progress-data
// Returns aggregated session + symptom trend data for charts
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:therapyId/progress-data', protect, async (req, res) => {
    try {
        const therapy = await Therapy.findById(req.params.therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });

        const SEV_SCORE = { mild: 1, moderate: 2, severe: 3 };

        // Build symptom trend from therapy.symptomLog
        const symptomTrend = (therapy.symptomLog || []).map(s => ({
            date: s.loggedAt ? new Date(s.loggedAt).toISOString().slice(0, 10) : null,
            severity: s.severity,
            severityScore: SEV_SCORE[s.severity] || 0,
            symptomText: s.symptoms,
        })).filter(s => s.date).sort((a, b) => a.date.localeCompare(b.date));

        // Build session trend from sessionsList (if present) OR synthesise from completed count
        let sessionTrend = [];
        if (therapy.sessionsList && therapy.sessionsList.length > 0) {
            sessionTrend = therapy.sessionsList.map((s, i) => ({
                sessionNumber: i + 1,
                date: s.date ? new Date(s.date).toISOString().slice(0, 10) : null,
                status: s.status,
                severityScore: 0, // will be joined with symptom data below
            }));
            // Try to join severity on matching date
            sessionTrend = sessionTrend.map(sess => {
                const matchingSymptom = symptomTrend.find(st => st.date === sess.date);
                return { ...sess, severityScore: matchingSymptom ? matchingSymptom.severityScore : 0 };
            });
        } else {
            // Synthesise session trend from completed sessions count
            for (let i = 1; i <= Math.max(therapy.completed || 0, symptomTrend.length); i++) {
                const matchingSymptom = symptomTrend[i - 1];
                sessionTrend.push({
                    sessionNumber: i,
                    date: matchingSymptom?.date || null,
                    status: i <= (therapy.completed || 0) ? 'completed' : 'scheduled',
                    severityScore: matchingSymptom?.severityScore || 0,
                });
            }
        }

        const overallProgress = therapy.sessions > 0
            ? Math.round(((therapy.completed || 0) / therapy.sessions) * 100)
            : therapy.progress || 0;

        res.json({
            success: true,
            data: {
                sessionTrend,
                symptomTrend,
                overallProgress,
                milestoneCount: (therapy.milestones || []).length,
                totalSessions: therapy.sessions || 0,
                completedSessions: therapy.completed || 0,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tracking/therapy-slots/:therapyId
// Returns all scheduled therapy slots for a patient (visible to BOTH doctor and patient)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/therapy-slots/:therapyId', protect, async (req, res) => {
    try {
        const therapy = await Therapy.findById(req.params.therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });

        // Access check: only the assigned doctor or the patient can view
        const userId = req.user.id;
        const isDoctor = req.user.role === 'doctor' && therapy.doctorId?.toString() === userId;
        const isPatient = req.user.role === 'patient' && therapy.patientId?.toString() === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isDoctor && !isPatient && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorised to view these slots.' });
        }

        res.json({ success: true, data: therapy.therapySlots || [] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tracking/therapy-slots/:therapyId
// Doctor adds or replaces per-patient therapy session slots
// Body: { slots: [{ date, time, duration, notes }] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/therapy-slots/:therapyId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only doctors can schedule therapy slots.' });
        }

        const { slots } = req.body; // array of { date, time, duration, notes, slotIndex }
        if (!Array.isArray(slots)) {
            return res.status(400).json({ success: false, message: 'slots must be an array.' });
        }

        const therapy = await Therapy.findById(req.params.therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });

        // Build new slots with status defaults
        const newSlots = slots.map((s, i) => ({
            slotIndex: s.slotIndex ?? i + 1,
            date: s.date,
            time: s.time,
            duration: s.duration || 60,
            notes: s.notes || '',
            status: s.status || 'scheduled',
            scheduledAt: new Date(),
        }));

        therapy.therapySlots = newSlots;
        await therapy.save();

        // Notify patient that their therapy schedule is updated
        const io = req.app.get('io');
        // Real-time: push slot update to patient's socket room
        if (io && therapy.patientId) {
            io.to(`user_${therapy.patientId}`).emit('therapy_slots_updated', {
                therapyId: therapy._id.toString(),
                therapyName: therapy.name,
                slotCount: newSlots.length,
            });
        }
        await notifyPatient({
            io,
            patientId: therapy.patientId,
            type: 'general',
            title: `📅 Therapy Slots Updated: ${therapy.name}`,
            message: `Dr. ${therapy.doctorName} has scheduled ${newSlots.length} session slot(s) for your ${therapy.name} therapy. Check your Therapy Tracking tab for details.`,
            appointmentId: null,
            therapyType: therapy.type || '',
        });

        res.json({ success: true, data: therapy.therapySlots });
    } catch (err) {
        console.error('[therapy-slots POST]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tracking/therapy-slots/:therapyId/:slotIndex
// Doctor updates the status of a specific slot (completed / missed / rescheduled)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/therapy-slots/:therapyId/:slotIndex', protect, async (req, res) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only doctors can update slot status.' });
        }

        const { status, notes } = req.body;
        const slotIdx = parseInt(req.params.slotIndex, 10);

        const therapy = await Therapy.findById(req.params.therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });

        const slot = (therapy.therapySlots || []).find(s => s.slotIndex === slotIdx);
        if (!slot) return res.status(404).json({ success: false, message: `Slot ${slotIdx} not found` });

        if (status) slot.status = status;
        if (notes !== undefined) slot.notes = notes;

        // If marking completed, auto-increment therapy progress
        if (status === 'completed') {
            const completedSlots = therapy.therapySlots.filter(s => s.status === 'completed').length;
            therapy.completed = completedSlots;
            therapy.progress = therapy.sessions > 0
                ? Math.min(100, Math.round((completedSlots / therapy.sessions) * 100))
                : therapy.progress;
            if (therapy.progress >= 100) therapy.status = 'completed';
            else if (therapy.status !== 'active') therapy.status = 'active';
        }

        await therapy.save();

        // Notify patient of the update
        const io = req.app.get('io');
        // Real-time: push slot status change to patient's socket room
        if (io && therapy.patientId) {
            io.to(`user_${therapy.patientId}`).emit('therapy_slots_updated', {
                therapyId: therapy._id.toString(),
                therapyName: therapy.name,
                slotIndex: slotIdx,
                slotStatus: status,
            });
        }
        if (status === 'completed' || status === 'missed') {
            await notifyPatient({
                io,
                patientId: therapy.patientId,
                type: 'general',
                title: `Session ${status === 'completed' ? '✅ Completed' : '⚠️ Missed'}: ${therapy.name}`,
                message: status === 'completed'
                    ? `Session ${slotIdx} of your ${therapy.name} therapy has been marked complete. Progress: ${therapy.progress}%.`
                    : `Session ${slotIdx} of your ${therapy.name} was marked missed. Please contact your doctor to reschedule.`,
                appointmentId: null,
                therapyType: therapy.type || '',
            });
        }

        res.json({ success: true, data: { slot, progress: therapy.progress, completed: therapy.completed } });
    } catch (err) {
        console.error('[therapy-slots PATCH]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
