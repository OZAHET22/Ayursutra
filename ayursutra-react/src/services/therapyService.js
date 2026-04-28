import API from './api';

export const getTherapies = async () => {
    try {
        const res = await API.get('/therapies');
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    } catch (err) {
        console.error('[therapyService] getTherapies failed:', err.response?.data?.message || err.message);
        return []; // Always return array so callers never crash
    }
};

export const createTherapy = async (data) => {
    try {
        const res = await API.post('/therapies', data);
        return res.data?.data || res.data;
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to create therapy';
        throw new Error(msg);
    }
};

export const updateTherapy = async (id, data) => {
    try {
        const res = await API.put(`/therapies/${id}`, data);
        return res.data?.data || res.data;
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to update therapy';
        throw new Error(msg);
    }
};

export const deleteTherapy = async (id) => {
    try {
        await API.delete(`/therapies/${id}`);
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to delete therapy';
        throw new Error(msg);
    }
};

export const logSession = async (id, sessionData) => {
    try {
        const therapy = await getTherapies();
        const t = therapy.find(x => x._id === id);
        if (!t) return;
        const completed = (t.completed || 0) + 1;
        const progress = Math.round((completed / t.sessions) * 100);
        const sessionsList = [...(t.sessionsList || []), { ...sessionData, date: new Date() }];
        const res = await API.put(`/therapies/${id}`, { completed, progress, sessionsList });
        return res.data?.data || res.data;
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to log session';
        throw new Error(msg);
    }
};
