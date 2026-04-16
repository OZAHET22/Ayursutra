const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CatalogueItem = require('../models/CatalogueItem');

// GET /api/catalogue — doctor gets their own items; admin gets all
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { doctorId: req.user.id };
        const items = await CatalogueItem.find({ ...query, isActive: true }).sort({ type: 1, name: 1 });
        res.json({ success: true, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/catalogue — create new item
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { type, name, desc, price, gst } = req.body;
        if (!type || !name || price === undefined) {
            return res.status(400).json({ success: false, message: 'type, name and price are required.' });
        }

        // Upsert by name+type for this doctor — avoids duplicate error on re-add
        const item = await CatalogueItem.findOneAndUpdate(
            { doctorId: req.user.id, type, name: name.trim() },
            { desc: desc || '', price: Number(price), gst: Number(gst) || 18, isActive: true },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/catalogue/:id — update item
router.put('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const item = await CatalogueItem.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.id },
            req.body,
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/catalogue/:id — soft-delete (isActive = false)
router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const item = await CatalogueItem.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.id },
            { isActive: false },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
        res.json({ success: true, message: 'Item removed from catalogue.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
