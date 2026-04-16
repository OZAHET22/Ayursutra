import API from './api';

/**
 * Request a forgot-password OTP to be sent to the given email.
 * @param {string} email
 */
export async function forgotPassword(email) {
    const res = await API.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    return res.data;
}

/**
 * Verify OTP and set a new password.
 * @param {string} email
 * @param {string} otp  - 6-digit code from email
 * @param {string} newPassword
 */
export async function resetPassword(email, otp, newPassword) {
    const res = await API.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: String(otp).trim(),
        newPassword,
    });
    return res.data;
}
