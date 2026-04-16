const mongoose = require('mongoose');

const CentreSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Centre', CentreSchema);
