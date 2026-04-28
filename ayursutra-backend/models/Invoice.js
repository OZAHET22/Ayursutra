const mongoose = require('mongoose');

// ── Line Item sub-document ────────────────────────────────────────────────────
const LineItemSchema = new mongoose.Schema({
    itemType: { type: String, default: 'Consultation' }, // Consultation | Therapy Package | Medicine | Room Charges
    itemName: { type: String, required: true },
    description: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    itemDiscount: { type: Number, default: 0, min: 0, max: 100 }, // per-item discount %
    gst: { type: Number, default: 0, min: 0 },                    // GST %
    lineTotal: { type: Number, default: 0 },                      // computed: qty × price × (1-disc/100) × (1+gst/100)
}, { _id: true });

// ── Invoice main schema ───────────────────────────────────────────────────────
const InvoiceSchema = new mongoose.Schema({

    // ── Meta ─────────────────────────────────────────────────────────────────
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceType: {
        type: String,
        enum: ['OPD', 'IPD', 'Medicine', 'Therapy'],
        required: true,
        default: 'OPD',
    },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    consultationType: {
        type: String,
        enum: ['In-Clinic', 'Online', 'Follow-up'],
        default: 'In-Clinic',
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Online', 'Insurance'],
        default: 'Cash',
    },

    // ── Clinic ────────────────────────────────────────────────────────────────
    clinicName: { type: String, default: 'Ayursutra Panchkarma Clinic' },
    clinicAddress: { type: String, default: '' },
    clinicMobile: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    clinicLogoBase64: { type: String, default: '' }, // base64 image

    // ── Doctor ────────────────────────────────────────────────────────────────
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },

    // ── Patient ───────────────────────────────────────────────────────────────
    // patientId can be a real ObjectId OR a temp string like "TEMP-1234" for walk-in patients
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientAge: { type: Number, default: null },
    patientPhone: { type: String, default: '' },
    patientAddress: { type: String, default: '' },
    isRegisteredPatient: { type: Boolean, default: true }, // false for walk-in / temp patients

    // ── Appointment link (optional) ───────────────────────────────────────────
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },

    // ── Line Items ────────────────────────────────────────────────────────────
    items: { type: [LineItemSchema], default: [] },

    // ── Totals ────────────────────────────────────────────────────────────────
    subtotal: { type: Number, default: 0 },       // Σ (qty × unitPrice)
    discountAmount: { type: Number, default: 0 }, // global discount ₹
    gstTotal: { type: Number, default: 0 },       // Σ GST amounts
    grandTotal: { type: Number, default: 0 },     // subtotal - discountAmount + gstTotal

    // ── Payment ───────────────────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Paid', 'Partial', 'Unpaid', 'Overdue', 'Cancelled', 'Finalized'],
        default: 'Draft',
    },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },    // grandTotal - paidAmount
    notes: { type: String, default: '' },

    // ── Signatures / Stamps (base64) ──────────────────────────────────────────
    signatureBase64: { type: String, default: '' },
    stampBase64: { type: String, default: '' },

    // ── Cron tracking ─────────────────────────────────────────────────────────
    overdueNotificationSent: { type: Boolean, default: false },

}, { timestamps: true });

// ── Virtual: auto-compute balance ─────────────────────────────────────────────
InvoiceSchema.pre('save', function (next) {
    this.balance = Math.max(0, this.grandTotal - this.paidAmount);
    next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
