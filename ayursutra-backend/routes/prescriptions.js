const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const User         = require('../models/User');
const Appointment  = require('../models/Appointment');

// ─── helpers ──────────────────────────────────────────────────────────────────
/**
 * Fire an in-app + optional email notification to the patient.
 * Silently swallows errors so a notification failure never breaks the response.
 */
async function notifyPatient(io, patient, title, message, prescriptionId) {
    try {
        const { createInApp, emitToUser, sendEmail } = require('../services/notificationService');

        // In-app
        const notif = await createInApp(
            patient._id,
            null,           // no appointmentId
            'general',
            title,
            message,
            ''
        );
        if (notif && io) {
            emitToUser(io, patient._id.toString(), 'new_notification', {
                _id: notif._id, title, message, type: 'general',
                createdAt: notif.createdAt,
            });
        }

        // Prescription-specific socket event (real-time dashboard update)
        if (io) {
            io.to(`user_${patient._id}`).emit('prescription_updated', {
                prescriptionId: prescriptionId.toString(),
                title,
                message,
            });
        }

        // Email (best-effort)
        if (patient.email && process.env.SMTP_USER && !process.env.SMTP_USER.startsWith('your')) {
            const html = `
<div style="font-family:'Segoe UI',sans-serif;padding:28px;background:#f9f9f9;border-radius:10px;max-width:580px;margin:auto;">
  <h2 style="color:#2a7d2e;margin-bottom:4px;">🌿 Ayursutra — ${title}</h2>
  <p style="color:#555;font-size:14px;">${message}</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:18px 0;"/>
  <small style="color:#aaa;">Ayursutra Wellness Platform · ${new Date().toLocaleDateString('en-IN')}</small>
</div>`;
            sendEmail(patient.email, `Ayursutra: ${title}`, html).catch(() => {});
        }
    } catch (err) {
        console.error('[Prescription] Notification error:', err.message);
    }
}

// ─── GET /api/prescriptions ────────────────────────────────────────────────────
// Doctor: all their prescriptions (optionally filter by patientId, status)
// Patient: only their own prescriptions (strict isolation)
router.get('/', protect, async (req, res) => {
    try {
        const query = {};

        if (req.user.role === 'patient') {
            query.patientId = req.user.id;
        } else if (req.user.role === 'doctor') {
            query.doctorId = req.user.id;
            if (req.query.patientId) query.patientId = req.query.patientId;
            if (req.query.status)    query.status    = req.query.status;
        } else {
            // admin: full access
            if (req.query.patientId) query.patientId = req.query.patientId;
            if (req.query.doctorId)  query.doctorId  = req.query.doctorId;
            if (req.query.status)    query.status    = req.query.status;
        }

        const prescriptions = await Prescription.find(query).sort({ prescriptionDate: -1 });
        res.json({ success: true, data: prescriptions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/prescriptions/:id ────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    try {
        const rx = await Prescription.findById(req.params.id);
        if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });

        // Access control
        if (req.user.role === 'patient' && rx.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (req.user.role === 'doctor' && rx.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: rx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/prescriptions ────────────────────────────────────────────────────
// Doctor creates a new prescription for a patient
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { patientId, diagnosis, medicines, followUpDate, doctorNotes } = req.body;

        if (!patientId || !diagnosis) {
            return res.status(400).json({ success: false, message: 'patientId and diagnosis are required' });
        }

        // Verify patient exists
        const patient = await User.findById(patientId).select('name email _id notificationPrefs');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        // Ensure doctor has an appointment with this patient (data isolation)
        if (req.user.role === 'doctor') {
            const hasAppt = await Appointment.findOne({ doctorId: req.user.id, patientId });
            if (!hasAppt) {
                return res.status(403).json({ success: false, message: 'Patient not assigned to you. Create an appointment first.' });
            }
        }

        const rx = await Prescription.create({
            patientId,
            patientName:  patient.name,
            doctorId:     req.user.id,
            doctorName:   req.user.name,
            diagnosis,
            medicines:    medicines || [],
            followUpDate: followUpDate || null,
            doctorNotes:  doctorNotes || '',
            status:       'active',
        });

        // Notify patient
        const io = req.app.get('io');
        await notifyPatient(
            io, patient,
            '💊 New Prescription Issued',
            `Dr. ${req.user.name} has issued a new prescription for you.\nDiagnosis: ${diagnosis}\nMedicines: ${(medicines || []).length}`,
            rx._id
        );

        res.status(201).json({ success: true, data: rx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PUT /api/prescriptions/:id ────────────────────────────────────────────────
// Doctor updates an existing prescription
router.put('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const rx = await Prescription.findOne({ _id: req.params.id, doctorId: req.user.id });
        if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found or not yours' });

        const { diagnosis, medicines, followUpDate, doctorNotes, status } = req.body;

        if (diagnosis)               rx.diagnosis    = diagnosis;
        if (medicines !== undefined) rx.medicines    = medicines;
        if (followUpDate !== undefined) rx.followUpDate = followUpDate || null;
        if (doctorNotes  !== undefined) rx.doctorNotes  = doctorNotes;
        if (status)                  rx.status       = status;

        await rx.save();

        // Notify patient of update
        const patient = await User.findById(rx.patientId).select('name email _id notificationPrefs');
        if (patient) {
            const io = req.app.get('io');
            await notifyPatient(
                io, patient,
                '✏️ Prescription Updated',
                `Dr. ${req.user.name} has updated your prescription (${rx.diagnosis}). Please review the changes on your dashboard.`,
                rx._id
            );
        }

        res.json({ success: true, data: rx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PATCH /api/prescriptions/:id/status ──────────────────────────────────────
// Doctor marks prescription as active or completed
router.patch('/:id/status', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: "status must be 'active' or 'completed'" });
        }

        const rx = await Prescription.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.id },
            { status },
            { new: true }
        );
        if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found or not yours' });

        // Notify patient of status change
        const patient = await User.findById(rx.patientId).select('name email _id notificationPrefs');
        if (patient) {
            const io = req.app.get('io');
            const statusLabel = status === 'completed' ? 'Completed ✅' : 'Re-Activated 🔄';
            await notifyPatient(
                io, patient,
                `📋 Prescription ${statusLabel}`,
                `Dr. ${req.user.name} has marked your prescription (${rx.diagnosis}) as ${status}.`,
                rx._id
            );
        }

        res.json({ success: true, data: rx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── DELETE /api/prescriptions/:id ────────────────────────────────────────────
router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const rx = await Prescription.findOneAndDelete({ _id: req.params.id, doctorId: req.user.id });
        if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found or not yours' });
        res.json({ success: true, message: 'Prescription deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
