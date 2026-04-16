import API from './api';

export const getDocuments = async (patientId = null) => {
    const url = patientId ? `/documents?patientId=${patientId}` : '/documents';
    const res = await API.get(url);
    return res.data.data;
};

export const uploadDocument = async (data) => {
    const res = await API.post('/documents', data);
    return res.data.data;
};

export const reviewDocument = async (id, notes = '') => {
    const res = await API.put(`/documents/${id}/review`, { notes });
    return res.data.data;
};

export const deleteDocument = async (id) => {
    await API.delete(`/documents/${id}`);
};
