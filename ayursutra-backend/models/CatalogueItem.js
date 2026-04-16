const mongoose = require('mongoose');

const CatalogueItemSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['Medicine', 'Therapy', 'Consultation', 'Room Charges'],
        required: true,
    },
    name:   { type: String, required: true, trim: true },
    desc:   { type: String, default: '' },
    price:  { type: Number, required: true, default: 0 },
    gst:    { type: Number, default: 18 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compound unique index — same doctor can't have two items with exact same name+type
CatalogueItemSchema.index({ doctorId: 1, type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CatalogueItem', CatalogueItemSchema);
