const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const DoctorBlock = require('../models/DoctorBlock');

// GET /api/blocks?date=YYYY-MM-DD — get all blocks for logged-in doctor on a date
// Also includes recurring blocks matching that day-of-week
router.get('/', protect, async (req, res) => {
    try {
        const doctorId = req.query.doctorId || req.user.id;
        const date     = req.query.date; // YYYY-MM-DD (optional)

        let query = { doctorId, active: true };

        if (date) {
            const dayOfWeek = new Date(date + 'T00:00:00').getDay();
            // One-time blocks for that date OR recurring blocks for that day-of-week
            query = {
                doctorId,
                active: true,
                $or: [
                    { isRecurring: false, date },
                    { isRecurring: true,  dayOfWeek },
                ],
            };
        }

        const blocks = await DoctorBlock.find(query).sort({ startHour: 1, startMinute: 1 });
        res.json({ success: true, data: blocks });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/blocks/all — get all blocks for the logged-in doctor (for management UI)
router.get('/all', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const blocks = await DoctorBlock.find({ doctorId: req.user.id }).sort({ isRecurring: 1, startHour: 1 });
        res.json({ success: true, data: blocks });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/blocks — create a new block
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { date, isRecurring, dayOfWeek, startHour, startMinute, endHour, endMinute, reason } = req.body;

        if (startHour === undefined || endHour === undefined) {
            return res.status(400).json({ success: false, message: 'startHour and endHour are required.' });
        }
        if (isRecurring && dayOfWeek === undefined) {
            return res.status(400).json({ success: false, message: 'dayOfWeek is required for recurring blocks.' });
        }
        if (!isRecurring && !date) {
            return res.status(400).json({ success: false, message: 'date is required for one-time blocks.' });
        }

        const block = await DoctorBlock.create({
            doctorId: req.user.id,
            date:        isRecurring ? null : date,
            isRecurring: !!isRecurring,
            dayOfWeek:   isRecurring ? Number(dayOfWeek) : null,
            startHour:   Number(startHour),
            startMinute: Number(startMinute || 0),
            endHour:     Number(endHour),
            endMinute:   Number(endMinute || 0),
            reason:      reason || 'Unavailable',
            active:      true,
        });
        res.status(201).json({ success: true, data: block });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/blocks/:id — remove a block (soft-delete)
router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const block = await DoctorBlock.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.id },
            { active: false },
            { new: true }
        );
        if (!block) return res.status(404).json({ success: false, message: 'Block not found.' });
        res.json({ success: true, message: 'Block removed.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
