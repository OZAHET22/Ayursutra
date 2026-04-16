import API from './api';

// Register new user.
// NOTE: deliberately does NOT write to localStorage here.
// AuthContext.register() handles localStorage only for non-doctor roles
// to prevent unapproved doctors from being auto-logged in on page refresh.
export const register = async (data) => {
    const res = await API.post('/auth/register', data);
    return res.data;
};

/**
 * Pre-registration email uniqueness check (called BEFORE sending OTP).
 * Returns { available: true } or { available: false, role, message }
 * Does NOT throw — errors are returned as { available: null, message }
 */
export const checkEmail = async (email) => {
    try {
        const res = await API.post('/auth/check-email', { email });
        return res.data; // { success, available, role?, message? }
    } catch (err) {
        // Network or server error — allow the flow to continue; server-side will catch duplicates
        return { available: null, message: err.response?.data?.message || 'Could not verify email. Proceeding...' };
    }
};

// Login — verifies credentials AND stores session (used by demo accounts / admin)
export const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.token) {
        localStorage.setItem('ayursutra_token', res.data.token);
        localStorage.setItem('ayursutra_user', JSON.stringify(res.data.user));
    }
    return res.data;
};

// Step-1 login: verify credentials WITHOUT storing session.
// Used when OTP is required — session is only stored after OTP is confirmed.
export const verifyCredentials = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    // Return data but do NOT write to localStorage
    return res.data; // { success, user, token }
};

// Step-2 login: persist a pre-verified session (called after OTP passes)
export const persistSession = (userData, token) => {
    localStorage.setItem('ayursutra_token', token);
    localStorage.setItem('ayursutra_user', JSON.stringify(userData));
};


// Get current user profile
export const getMe = async () => {
    const res = await API.get('/auth/me');
    return res.data;
};

// Logout — clear storage
export const logout = () => {
    localStorage.removeItem('ayursutra_token');
    localStorage.removeItem('ayursutra_user');
};

// Get stored user without API call
export const getStoredUser = () => {
    const u = localStorage.getItem('ayursutra_user');
    return u ? JSON.parse(u) : null;
};

export const getStoredToken = () => localStorage.getItem('ayursutra_token');
