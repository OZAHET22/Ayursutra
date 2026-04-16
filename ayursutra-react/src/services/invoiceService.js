import API from './api';

export const getInvoices = async () => {
    const res = await API.get('/invoices');
    return res.data.data;
};

export const createInvoice = async (data) => {
    const res = await API.post('/invoices', data);
    return res.data.data;
};

export const updateInvoice = async (id, data) => {
    const res = await API.put(`/invoices/${id}`, data);
    return res.data.data;
};

export const updateInvoiceStatus = async (id, paymentStatus, paidAmount) => {
    const res = await API.patch(`/invoices/${id}/status`, { paymentStatus, paidAmount });
    return res.data.data;
};

export const deleteInvoice = async (id) => {
    await API.delete(`/invoices/${id}`);
};
