const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
    type: { type: String, default: 'Consultation' },
    name: { type: String, default: '' },
    desc: { type: String, default: '' },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    gst: { type: Number, default: 18 },
    total: { type: Number, default: 0 },
});

const InvoiceSchema = new mongoose.Schema({
    invoiceNo: { type: String, required: true },
    issueDateTime: { type: String },
    clinicName: { type: String, default: 'Ayursutra Panchkarma Clinic' },
    clinicAddress: { type: String, default: '' },
    clinicMobile: { type: String, default: '' },
    clinicGst: { type: String, default: '' },
    invoiceType: { type: String, default: 'OPD' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patient: {
        id: mongoose.Schema.Types.Mixed,
        name: String,
        age: mongoose.Schema.Types.Mixed,
        phone: String,
        address: String,
    },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    isDraft: { type: Boolean, default: true },
    logoData: { type: String, default: '' },
    signatureData: { type: String, default: '' },
    stampData: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
