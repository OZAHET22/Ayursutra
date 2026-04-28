import API from './api';

export const getTrackingTherapies = async () => {
    const res = await API.get('/tracking/therapies');
    return res.data.data;
};

export const addMilestone = async (data) => {
    const res = await API.post('/tracking/milestone', data);
    return res.data;
};

export const submitFeedback = async (data) => {
    const res = await API.post('/tracking/feedback', data);
    return res.data;
};

export const updatePractitionerNotes = async (therapyId, notes) => {
    const res = await API.put(`/tracking/practitioner-notes/${therapyId}`, { notes });
    return res.data.data;
};

export const getSessionStatus = async (appointmentId) => {
    const res = await API.get(`/tracking/session/${appointmentId}`);
    return res.data.data;
};

export const getAvailableSlots = async (doctorId, date) => {
    const res = await API.get('/appointments/slots', { params: { doctorId, date } });
    return res.data;
};

export const saveSessionNotes = async (appointmentId, notes) => {
    const res = await API.post(`/appointments/${appointmentId}/notes`, { notes });
    return res.data.data;
};

export const logSymptoms = async (appointmentId, data) => {
    const res = await API.post(`/appointments/${appointmentId}/symptom-log`, data);
    return res.data.data;
};

export const updateChecklistItem = async (appointmentId, itemId, done) => {
    const res = await API.put(`/appointments/${appointmentId}/checklist-item`, { itemId, done });
    return res.data.data;
};

// Gap 2: doctor action on a symptom entry
export const saveSymptomAction = async (therapyId, payload) => {
    const res = await API.patch(`/tracking/${therapyId}/symptom-action`, payload);
    return res.data;
};

// Gap 3: fetch chart data for a therapy
export const getProgressData = async (therapyId) => {
    const res = await API.get(`/tracking/${therapyId}/progress-data`);
    return res.data.data;
};

// ── Therapy Slots (per-patient session scheduling) ───────────────────────────

// Doctor: fetch all slots for a therapy
export const getTherapySlots = async (therapyId) => {
    try {
        const res = await API.get(`/tracking/therapy-slots/${therapyId}`);
        return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
        console.warn('[trackingService] getTherapySlots failed:', err.response?.data?.message || err.message);
        return [];
    }
};

// Doctor: save/replace all slots for a therapy
export const saveTherapySlots = async (therapyId, slots) => {
    const res = await API.post(`/tracking/therapy-slots/${therapyId}`, { slots });
    return res.data.data;
};

// Doctor: update single slot status
export const updateTherapySlotStatus = async (therapyId, slotIndex, status, notes) => {
    const res = await API.patch(`/tracking/therapy-slots/${therapyId}/${slotIndex}`, { status, notes });
    return res.data.data;
};
