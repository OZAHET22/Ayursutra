const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { 
        type: String, 
        required: true,
        minlength: [10, 'Feedback must be at least 10 characters'],
        maxlength: [2000, 'Feedback cannot exceed 2000 characters']
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    replied: { type: Boolean, default: false },
    reply: { 
        type: String, 
        default: '',
        maxlength: [2000, 'Reply cannot exceed 2000 characters']
    },
    replyDate: { type: Date },
    isEdited: { type: Boolean, default: false },
    editHistory: [{
        content: String,
        editedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

// Compound index for efficient querying
FeedbackSchema.index({ doctorId: 1, createdAt: -1 });
FeedbackSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
