import API from './api';

export const getFeedback = async () => {
    const res = await API.get('/feedback');
    return res.data.data;
};

export const submitFeedback = async (data) => {
    const res = await API.post('/feedback', data);
    return res.data.data;
};

export const replyFeedback = async (id, reply) => {
    const res = await API.put(`/feedback/${id}/reply`, { reply });
    return res.data.data;
};

export const deleteFeedback = async (id) => {
    await API.delete(`/feedback/${id}`);
};
