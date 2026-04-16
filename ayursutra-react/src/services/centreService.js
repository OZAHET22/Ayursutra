import API from './api';

export const getCentres = async () => {
    const res = await API.get('/centres');
    return res.data.data;
};

export const addCentre = async (name) => {
    const res = await API.post('/centres', { name });
    return res.data;
};

export const removeCentre = async (id) => {
    const res = await API.delete(`/centres/${id}`);
    return res.data;
};
