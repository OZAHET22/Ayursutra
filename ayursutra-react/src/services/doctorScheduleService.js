import API from './api';

/**
 * Fetch the logged-in doctor's own schedule config.
 */
export async function getMySchedule() {
    const res = await API.get('/doctor-schedule');
    return res.data.data;
}

/**
 * Fetch any doctor's schedule config (public — used by SlotPicker & patient booking).
 * @param {string} doctorId
 */
export async function getDoctorSchedule(doctorId) {
    const res = await API.get(`/doctor-schedule/${doctorId}`);
    return res.data.data;
}

/**
 * Create or update the logged-in doctor's schedule config.
 * @param {object} config - Partial or full DoctorSchedule fields
 */
export async function saveMySchedule(config) {
    const res = await API.put('/doctor-schedule', config);
    return res.data.data;
}
