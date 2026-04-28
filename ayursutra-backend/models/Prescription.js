const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    medicineName:    { type: String, required: true, trim: true },
    medicineType:    { type: String, enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Powder', 'Other'], default: 'Tablet' },
    dose:            { type: String, default: '' },          // e.g. "500mg"
    frequency:       { type: String, default: '' },          // e.g. "Twice a day"
    timing:          { type: String, enum: ['Before Food', 'After Food', 'With Food', 'At Bedtime', 'Empty Stomach', 'As Directed'], default: 'After Food' },
    duration:        { type: String, default: '' },          // e.g. "5 Days"
    quantity:        { type: String, default: '' },          // e.g. "10 tablets"
    specialInstructions: { type: String, default: '' },
}, { _id: true });

const PrescriptionSchema = new mongoose.Schema({
    patientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName:    { type: String, default: '' },
    doctorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName:     { type: String, default: '' },
    diagnosis:      { type: String, required: true, trim: true },
    medicines:      { type: [MedicineSchema], default: [] },
    followUpDate:   { type: Date, default: null },
    doctorNotes:    { type: String, default: '' },
    status:         { type: String, enum: ['active', 'completed'], default: 'active' },
    prescriptionDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
