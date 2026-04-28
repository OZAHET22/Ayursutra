import API from './api';

export const getPatients = async () => {
    try {
        const res = await API.get('/users/patients');
        return res.data.data || [];
    } catch (err) {
        console.error('[userService] getPatients failed:', err.response?.data?.message || err.message);
        return [];
    }
};

// Returns only patients connected to the requesting doctor (via appointments)
export const getMyPatients = async () => {
    try {
        const res = await API.get('/users/my-patients');
        return res.data.data || [];
    } catch (err) {
        console.error('[userService] getMyPatients failed:', err.response?.data?.message || err.message);
        return [];
    }
};


export const getDoctors = async () => {
    const res = await API.get('/users/doctors');
    return res.data.data;
};

// Feature 4: Fetch doctors filtered by specialization label (strict match)
export const getDoctorsBySpecialization = async (specialization) => {
    const res = await API.get('/users/doctors', {
        params: specialization ? { specialization } : {}
    });
    const doctors = res.data.data || [];
    // Client-side guard: enforce strict specialization match
    if (!specialization) return doctors;
    return doctors.filter(d =>
        (d.speciality || '').toLowerCase() === specialization.toLowerCase()
    );
};

export const getPendingDoctors = async () => {
    const res = await API.get('/users/doctors/pending');
    return res.data.data;
};

export const approveDoctor = async (id) => {
    const res = await API.put(`/users/${id}/approve`);
    return res.data.data;
};

/** Admin revokes a doctor — sets approved=false without deletion */
export const revokeDoctor = async (id) => {
    const res = await API.put(`/users/${id}/revoke`);
    return res.data.data;
};

export const updateUser = async (id, data) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data.data;
};

export const deleteUser = async (id) => {
    await API.delete(`/users/${id}`);
};

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

// ── Patient: change centre & doctor atomically ───────────────────────────────
export const reassignDoctor = async ({ newDoctorId, newCentreId, newCentreName, reason }) => {
    const res = await API.post('/users/reassign-doctor', { newDoctorId, newCentreId, newCentreName, reason });
    return res.data;
};

// ── Public: fetch all active centres ────────────────────────────────────────
export const getCentres = async () => {
    const res = await API.get('/centres');
    return res.data.data;
};
