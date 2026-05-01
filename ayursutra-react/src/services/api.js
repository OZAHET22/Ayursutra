import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '';
const API = axios.create({
    baseURL: `${apiBase}/api`,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('ayursutra_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// Global response error handler
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error.response?.data?.message || '';
        // Only clear session if the token itself is invalid/expired
        // Do NOT clear on regular 401s (e.g. "not authorized for this route")
        if (error.response?.status === 401 &&
            (msg.includes('Token invalid') || msg.includes('no token') || msg.includes('not authorized, no token'))) {
            localStorage.removeItem('ayursutra_token');
            localStorage.removeItem('ayursutra_user');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);


export default API;
