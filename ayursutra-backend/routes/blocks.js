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

        // CRITICAL FIX: Validate all time parameters
        if (startHour === undefined || endHour === undefined) {
            return res.status(400).json({ success: false, message: 'startHour and endHour are required.' });
        }

        // Validate hour range (0-23)
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            return res.status(400).json({ success: false, message: 'Hours must be between 0-23.' });
        }

        // Validate minute range (0-59)
        const sm = startMinute || 0;
        const em = endMinute || 0;
        if (sm < 0 || sm > 59 || em < 0 || em > 59) {
            return res.status(400).json({ success: false, message: 'Minutes must be between 0-59.' });
        }

        // Validate start time is before end time
        const startTotalMins = startHour * 60 + sm;
        const endTotalMins = endHour * 60 + em;
        if (startTotalMins >= endTotalMins) {
            return res.status(400).json({ success: false, message: 'Start time must be before end time.' });
        }

        if (isRecurring && dayOfWeek === undefined) {
            return res.status(400).json({ success: false, message: 'dayOfWeek is required for recurring blocks.' });
        }
        if (!isRecurring && !date) {
            return res.status(400).json({ success: false, message: 'date is required for one-time blocks.' });
        }

        // CRITICAL FIX: Check for overlapping doctor blocks
        const newStartMins = Number(startHour) * 60 + (Number(startMinute) || 0);
        const newEndMins = Number(endHour) * 60 + (Number(endMinute) || 0);

        let overlapQuery = { doctorId: req.user.id, active: true };

        if (isRecurring) {
            // Check for overlapping recurring blocks on same day
            overlapQuery.isRecurring = true;
            overlapQuery.dayOfWeek = Number(dayOfWeek);
        } else {
            // Check for overlapping one-time blocks on same date
            overlapQuery.isRecurring = false;
            overlapQuery.date = date;
        }

        const existingBlocks = await DoctorBlock.find(overlapQuery);
        const hasOverlap = existingBlocks.some(b => {
            const existingStart = Number(b.startHour) * 60 + Number(b.startMinute);
            const existingEnd = Number(b.endHour) * 60 + Number(b.endMinute);
            // Check if blocks overlap: new block starts before existing ends AND new block ends after existing starts
            const overlaps = newStartMins < existingEnd && newEndMins > existingStart;
            return overlaps;
        });

        if (hasOverlap) {
            return res.status(400).json({
                success: false,
                message: 'This time slot overlaps with an existing unavailable block. Please choose a different time.'
            });
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

// PATCH /api/blocks/:id — update an existing block
router.patch('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { date, isRecurring, dayOfWeek, startHour, startMinute, endHour, endMinute, reason } = req.body;

        // Validate input
        if (startHour === undefined || endHour === undefined) {
            return res.status(400).json({ success: false, message: 'startHour and endHour are required.' });
        }

        // Validate hour range (0-23)
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            return res.status(400).json({ success: false, message: 'Hours must be between 0-23.' });
        }

        // Validate minute range (0-59)
        const sm = startMinute || 0;
        const em = endMinute || 0;
        if (sm < 0 || sm > 59 || em < 0 || em > 59) {
            return res.status(400).json({ success: false, message: 'Minutes must be between 0-59.' });
        }

        // Validate start time is before end time
        const startTotalMins = startHour * 60 + sm;
        const endTotalMins = endHour * 60 + em;
        if (startTotalMins >= endTotalMins) {
            return res.status(400).json({ success: false, message: 'Start time must be before end time.' });
        }

        if (isRecurring && dayOfWeek === undefined) {
            return res.status(400).json({ success: false, message: 'dayOfWeek is required for recurring blocks.' });
        }
        if (!isRecurring && !date) {
            return res.status(400).json({ success: false, message: 'date is required for one-time blocks.' });
        }

        // CRITICAL FIX: Check for overlapping doctor blocks (excluding self)
        const newStartMins = Number(startHour) * 60 + (Number(startMinute) || 0);
        const newEndMins = Number(endHour) * 60 + (Number(endMinute) || 0);

        let overlapQuery = { doctorId: req.user.id, active: true, _id: { $ne: req.params.id } };

        if (isRecurring) {
            // Check for overlapping recurring blocks on same day
            overlapQuery.isRecurring = true;
            overlapQuery.dayOfWeek = Number(dayOfWeek);
        } else {
            // Check for overlapping one-time blocks on same date
            overlapQuery.isRecurring = false;
            overlapQuery.date = date;
        }

        const existingBlocks = await DoctorBlock.find(overlapQuery);
        const hasOverlap = existingBlocks.some(b => {
            const existingStart = Number(b.startHour) * 60 + Number(b.startMinute);
            const existingEnd = Number(b.endHour) * 60 + Number(b.endMinute);
            // Check if blocks overlap
            const overlaps = newStartMins < existingEnd && newEndMins > existingStart;
            return overlaps;
        });

        if (hasOverlap) {
            return res.status(400).json({
                success: false,
                message: 'This time slot overlaps with an existing unavailable block. Please choose a different time.'
            });
        }

        // Build update object
        const updateData = {
            startHour: Number(startHour),
            startMinute: Number(startMinute || 0),
            endHour: Number(endHour),
            endMinute: Number(endMinute || 0),
            reason: reason || 'Unavailable',
            isRecurring: !!isRecurring,
        };

        if (!isRecurring) {
            updateData.date = date;
            updateData.dayOfWeek = null;
        } else {
            updateData.date = null;
            updateData.dayOfWeek = Number(dayOfWeek);
        }

        const block = await DoctorBlock.findOneAndUpdate(
            { _id: req.params.id, doctorId: req.user.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!block) return res.status(404).json({ success: false, message: 'Block not found.' });
        res.json({ success: true, data: block, message: 'Block updated successfully.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
