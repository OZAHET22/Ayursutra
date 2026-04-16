const axios = require('axios');

/**
 * Validates a mobile number according to Indian formatting standards and blocks VoIP numbers.
 * @param {string} phone 
 * @returns { success: boolean, phone: string, code: string, message: string }
 */
async function validatePhone(phone) {
    if (!phone) {
        return { success: false, code: 'INVALID_FORMAT', message: 'Phone number is required.' };
    }

    // 1. Strip all non-numeric characters (except leading +)
    // Convert e.g., '+91 98765-43210' to '9876543210' or '+919876543210'
    let digitsOnly = phone.replace(/[^\d+]/g, '');

    // 2. Remove +91 or 91 or 0 prefix to get the raw 10-digit base
    if (digitsOnly.startsWith('+91')) {
        digitsOnly = digitsOnly.substring(3);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        digitsOnly = digitsOnly.substring(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
        digitsOnly = digitsOnly.substring(1);
    } else if (digitsOnly.startsWith('+') && !digitsOnly.startsWith('+91')) {
        return { success: false, code: 'INVALID_COUNTRY', message: 'Only Indian mobile numbers (+91) are supported.' };
    }

    // 3. Regex validation for standard Trai 10-digit formats (must start with 6,7,8,9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(digitsOnly)) {
        return { 
            success: false, 
            code: 'INVALID_NUMBER', 
            message: 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.' 
        };
    }

    // 4. Block obvious fake repetitive patterns (e.g., 9999999999, 8888888888)
    const repetitiveRegex = /^(\d)\1{9}$/;
    if (repetitiveRegex.test(digitsOnly)) {
        return { success: false, code: 'FAKE_NUMBER', message: 'This phone number pattern is highly suspicious and blocked.' };
    }

    // 5. Check VoIP via external API (Enabled only if API keys are set)
    // using NumVerify (placeholder) or Twilio Lookup (placeholder)
    try {
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

        if (twilioAccountSid && twilioAuthToken) {
            // Setup boilerplate for Twilio Lookup API
            const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
            const response = await axios.get(`https://lookups.twilio.com/v1/PhoneNumbers/%2B91${digitsOnly}?Type=carrier`, {
                headers: { 'Authorization': `Basic ${auth}` }
            });

            if (response.data && response.data.carrier && response.data.carrier.type === 'voip') {
                return { success: false, code: 'VOIP_BLOCKED', message: 'Virtual and VoIP numbers are not supported.' };
            }
        }
    } catch (err) {
        console.error('[PhoneValidator] VoIP Lookup API failed (non-fatal):', err.message);
        // Fail open if the external API fails to avoid blocking real users due to downtime
    }

    return { success: true, phone: `+91${digitsOnly}`, raw10: digitsOnly };
}

module.exports = { validatePhone };
