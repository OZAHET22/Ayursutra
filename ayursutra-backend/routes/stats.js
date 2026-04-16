const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Therapy = require('../models/Therapy');

// GET /api/stats/public — public homepage stats (no auth required)
router.get('/public', async (req, res) => {
    try {
        const [totalPatients, totalDoctors, totalAppointments, totalTherapies] = await Promise.all([
            User.countDocuments({ role: 'patient' }),
            User.countDocuments({ role: 'doctor', approved: true }),
            Appointment.countDocuments({}),
            Therapy.countDocuments({}),
        ]);
        res.json({ success: true, data: { totalPatients, totalDoctors, totalAppointments, totalTherapies } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
