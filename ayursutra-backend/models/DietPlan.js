const mongoose = require('mongoose');

const DietItemSchema = new mongoose.Schema({
    foodName: { type: String, required: true },
    category: { type: String, default: '' },
    prescribed: { type: Boolean, default: false },
}, { _id: true });

const DietPlanSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, default: '' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [DietItemSchema],
    notes: { type: String, default: '' },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', DietPlanSchema);
