const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const Appointment    = require('../models/Appointment');
const DoctorBlock    = require('../models/DoctorBlock');
const DoctorSchedule = require('../models/DoctorSchedule');
const User           = require('../models/User');
const { getTemplate, sendEmail } = require('../services/notificationService');
const { notifyPatient } = require('../utils/notifyPatient');

// ─── Email helper: send appointment confirmation to patient + notification to doctor ───
const sendAppointmentEmails = async (appt) => {
    try {
        const [patient, doctor] = await Promise.all([
            User.findById(appt.patientId).select('email name phone age'),
            User.findById(appt.doctorId).select('email name speciality'),
        ]);

        const dateStr = new Date(appt.date).toLocaleString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
        const refId = appt._id.toString().slice(-8).toUpperCase();

        // ── Email to Patient ───────────────────────────────────────────────────
        if (patient?.email) {
            const patientHtml = `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#2a7d2e,#4caf50);padding:28px 32px;text-align:center">
    <div style="font-size:36px;margin-bottom:8px">🌿</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Appointment Confirmed!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0">Ayursutra Wellness Platform</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#374151;font-size:15px">Dear <strong>${patient.name}</strong>,</p>
    <p style="color:#6b7280;font-size:14px">Your appointment has been successfully booked. Here are your details:</p>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">🔖 Booking Reference</td><td style="padding:8px 0;font-weight:700;color:#1f2937;font-size:14px">#${refId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">👨‍⚕️ Doctor</td><td style="padding:8px 0;font-weight:600;color:#1f2937;font-size:14px">Dr. ${appt.doctorName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">🏥 Specialization</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${doctor?.speciality || 'Ayurvedic Physician'}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">🌿 Therapy</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${appt.type}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">📅 Date & Time</td><td style="padding:8px 0;font-weight:600;color:#2a7d2e;font-size:14px">${dateStr}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">⏱ Duration</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${appt.duration} minutes</td></tr>
        ${appt.centre ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">📍 Centre</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${appt.centre}</td></tr>` : ''}
      </table>
    </div>
    ${appt.precautions ? `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:16px"><p style="margin:0;color:#92400e;font-size:13px"><strong>⚠️ Pre-Procedure Instructions:</strong><br/>${appt.precautions}</p></div>` : ''}
    <p style="color:#6b7280;font-size:12px;margin-top:24px">Please keep this reference ID handy. For any changes, log in to your Ayursutra patient dashboard.</p>
  </div>
  <div style="background:#f3f4f6;padding:16px 32px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} Ayursutra Wellness Platform · This is an automated email</p>
  </div>
</div>`;
            await sendEmail(patient.email, `✅ Appointment Confirmed — Ref #${refId} | Ayursutra`, patientHtml);
        }

        // ── Email to Doctor ────────────────────────────────────────────────────
        if (doctor?.email) {
            const doctorHtml = `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#1a5276,#2980b9);padding:28px 32px;text-align:center">
    <div style="font-size:36px;margin-bottom:8px">📋</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">New Appointment Booked</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0">Ayursutra — Doctor Notification</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#374151;font-size:15px">Dear <strong>Dr. ${doctor.name}</strong>,</p>
    <p style="color:#6b7280;font-size:14px">A new appointment has been booked with you. Here are the patient details:</p>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%">🔖 Appointment ID</td><td style="padding:8px 0;font-weight:700;color:#1f2937;font-size:14px">#${refId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">👤 Patient</td><td style="padding:8px 0;font-weight:600;color:#1f2937;font-size:14px">${appt.patientName}</td></tr>
        ${patient?.age ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">🎂 Age</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${patient.age} years</td></tr>` : ''}
        ${patient?.phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">📞 Contact</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${patient.phone}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">🌿 Therapy</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${appt.type}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">📅 Date & Time</td><td style="padding:8px 0;font-weight:600;color:#1a5276;font-size:14px">${dateStr}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">⏱ Duration</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${appt.duration} minutes</td></tr>
        ${appt.notes ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">📝 Notes</td><td style="padding:8px 0;color:#1f2937;font-size:14px">${appt.notes}</td></tr>` : ''}
      </table>
    </div>
    <p style="color:#6b7280;font-size:12px;margin-top:24px">View full details and manage appointments from your Ayursutra Doctor Dashboard.</p>
  </div>
  <div style="background:#f3f4f6;padding:16px 32px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} Ayursutra Wellness Platform · This is an automated email</p>
  </div>
</div>`;
            await sendEmail(doctor.email, `📋 New Appointment: ${appt.patientName} — ${dateStr} | Ayursutra`, doctorHtml);
        }
    } catch (emailErr) {
        console.error('[Appointment Email] Error sending emails:', emailErr.message);
        // Non-blocking — booking already succeeded
    }
};


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

// GET /api/appointments/slots — full slot grid with booked/free/past status
// Respects DoctorSchedule config: working hours, slot duration, break times
// Past slots (before current time) are marked as expired — not bookable
router.get('/slots', protect, async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date required' });

        // ── Load doctor schedule config ───────────────────────────────────────
        const scheduleConfig     = await DoctorSchedule.findOne({ doctorId });
        const slotDuration       = scheduleConfig?.slotDuration        || 30;
        const breakBetweenSlots  = scheduleConfig?.breakBetweenSlots   || 0;
        const maxPerSlot         = scheduleConfig?.maxAppointmentsPerSlot || 1;
        const workingDays        = scheduleConfig?.workingDays;

        // ── Build day boundaries using LOCAL time ─────────────────────────────
        const [yr, mo, dy] = date.split('-').map(Number);
        const dayStart = new Date(yr, mo - 1, dy, 0, 0, 0, 0);
        const dayEnd   = new Date(yr, mo - 1, dy, 23, 59, 59, 999);

        // ── Determine working hours for this day of week ─────────────────────
        const dayOfWeek = new Date(yr, mo - 1, dy).getDay();
        let workStart  = { hour: 8,  minute: 0 };
        let workEnd    = { hour: 19, minute: 0 };
        let dayEnabled = true;

        if (workingDays && workingDays.length > 0) {
            const dayConfig = workingDays.find(d => d.dayOfWeek === dayOfWeek);
            if (dayConfig) {
                dayEnabled = dayConfig.enabled !== false;
                workStart  = { hour: dayConfig.startHour || 9,  minute: dayConfig.startMinute || 0 };
                workEnd    = { hour: dayConfig.endHour   || 17, minute: dayConfig.endMinute   || 0 };
            }
        }

        if (!dayEnabled) {
            return res.json({ success: true, slots: [], busyWindows: [], suggestions: [], slotDuration, dayOff: true });
        }

        // ── Fetch existing appointments ───────────────────────────────────────
        const existing = await Appointment.find({
            doctorId,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] },
        }).select('date duration status type patientName _id');

        const busyWindows = existing.map(a => ({
            id:          a._id.toString(),
            start:       new Date(a.date).getTime(),
            end:         new Date(a.date).getTime() + a.duration * 60000,
            label:       `${a.type} \u2014 ${a.patientName}`,
            patientName: a.patientName,
            type:        a.type,
            status:      a.status,
        }));

        // ── Fetch doctor unavailability blocks ───────────────────────────────
        const activeBlocks = await DoctorBlock.find({
            doctorId,
            active: true,
            $or: [
                { isRecurring: false, date },
                { isRecurring: true,  dayOfWeek },
            ],
        });

        // ── Current time for past-slot filtering ─────────────────────────────
        const nowMs = Date.now();

        // ── Build slot grid ───────────────────────────────────────────────────
        const slots        = [];
        const startMins    = workStart.hour * 60 + workStart.minute;
        const endMins      = workEnd.hour   * 60 + workEnd.minute;
        const stepMins     = slotDuration + breakBetweenSlots;

        for (let mins = startMins; mins + slotDuration <= endMins; mins += stepMins) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;

            const slotStart   = new Date(yr, mo - 1, dy, h, m, 0, 0);
            const slotStartMs = slotStart.getTime();
            const slotEndMs   = slotStartMs + slotDuration * 60000;

            // Past-slot check — slot start is at or before current time
            const isPast = slotStartMs <= nowMs;

            // Appointment overlap
            const overlaps    = busyWindows.filter(w => slotStartMs < w.end && slotEndMs > w.start);
            const overlap     = overlaps[0] || null;
            const isBooked    = overlaps.length >= maxPerSlot || !!overlap;

            // Block overlap
            const blocked = activeBlocks.find(b => {
                const bStartMs = new Date(yr, mo-1, dy, b.startHour, b.startMinute, 0).getTime();
                const bEndMs   = new Date(yr, mo-1, dy, b.endHour,   b.endMinute,   0).getTime();
                return slotStartMs < bEndMs && slotEndMs > bStartMs;
            });

            slots.push({
                time:          slotStart.toISOString(),
                hour:          h,
                minute:        m,
                label:         `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
                booked:        isPast || isBooked || !!blocked,
                blocked:       !!blocked,
                isPast,
                blockReason:   blocked ? blocked.reason : (isPast ? 'Time has passed' : null),
                bookedBy:      overlap ? overlap.patientName : null,
                bookedType:    overlap ? overlap.type        : null,
                bookedStatus:  overlap ? overlap.status      : null,
                appointmentId: overlap ? overlap.id          : null,
                slotDuration,
            });
        }

        const suggestions = slots.filter(s => !s.booked).map(s => s.time).slice(0, 5);
        res.json({ success: true, slots, busyWindows, suggestions, slotDuration, breakBetweenSlots });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});


// POST /api/appointments — book appointment (with conflict checking)
router.post('/', protect, async (req, res) => {
    try {
        const body = { ...req.body };
        if (req.user.role === 'patient') body.patientId = req.user.id;

        // ── CRITICAL FIX: Validate appointment duration ─────────────────────────
        let duration = parseInt(body.duration) || 60;
        if (duration < 15 || duration > 480) {
            // Duration must be between 15 minutes and 8 hours
            return res.status(400).json({
                success: false,
                message: 'Appointment duration must be between 15 and 480 minutes (15 min to 8 hours).'
            });
        }
        body.duration = duration;

        // ── Validate required fields ──────────────────────────────────────────
        if (!body.patientId || !body.doctorId || !body.date || !body.patientName || !body.doctorName || !body.type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: patientId, doctorId, date, patientName, doctorName, type'
            });
        }

        // ── REAL-TIME VALIDATION: Reject past-time bookings ──────────────────
        // Server time is authoritative — prevents bypassing the frontend check
        const appointmentTime = new Date(body.date).getTime();
        if (appointmentTime <= Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot book a slot that has already passed. Please select a future time slot.',
                code: 'SLOT_IN_PAST',
            });
        }

        // ── True overlap conflict check ────────────────────────────────────────
        const { doctorId, date } = body;
        if (doctorId && date) {
            const newStartMs = new Date(date).getTime();
            const newEndMs   = newStartMs + duration * 60000;

            const conflict = await Appointment.findOne({
                doctorId,
                status:  { $nin: ['cancelled'] },
                date:    { $lt: new Date(newEndMs) },
                $expr: {
                    $gt: [
                        { $add: [{ $toLong: '$date' }, { $multiply: ['$duration', 60000] }] },
                        newStartMs
                    ]
                }
            });

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: `Conflict: Doctor already has "${conflict.type}" from ${new Date(conflict.date).toLocaleTimeString()} for ${conflict.duration} min`,
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

        // Create appointment
        const appointmentData = await Appointment.create(body);

        // Real-time: notify doctor room + broadcast global slots_updated
        const io = req.app.get('io');
        if (io && appointmentData.doctorId) {
            io.to(`user_${appointmentData.doctorId}`).emit('appointment_booked', {
                appointmentId: appointmentData._id,
                patientName:   appointmentData.patientName,
                type:          appointmentData.type,
                date:          appointmentData.date,
                duration:      appointmentData.duration,
            });
            // All open slot pickers (doctor & patient) refresh automatically
            io.emit('slots_updated', {
                doctorId: appointmentData.doctorId.toString(),
                date:     appointmentData.date,
            });
        }

        // Notify patient (in-app)
        let notifResult = {};
        if (appointmentData.patientId) {
            notifResult = await notifyPatient({
                io,
                patientId:    appointmentData.patientId,
                type:         'general',
                title:        `Appointment Scheduled: ${appointmentData.type}`,
                message:      `Your ${appointmentData.type} session is scheduled for ${new Date(appointmentData.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} with ${appointmentData.doctorName}. Duration: ${appointmentData.duration} min.`,
                appointmentId: appointmentData._id,
                therapyType:  appointmentData.type,
            });
        }

        // Send confirmation emails to both patient and doctor (async, non-blocking)
        sendAppointmentEmails(appointmentData);

        res.status(201).json({ success: true, data: appointmentData, notifResult });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
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

        // ── CRITICAL FIX: Validate duration if being changed ───────────────────
        if (update.duration) {
            const duration = parseInt(update.duration);
            if (duration < 15 || duration > 480) {
                return res.status(400).json({
                    success: false,
                    message: 'Appointment duration must be between 15 and 480 minutes (15 min to 8 hours).'
                });
            }
        }

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
            
            // CRITICAL FIX: Clear post-care reminder flag when rescheduled
            // Otherwise, the old reminder won't fire on the new date
            update.postCareReminderSent = false;
            // Also clear pre-appointment notifications flag so patient gets new reminder
            update.notificationsScheduled = false;
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
        
        // CRITICAL FIX: Validate severity enum
        const VALID_SEVERITIES = ['mild', 'moderate', 'severe'];
        if (!severity || !VALID_SEVERITIES.includes(severity.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid severity: "${severity}". Must be one of: ${VALID_SEVERITIES.join(', ')}`
            });
        }
        
        // Validate symptoms is array or string
        if (!symptoms || (typeof symptoms !== 'string' && !Array.isArray(symptoms))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid symptoms: must be string or array'
            });
        }
        
        const appt = await Appointment.findByIdAndUpdate(
            req.params.id,
            { $push: { symptomLog: { loggedAt: new Date(), symptoms, severity: severity.toLowerCase(), notes } } },
            { new: true }
        );
        if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
        const io = req.app.get('io');
        if (io) io.to(`user_${appt.doctorId}`).emit('symptom_logged', { patientName: appt.patientName, severity: severity.toLowerCase(), symptoms, appointmentId: appt._id });
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

// DELETE /api/appointments/bulk/delete — admin bulk-delete with safeguards (MUST be ABOVE /:id)
router.delete('/bulk/delete', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
        
        const { status, before, dryRun = true, confirmed = false } = req.body;
        
        // ── Build filter ──
        const filter = {};
        if (status) filter.status = { $in: Array.isArray(status) ? status : [status] };
        if (before)  filter.date  = { $lt: new Date(before) };
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({ success: false, message: 'Provide status or before date' });
        }

        // ── Safety Check: Count matches first ──
        const count = await Appointment.countDocuments(filter);
        const MAX_RECORDS = 100;
        if (count > MAX_RECORDS) {
            return res.status(400).json({
                success: false,
                message: `Too many records (${count}). Max ${MAX_RECORDS} per request. Please use smaller date ranges.`,
                matchedCount: count
            });
        }

        // ── Dry-run mode: just show what would be deleted ──
        if (dryRun) {
            const sample = await Appointment.find(filter).select('_id date type patientName status').limit(10);
            return res.json({
                success: true,
                message: `DRY RUN: Would delete ${count} appointment(s). Send confirmed=true to proceed.`,
                matchedCount: count,
                sample: sample,
                dryRun: true
            });
        }

        // ── Require explicit confirmation ──
        if (!confirmed) {
            return res.status(400).json({
                success: false,
                message: 'Must set confirmed=true to actually delete records.',
                matchedCount: count,
                requiresConfirmation: true
            });
        }

        // ── CRITICAL FIX: Use soft-delete (status='cancelled') instead of hard-delete ──
        // This preserves appointment history and allows recovery
        const result = await Appointment.updateMany(filter, { $set: { status: 'cancelled' } });
        
        // ── Emit socket notification to affected doctors ──
        const cancelledAppts = await Appointment.find({ ...filter, status: 'cancelled' }).select('doctorId').limit(50);
        const io = req.app.get('io');
        if (io && cancelledAppts.length > 0) {
            const doctorIds = [...new Set(cancelledAppts.map(a => a.doctorId.toString()))];
            doctorIds.forEach(doctorId => {
                io.to(`user_${doctorId}`).emit('slots_updated', { doctorId });
            });
        }

        res.json({
            success: true,
            message: `${result.modifiedCount} appointment(s) marked as cancelled (soft-delete).`,
            modifiedCount: result.modifiedCount,
            confirmed: true
        });
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
