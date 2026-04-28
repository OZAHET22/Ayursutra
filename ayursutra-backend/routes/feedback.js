const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// ─── PUBLIC: GET /api/feedback/doctor/:doctorId ───────────────────────────────
// Returns aggregated rating + recent public reviews for a doctor (no auth required).
// Used by the signup page so patients can make an informed doctor choice.
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Validate doctor exists
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor', approved: true })
            .select('name speciality hospitalName experience avatar centre');
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        // Aggregate: count + average rating
        const stats = await Feedback.aggregate([
            { $match: { doctorId: doctor._id } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                }
            }
        ]);

        // Recent reviews (latest 5, public — only show patient name + content + rating)
        const recentReviews = await Feedback.find({ doctorId: doctor._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('patientName rating content createdAt replied');

        const aggregated = stats[0] || { avgRating: 0, totalReviews: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 };

        res.json({
            success: true,
            data: {
                doctor: {
                    _id: doctor._id,
                    name: doctor.name,
                    speciality: doctor.speciality,
                    hospitalName: doctor.hospitalName,
                    experience: doctor.experience,
                    avatar: doctor.avatar,
                    centre: doctor.centre,
                },
                rating: {
                    average: aggregated.avgRating ? parseFloat(aggregated.avgRating.toFixed(1)) : 0,
                    total: aggregated.totalReviews,
                    breakdown: {
                        5: aggregated.star5,
                        4: aggregated.star4,
                        3: aggregated.star3,
                        2: aggregated.star2,
                        1: aggregated.star1,
                    }
                },
                recentReviews,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/feedback — patient sees own, doctor sees feedback for them, admin sees all
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patientId = req.user.id;
        else if (req.user.role === 'doctor') query.doctorId = req.user.id;
        
        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const feedback = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Feedback.countDocuments(query);

        res.json({ 
            success: true, 
            data: feedback,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// GET /api/feedback/:id — get single feedback
router.get('/:id', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
        
        // Check authorization
        if (req.user.role === 'patient' && feedback.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this feedback' });
        }
        if (req.user.role === 'doctor' && feedback.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this feedback' });
        }

        res.json({ success: true, data: feedback });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// POST /api/feedback — patient submits feedback
router.post('/', protect, authorize('patient'), async (req, res) => {
    try {
        const { content, rating, doctorId } = req.body;

        // Validate required fields
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ success: false, message: 'Feedback content is required.' });
        }
        if (content.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Feedback must be at least 10 characters.' });
        }
        if (content.trim().length > 2000) {
            return res.status(400).json({ success: false, message: 'Feedback cannot exceed 2000 characters.' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }
        if (!doctorId) {
            return res.status(400).json({ success: false, message: 'Please specify the doctor you are rating.' });
        }

        // Validate the doctor exists and is approved
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor', approved: true }).select('name');
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found or not approved.' });
        }

        // Check for duplicate feedback (prevent spam)
        const existingFeedback = await Feedback.findOne({
            patientId: req.user.id,
            doctorId,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });

        if (existingFeedback) {
            return res.status(429).json({ 
                success: false, 
                message: 'You can only submit one feedback per doctor per day.' 
            });
        }

        const fb = await Feedback.create({
            content: content.trim(),
            rating: Number(rating),
            doctorId,
            patientId: req.user.id,
            patientName: req.user.name,
        });

        res.status(201).json({ success: true, data: fb });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// PUT /api/feedback/:id — patient edits their own feedback
router.put('/:id', protect, authorize('patient'), async (req, res) => {
    try {
        const { content, rating } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
        
        // Ensure patient can only edit their own feedback
        if (feedback.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this feedback' });
        }

        // Prevent editing if doctor has already replied
        if (feedback.replied) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot edit feedback after doctor has replied' 
            });
        }

        // Validate content
        if (content && typeof content === 'string') {
            if (content.trim().length < 10) {
                return res.status(400).json({ success: false, message: 'Feedback must be at least 10 characters.' });
            }
            if (content.trim().length > 2000) {
                return res.status(400).json({ success: false, message: 'Feedback cannot exceed 2000 characters.' });
            }
        }

        // Validate rating
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

        // Update feedback with edit history
        const updateData = {
            isEdited: true,
            editHistory: [
                ...(feedback.editHistory || []),
                { content: feedback.content, editedAt: new Date() }
            ]
        };

        if (content) updateData.content = content.trim();
        if (rating !== undefined) updateData.rating = rating;

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: updatedFeedback, message: 'Feedback updated successfully' });
    } catch (err) { 
        res.status(400).json({ success: false, message: err.message }); 
    }
});

// PUT /api/feedback/:id/reply — doctor replies to feedback
router.put('/:id/reply', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { reply } = req.body;
        const existing = await Feedback.findById(req.params.id);

        if (!existing) return res.status(404).json({ success: false, message: 'Feedback not found' });

        // Ensure doctor can only reply to their own feedback
        if (req.user.role === 'doctor' && existing.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to reply to this feedback.' });
        }

        // Check doctor is still approved
        const doctor = await User.findOne({ _id: existing.doctorId, role: 'doctor', approved: true });
        if (!doctor) {
            return res.status(403).json({ success: false, message: 'Doctor is no longer approved to reply.' });
        }

        // Validate reply
        if (!reply || typeof reply !== 'string') {
            return res.status(400).json({ success: false, message: 'Reply text is required.' });
        }
        if (reply.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Reply must be at least 5 characters.' });
        }
        if (reply.trim().length > 2000) {
            return res.status(400).json({ success: false, message: 'Reply cannot exceed 2000 characters.' });
        }

        const fb = await Feedback.findByIdAndUpdate(
            req.params.id,
            { 
                replied: true, 
                reply: reply.trim(),
                replyDate: new Date()
            },
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: fb, message: 'Reply added successfully' });
    } catch (err) { 
        res.status(400).json({ success: false, message: err.message }); 
    }
});

// PATCH /api/feedback/:id/reply — doctor updates/edits their reply
router.patch('/:id/reply', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { reply } = req.body;
        const existing = await Feedback.findById(req.params.id);

        if (!existing) return res.status(404).json({ success: false, message: 'Feedback not found' });

        // Ensure doctor can only edit their own reply
        if (req.user.role === 'doctor' && existing.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this reply.' });
        }

        if (!existing.replied) {
            return res.status(400).json({ success: false, message: 'No reply to edit yet.' });
        }

        // Validate reply
        if (!reply || typeof reply !== 'string') {
            return res.status(400).json({ success: false, message: 'Reply text is required.' });
        }
        if (reply.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Reply must be at least 5 characters.' });
        }
        if (reply.trim().length > 2000) {
            return res.status(400).json({ success: false, message: 'Reply cannot exceed 2000 characters.' });
        }

        const fb = await Feedback.findByIdAndUpdate(
            req.params.id,
            { 
                reply: reply.trim(),
                replyDate: new Date()
            },
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: fb, message: 'Reply updated successfully' });
    } catch (err) { 
        res.status(400).json({ success: false, message: err.message }); 
    }
});

// DELETE /api/feedback/:id — patient deletes own, admin deletes any
router.delete('/:id', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        
        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

        // Check authorization: patient can delete their own, admin can delete any
        if (req.user.role === 'patient' && feedback.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this feedback' });
        }
        if (req.user.role !== 'patient' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only patients and admins can delete feedback' });
        }

        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Feedback deleted successfully' });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

module.exports = router;
