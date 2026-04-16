const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Centre = require('../models/Centre');

// GET /api/centres  — public (needed for doctor signup dropdown)
router.get('/', async (req, res) => {
    try {
        const centres = await Centre.find({ active: true }).sort({ createdAt: 1 });
        res.json({ success: true, data: centres });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/centres  — admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Centre name is required.' });
        }

        const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

        // Duplicate check (including soft-deleted ones — prevent ghost reactivation)
        const existing = await Centre.findOne({ slug });
        if (existing && existing.active) {
            return res.status(409).json({ success: false, message: `A centre named "${existing.name}" already exists.` });
        }
        // If it was soft-deleted before, reactivate it
        if (existing && !existing.active) {
            existing.active = true;
            existing.name = name.trim();
            await existing.save();
            return res.status(201).json({ success: true, data: existing, message: `"${existing.name}" has been reactivated.` });
        }

        const centre = await Centre.create({ name: name.trim(), slug });
        res.status(201).json({ success: true, data: centre });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/centres/:id  — admin only, soft-delete (sets active: false)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const centre = await Centre.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { new: true }
        );
        if (!centre) return res.status(404).json({ success: false, message: 'Centre not found.' });
        res.json({ success: true, message: `"${centre.name}" has been removed.` });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
