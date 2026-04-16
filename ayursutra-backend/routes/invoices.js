const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Invoice = require('../models/Invoice');

// GET /api/invoices — doctor sees own, admin sees all
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'doctor') query.doctorId = req.user.id;
        const invoices = await Invoice.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: invoices });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/invoices — create invoice
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const invoice = await Invoice.create({ ...req.body, doctorId: req.user.id });
        res.status(201).json({ success: true, data: invoice });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/invoices/:id/status — update payment status only
router.patch('/:id/status', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { paymentStatus, paidAmount } = req.body;
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { paymentStatus, paidAmount, balance: 0 },
            { new: true }
        );
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/invoices/:id — update invoice
router.put('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/invoices/:id
router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
