import API from './api';

export const getTherapies = async () => {
    const res = await API.get('/therapies');
    return res.data.data;
};

export const createTherapy = async (data) => {
    const res = await API.post('/therapies', data);
    return res.data.data;
};

export const updateTherapy = async (id, data) => {
    const res = await API.put(`/therapies/${id}`, data);
    return res.data.data;
};

export const deleteTherapy = async (id) => {
    await API.delete(`/therapies/${id}`);
};

export const logSession = async (id, sessionData) => {
    const therapy = await getTherapies(); // get current
    const t = therapy.find(x => x._id === id);
    if (!t) return;
    const completed = (t.completed || 0) + 1;
    const progress = Math.round((completed / t.sessions) * 100);
    const sessionsList = [...(t.sessionsList || []), { ...sessionData, date: new Date() }];
    const res = await API.put(`/therapies/${id}`, { completed, progress, sessionsList });
    return res.data.data;
};
