import API from './api';
import axios from 'axios';

// Public: fetch aggregated rating + recent reviews for a specific doctor (no auth required)
export const getDoctorPublicRating = async (doctorId) => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const res = await axios.get(`${baseUrl}/api/feedback/doctor/${doctorId}`);
    return res.data.data; // { doctor, rating, recentReviews }
};

export const getFeedback = async (page = 1, limit = 10) => {
    const res = await API.get('/feedback', { params: { page, limit } });
    return res.data;
};

export const getFeedbackById = async (id) => {
    const res = await API.get(`/feedback/${id}`);
    return res.data.data;
};

export const submitFeedback = async (data) => {
    const res = await API.post('/feedback', data);
    return res.data.data;
};

export const updateFeedback = async (id, data) => {
    const res = await API.put(`/feedback/${id}`, data);
    return res.data.data;
};

export const replyFeedback = async (id, reply) => {
    const res = await API.put(`/feedback/${id}/reply`, { reply });
    return res.data.data;
};

export const updateReply = async (id, reply) => {
    const res = await API.patch(`/feedback/${id}/reply`, { reply });
    return res.data.data;
};

export const deleteFeedback = async (id) => {
    const res = await API.delete(`/feedback/${id}`);
    return res.data;
};

export const validateFeedbackData = (feedback) => {
    const errors = [];

    if (!feedback.content || typeof feedback.content !== 'string') {
        errors.push('Feedback content is required');
    } else if (feedback.content.trim().length < 10) {
        errors.push('Feedback must be at least 10 characters');
    } else if (feedback.content.trim().length > 2000) {
        errors.push('Feedback cannot exceed 2000 characters');
    }

    if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
        errors.push('Rating must be between 1 and 5');
    }

    if (!feedback.doctorId) {
        errors.push('Doctor selection is required');
    }

    return errors;
};

export const validateReplyData = (reply) => {
    const errors = [];

    if (!reply || typeof reply !== 'string') {
        errors.push('Reply text is required');
    } else if (reply.trim().length < 5) {
        errors.push('Reply must be at least 5 characters');
    } else if (reply.trim().length > 2000) {
        errors.push('Reply cannot exceed 2000 characters');
    }

    return errors;
};
