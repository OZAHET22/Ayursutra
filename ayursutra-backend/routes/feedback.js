const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// GET /api/feedback — patient sees own, doctor sees feedback for them
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patientId = req.user.id;
        else if (req.user.role === 'doctor') query.doctorId = req.user.id;
        const feedback = await Feedback.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: feedback });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/feedback — patient submits feedback
router.post('/', protect, authorize('patient'), async (req, res) => {
    try {
        const fb = await Feedback.create({
            ...req.body,
            patientId: req.user.id,
            patientName: req.user.name,
        });
        res.status(201).json({ success: true, data: fb });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/feedback/:id/reply — doctor replies
router.put('/:id/reply', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const fb = await Feedback.findByIdAndUpdate(
            req.params.id,
            { replied: true, reply: req.body.reply },
            { new: true }
        );
        if (!fb) return res.status(404).json({ success: false, message: 'Feedback not found' });
        res.json({ success: true, data: fb });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/feedback/:id — admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Feedback deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
