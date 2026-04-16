import API from './api';

// ── Lightweight frontend copy of the disposable domain blocklist ─────────────
// (Same list as backend — applied before making any network call)
const BLOCKED_DOMAINS = new Set([
    'mailinator.com','guerrillamail.com','guerrillamail.info','guerrillamail.net',
    'guerrillamail.org','guerrillamail.biz','grr.la','tempmail.com','temp-mail.org',
    'temp-mail.io','tempmail.net','yopmail.com','yopmail.fr','10minutemail.com',
    '10minutemail.net','10minutemail.org','10minutemail.de','throwam.com',
    'trashmail.com','trashmail.at','trashmail.io','trashmail.me','trashmail.net',
    'dispostable.com','mailnull.com','maildrop.cc','sharklasers.com','spam4.me',
    'getnada.com','fakeinbox.com','throwaway.email','tempr.email','mailexpire.com',
    'spamgourmet.com','moakt.com','mintemail.com','emailondeck.com','tempinbox.com',
    'sofimail.com','binkmail.com','mailzilla.org','mailzilla.com','mailnesia.com',
    'trashdevil.com','trbvm.com','incognitomail.com','msgsafe.io','rcpt.at',
    'guerillamail.com','guerillamail.de','guerillamail.net','guerillamail.org',
    'spambox.us','jetable.com','jetable.net','jetable.org','jourrapide.com',
    'spamfired.com','spamhole.com','tempemail.net','discard.email','discardmail.com',
    'wegwerfmail.de','wegwerfmail.net','filzmail.com','fakemailgenerator.com',
    'fakemail.net','byom.de','zehnminutenmail.de','zoemail.net','nwldx.com',
    'spamfree24.org','mail2trash.com','spaml.com','quickinbox.com','lazyinbox.com',
]);

export function isDisposableEmail(email) {
    if (!email) return false;
    const domain = email.split('@')[1]?.toLowerCase()?.trim();
    if (!domain) return false;
    return BLOCKED_DOMAINS.has(domain);
}

// ── OTP API calls ─────────────────────────────────────────────────────────────

/**
 * Request OTP to be sent to email or phone.
 * @param {string} target (email or phone string)
 * @param {'email'|'phone'} targetType 
 * @param {'register'|'login'} purpose
 */
export async function sendOTP(target, targetType, purpose) {
    if (targetType === 'email' && isDisposableEmail(target)) {
        throw new Error('DISPOSABLE_EMAIL');
    }
    const res = await API.post('/otp/send', { target, targetType, purpose });
    return res.data;
}

/**
 * Verify the OTP the user typed — marks the OTP as USED.
 * Returns { success, verified, token, tokenType }
 * Use this for login/register OTP confirmation.
 */
export async function verifyOTP(target, targetType, code, purpose) {
    const res = await API.post('/otp/verify', {
        target,
        targetType,
        code: String(code).trim(),
        purpose,
    });
    return res.data;
}

/**
 * Check the OTP is correct WITHOUT consuming it (not marked as used).
 * Returns { success, valid }
 * Use this for the forgot-password pre-gate step, where the OTP must
 * remain valid for the final /auth/reset-password call to consume it.
 */
export async function checkOTP(target, targetType, code, purpose) {
    const res = await API.post('/otp/check', {
        target,
        targetType,
        code: String(code).trim(),
        purpose,
    });
    return res.data;
}
