import API from './api';

export const getAppointments = async () => {
    const res = await API.get('/appointments');
    return res.data.data;
};

export const createAppointment = async (data) => {
    const res = await API.post('/appointments', data);
    return res.data.data;
};

export const updateAppointment = async (id, data) => {
    const res = await API.put(`/appointments/${id}`, data);
    return res.data;
};

export const deleteAppointment = async (id) => {
    const res = await API.delete(`/appointments/${id}`);
    return res.data;
};

export const bulkDeleteAppointments = async (filter) => {
    const res = await API.delete('/appointments/bulk/delete', { data: filter });
    return res.data;
};

/**
 * Fetch the full hourly slot grid (8AM–7PM) for a doctor on a given date.
 * Returns { slots: [{time, hour, booked, bookedBy, bookedType}], busyWindows, suggestions }
 */
export const getSlots = async (doctorId, date, duration = 60) => {
    const res = await API.get('/appointments/slots', { params: { doctorId, date, duration } });
    return res.data; // { success, slots, busyWindows, suggestions }
};


