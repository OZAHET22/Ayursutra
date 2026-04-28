const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const DietPlan = require('../models/DietPlan');
const Appointment = require('../models/Appointment');

// GET /api/diets?patientId=xxx  — load diet plan(s) for a patient
// Patient: can only access their own plans (auto-enforced)
// Doctor: can access plans they created for their patients
router.get('/', protect, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'patient') {
            // Patient can only view their own diet plans (strict data isolation)
            query.patientId = req.user.id;
        } else {
            if (req.query.patientId) query.patientId = req.query.patientId;
            if (req.user.role === 'doctor') query.doctorId = req.user.id;
        }
        const plans = await DietPlan.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: plans });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/diets — create new diet plan for a patient
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { patientId, patientName, items, notes } = req.body;

        // Enforce: doctor can only create plans for their own patients
        if (req.user.role === 'doctor') {
            const hasAppt = await Appointment.findOne({ doctorId: req.user.id, patientId });
            if (!hasAppt) {
                return res.status(403).json({ success: false, message: 'Patient not assigned to you' });
            }
        }

        const plan = await DietPlan.create({
            patientId,
            patientName,
            doctorId: req.user.id,
            items: items || [],
            notes: notes || '',
        });
        res.status(201).json({ success: true, data: plan });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/diets/:id — update items or notes
router.patch('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const plan = await DietPlan.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.id },
            { $set: { items: req.body.items, notes: req.body.notes } },
            { new: true }
        );
        if (!plan) return res.status(404).json({ success: false, message: 'Diet plan not found or not yours' });
        res.json({ success: true, data: plan });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/diets/:id
router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        await DietPlan.findOneAndDelete({ _id: req.params.id, doctorId: req.user.id });
        res.json({ success: true, message: 'Diet plan deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
