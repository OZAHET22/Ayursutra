import API from './api';

// ── Doctor APIs ─────────────────────────────────────────────────────────────

/** Get all prescriptions written by the logged-in doctor */
export const getDoctorPrescriptions = (params = {}) =>
    API.get('/prescriptions', { params }).then(r => r.data.data || []);

/** Create a new prescription */
export const createPrescription = (payload) =>
    API.post('/prescriptions', payload).then(r => r.data.data);

/** Update an existing prescription */
export const updatePrescription = (id, payload) =>
    API.put(`/prescriptions/${id}`, payload).then(r => r.data.data);

/** Mark a prescription active or completed */
export const updatePrescriptionStatus = (id, status) =>
    API.patch(`/prescriptions/${id}/status`, { status }).then(r => r.data.data);

/** Delete a prescription */
export const deletePrescription = (id) =>
    API.delete(`/prescriptions/${id}`).then(r => r.data);

// ── Patient APIs ─────────────────────────────────────────────────────────────

/** Get all prescriptions for the logged-in patient */
export const getMyPrescriptions = () =>
    API.get('/prescriptions').then(r => r.data.data || []);

/** Get a single prescription by ID */
export const getPrescriptionById = (id) =>
    API.get(`/prescriptions/${id}`).then(r => r.data.data);
