const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { notifyPatient } = require('../utils/notifyPatient');

// GET /api/users/my-patients — patients connected to the requesting doctor
// Includes: (1) patients who had appointments, (2) patients with preferredDoctor set to this doctor
router.get('/my-patients', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const doctorId = req.user.role === 'doctor' ? req.user.id : null;
        if (!doctorId) {
            return res.status(403).json({ success: false, message: 'Only doctors can access this endpoint' });
        }
        // Union: patients via appointments + patients assigned via preferredDoctor
        const [apptIds, prefPatients] = await Promise.all([
            Appointment.find({ doctorId }).distinct('patientId'),
            User.find({ role: 'patient', preferredDoctor: doctorId }).select('_id'),
        ]);
        const allIds = [...new Set([
            ...apptIds.map(id => id.toString()),
            ...prefPatients.map(p => p._id.toString()),
        ])];
        const patients = await User.find({ _id: { $in: allIds }, role: 'patient' })
            .select('-password')
            .sort({ name: 1 });
        res.json({ success: true, data: patients });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/patients — all patients (admin only)
router.get('/patients', protect, authorize('admin'), async (req, res) => {
    try {
        const patients = await User.find({ role: 'patient' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: patients });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/doctors/pending — unapproved doctors (admin only)
// ⚠ MUST be declared before /doctors and /:id to avoid route shadowing
router.get('/doctors/pending', protect, authorize('admin'), async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor', approved: { $ne: true } })
            .select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: doctors });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/doctors — all approved doctors with schedule profile info (public)
// Feature 4: supports ?specialization=<label> for strict doctor-patient matching
router.get('/doctors', async (req, res) => {
    try {
        const DoctorSchedule = require('../models/DoctorSchedule');
        const Feedback = require('../models/Feedback');
        const filter = { role: 'doctor', approved: true };
        // Strict specialization filter — cross-specialization connections not allowed
        if (req.query.specialization) {
            filter.speciality = req.query.specialization;
        }
        const doctors = await User.find(filter).select('-password');

        // Enrich each doctor with their schedule profile (fee, qualifications, bio)
        const doctorIds = doctors.map(d => d._id);
        const [schedules, ratingStats] = await Promise.all([
            DoctorSchedule.find({ doctorId: { $in: doctorIds } })
                .select('doctorId consultationFee feeCurrency qualifications bio languages profileVisible slotDuration workingDays'),
            // Aggregate avg rating + total reviews per doctor in one query
            Feedback.aggregate([
                { $match: { doctorId: { $in: doctorIds } } },
                {
                    $group: {
                        _id: '$doctorId',
                        avgRating: { $avg: '$rating' },
                        reviewCount: { $sum: 1 },
                    }
                }
            ])
        ]);

        const scheduleMap = {};
        schedules.forEach(s => { scheduleMap[s.doctorId.toString()] = s; });

        const ratingMap = {};
        ratingStats.forEach(r => { ratingMap[r._id.toString()] = r; });

        const enriched = doctors
            .map(d => {
                const s = scheduleMap[d._id.toString()];
                const r = ratingMap[d._id.toString()];
                return {
                    ...d.toObject(),
                    consultationFee:  s?.consultationFee  ?? 0,
                    feeCurrency:      s?.feeCurrency      ?? 'INR',
                    qualifications:   s?.qualifications   ?? '',
                    bio:              s?.bio              ?? '',
                    languages:        s?.languages        ?? ['English'],
                    profileVisible:   s?.profileVisible   ?? true,
                    slotDuration:     s?.slotDuration     ?? 30,
                    workingDays:      s?.workingDays      ?? [],
                    avgRating:        r ? parseFloat(r.avgRating.toFixed(1)) : 0,
                    reviewCount:      r?.reviewCount ?? 0,
                };
            })
            .filter(d => d.profileVisible !== false);

        res.json({ success: true, data: enriched });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});


// POST /api/users/reassign-doctor — patient changes their centre + doctor atomically
// Cancels all pending/confirmed appointments with the OLD doctor automatically.
router.post('/reassign-doctor', protect, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ success: false, message: 'Only patients can reassign their doctor.' });
        }

        const { newDoctorId, newCentreId, newCentreName, reason } = req.body;
        if (!newDoctorId) {
            return res.status(400).json({ success: false, message: 'newDoctorId is required.' });
        }

        // Validate new doctor exists and is approved
        const newDoctor = await User.findOne({ _id: newDoctorId, role: 'doctor', approved: true }).select('-password');
        if (!newDoctor) {
            return res.status(404).json({ success: false, message: 'Selected doctor not found or not approved.' });
        }

        const patient = await User.findById(req.user.id).select('-password');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        const oldDoctorId = patient.preferredDoctor;

        // ── 1. Cancel all PENDING/CONFIRMED appointments with old doctor ───────
        let cancelledCount = 0;
        if (oldDoctorId && oldDoctorId.toString() !== newDoctorId) {
            const cancelled = await Appointment.updateMany(
                {
                    patientId: req.user.id,
                    doctorId: oldDoctorId,
                    status: { $in: ['pending', 'confirmed'] },
                    date: { $gt: new Date() },
                },
                {
                    $set: { status: 'cancelled' },
                    $push: {
                        rescheduleHistory: {
                            from: new Date(),
                            to: null,
                            reason: reason || 'Patient switched to a different doctor.',
                            requestedBy: 'patient',
                            requestedAt: new Date(),
                        }
                    }
                }
            );
            cancelledCount = cancelled.modifiedCount || 0;
        }

        // ── 2. Update patient profile ─────────────────────────────────────────
        const updatedPatient = await User.findByIdAndUpdate(
            req.user.id,
            {
                preferredDoctor: newDoctorId,
                centreId: newCentreId || newDoctor.centreId || '',
                centre:   newCentreName || newDoctor.centre || '',
            },
            { new: true }
        ).select('-password');

        // ── 3. Real-time notifications ─────────────────────────────────────────
        const io = req.app.get('io');
        const notifPayload = {
            io,
            patientId: req.user.id,
            type: 'general',
            title: '✅ Doctor Changed Successfully',
            message: `You are now assigned to Dr. ${newDoctor.name}${newCentreName ? ' at ' + newCentreName : ''}. ${cancelledCount > 0 ? cancelledCount + ' pending appointment(s) with your previous doctor have been cancelled.' : ''}`,
            appointmentId: null,
            therapyType: '',
        };
        await notifyPatient(notifPayload);

        // Inform old doctor if exists
        if (oldDoctorId && io && oldDoctorId.toString() !== newDoctorId) {
            io.to(`user_${oldDoctorId}`).emit('patient_reassigned', {
                patientName: patient.name,
                newDoctorName: newDoctor.name,
                cancelledAppointments: cancelledCount,
            });
        }
        // Inform new doctor
        if (io) {
            io.to(`user_${newDoctorId}`).emit('patient_assigned', {
                patientName: patient.name,
                patientId: req.user.id,
            });
        }

        res.json({
            success: true,
            data: updatedPatient,
            cancelledAppointments: cancelledCount,
            newDoctor: { name: newDoctor.name, speciality: newDoctor.speciality },
            message: `Successfully switched to Dr. ${newDoctor.name}. ${cancelledCount} appointment(s) cancelled.`,
        });
    } catch (err) {
        console.error('[reassign-doctor]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/users/:id/approve — admin approves a doctor
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user, message: 'Doctor approved successfully' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id/revoke — admin revokes/hides a doctor (soft — does NOT delete)
router.put('/:id/revoke', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { approved: false },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user, message: 'Doctor visibility revoked. They can be re-approved anytime.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/:id — get single user (self, or doctor fetching patient, or admin, or patient fetching their assigned doctor)
router.get('/:id', protect, async (req, res) => {
    try {
        const target = await User.findById(req.params.id).select('-password');
        if (!target) return res.status(404).json({ success: false, message: 'User not found' });

        // Patients can fetch their own profile OR any doctor's profile (for feedback display)
        if (req.user.role === 'patient') {
            if (req.user.id !== req.params.id && target.role !== 'doctor') {
                return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
            }
        }
        res.json({ success: true, data: target });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id — update user profile
router.put('/:id', protect, async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const { password, ...updateData } = req.body;

        if (updateData.email) {
            updateData.email = updateData.email.trim().toLowerCase();
            const existingEmail = await User.findOne({ email: updateData.email, _id: { $ne: req.params.id } });
            if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        
        if (updateData.phone && updateData.phone.trim() !== '') {
            updateData.phone = updateData.phone.trim();
            const existingPhone = await User.findOne({ phone: updateData.phone, _id: { $ne: req.params.id } });
            if (existingPhone) return res.status(400).json({ success: false, message: 'Mobile number already in use' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ success: false, message: 'Admins cannot delete their own account.' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
