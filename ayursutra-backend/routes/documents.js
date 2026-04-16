const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Document = require('../models/Document');
const Appointment = require('../models/Appointment');

// GET /api/documents — patient sees own; doctor sees only their patients' docs
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') {
            query.patientId = req.user.id;
        } else if (req.user.role === 'doctor') {
            // Only return docs belonging to patients assigned to this doctor
            const patientIds = await Appointment.find({ doctorId: req.user.id }).distinct('patientId');
            if (req.query.patientId) {
                // Extra check: requested patient must belong to this doctor
                const allowed = patientIds.map(p => p.toString()).includes(req.query.patientId);
                if (!allowed) {
                    return res.status(403).json({ success: false, message: 'Patient not assigned to you' });
                }
                query.patientId = req.query.patientId;
            } else {
                query.patientId = { $in: patientIds };
            }
        }
        // admin: no filter (sees all), can still filter by patientId
        if (req.user.role === 'admin' && req.query.patientId) {
            query.patientId = req.query.patientId;
        }
        const docs = await Document.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: docs });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/documents — patient uploads document metadata
router.post('/', protect, async (req, res) => {
    try {
        const doc = await Document.create({
            ...req.body,
            patientId: req.user.role === 'patient' ? req.user.id : req.body.patientId,
            patientName: req.user.role === 'patient' ? req.user.name : req.body.patientName,
        });
        res.status(201).json({ success: true, data: doc });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/documents/:id/review — doctor marks document as reviewed
router.put('/:id/review', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const doc = await Document.findByIdAndUpdate(
            req.params.id,
            { reviewed: true, reviewedBy: req.user.name, notes: req.body.notes || '' },
            { new: true }
        );
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        res.json({ success: true, data: doc });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/documents/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        if (req.user.role === 'patient' && doc.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await Document.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Document deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
