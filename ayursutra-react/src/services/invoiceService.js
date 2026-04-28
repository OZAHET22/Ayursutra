import API from './api';

// ── Invoice CRUD ───────────────────────────────────────────────────────────────

/** Fetch all invoices for the logged-in user (doctor sees their own; patient sees non-draft) */
export const getInvoices = async () => {
    const res = await API.get('/invoices');
    return res.data.data;
};

/** Fetch a single invoice by ID */
export const getInvoiceById = async (id) => {
    const res = await API.get(`/invoices/${id}`);
    return res.data.data;
};

/** Create a new invoice */
export const createInvoice = async (invoiceData) => {
    const res = await API.post('/invoices', invoiceData);
    return res.data.data;
};

/** Update an existing invoice */
export const updateInvoice = async (id, data) => {
    const res = await API.put(`/invoices/${id}`, data);
    return res.data.data;
};

/** Delete an invoice (doctor/admin only; not allowed on Finalized) */
export const deleteInvoice = async (id) => {
    const res = await API.delete(`/invoices/${id}`);
    return res.data;
};

/** Get the next auto-generated invoice number */
export const getNextInvoiceNumber = async () => {
    const res = await API.get('/invoices/next-number');
    return res.data.invoiceNumber;
};

/** Get stat card summaries for the doctor dashboard */
export const getInvoiceStats = async () => {
    const res = await API.get('/invoices/stats/summary');
    return res.data.data;
};
