const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// GET /api/analytics — real computed analytics for logged-in doctor
router.get('/', protect, async (req, res) => {
    try {
        const rawDoctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;
        let matchDoctor = {};
        if (rawDoctorId) {
            try {
                matchDoctor = { doctorId: new mongoose.Types.ObjectId(rawDoctorId) };
            } catch {
                return res.status(400).json({ success: false, message: 'Invalid doctorId' });
            }
        }

        // 1. Therapy Success Rate — % of completed appointments per therapy type
        const therapySuccess = await Appointment.aggregate([
            { $match: { ...matchDoctor } },
            { $group: {
                _id: '$type',
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
            }},
            { $project: {
                therapyType: '$_id',
                successRate: { $cond: [{ $eq: ['$total', 0] }, 0,
                    { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1] }
                ]}
            }},
            { $sort: { successRate: -1 } }
        ]);

        // 2. Patient Distribution — count by appointment type
        const patientDist = await Appointment.aggregate([
            { $match: { ...matchDoctor } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $project: { label: '$_id', count: 1 } },
            { $sort: { count: -1 } }
        ]);

        // 3. Monthly Growth — new patients by month (last 12 months, based on appointments)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyGrowth = await Appointment.aggregate([
            { $match: { ...matchDoctor, createdAt: { $gte: twelveMonthsAgo } } },
            { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: {
                label: { $concat: [
                    { $arrayElemAt: [['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                        { $subtract: ['$_id.month', 1] }] },
                    ' ',
                    { $toString: '$_id.year' }
                ]},
                count: 1
            }}
        ]);

        // 4. Retention Rate — patients with >1 appointment / total unique patients
        const retentionPipeline = await Appointment.aggregate([
            { $match: { ...matchDoctor } },
            { $group: { _id: '$patientId', apptCount: { $sum: 1 } } },
            { $group: {
                _id: null,
                total: { $sum: 1 },
                retained: { $sum: { $cond: [{ $gt: ['$apptCount', 1] }, 1, 0] } }
            }}
        ]);
        const retentionData = retentionPipeline[0] || { total: 0, retained: 0 };
        const retentionRate = retentionData.total > 0
            ? Math.round((retentionData.retained / retentionData.total) * 100)
            : 0;
        const dropRate = 100 - retentionRate;

        // 5. Appointment status breakdown (for KPI cards)
        const statusBreakdown = await Appointment.aggregate([
            { $match: { ...matchDoctor } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 6. Total counts
        const totalAppointments = await Appointment.countDocuments(matchDoctor);
        const uniquePatients = await Appointment.distinct('patientId', matchDoctor);

        res.json({
            success: true,
            data: {
                therapySuccess,
                patientDist,
                monthlyGrowth,
                retentionRate,
                dropRate,
                statusBreakdown,
                totalAppointments,
                totalPatients: uniquePatients.length,
            }
        });
    } catch (err) {
        console.error('[Analytics] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
