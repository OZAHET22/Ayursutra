const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Therapy = require('../models/Therapy');

// GET /api/therapies
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patientId = req.user.id;
        else if (req.user.role === 'doctor') query.doctorId = req.user.id;
        const therapies = await Therapy.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: therapies });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/therapies
router.post('/', protect, async (req, res) => {
    try {
        const therapy = await Therapy.create({ ...req.body, doctorId: req.user.role === 'doctor' ? req.user.id : req.body.doctorId });
        res.status(201).json({ success: true, data: therapy });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/therapies/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const therapy = await Therapy.findById(req.params.id);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });
        // Ownership: patients cannot edit; doctors can only edit their own
        if (req.user.role === 'patient') {
            return res.status(403).json({ success: false, message: 'Patients cannot modify therapy records.' });
        }
        if (req.user.role === 'doctor' && therapy.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorised to modify this therapy.' });
        }
        const updated = await Therapy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, data: updated });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/therapies/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const therapy = await Therapy.findById(req.params.id);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });
        // Only the assigned doctor or admin may delete
        if (req.user.role === 'patient') {
            return res.status(403).json({ success: false, message: 'Patients cannot delete therapy records.' });
        }
        if (req.user.role === 'doctor' && therapy.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorised to delete this therapy.' });
        }
        await Therapy.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Therapy deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
