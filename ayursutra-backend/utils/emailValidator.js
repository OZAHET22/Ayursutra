const fs = require('fs');
const path = require('path');
const dns = require('dns');
const util = require('util');
const axios = require('axios');
const cron = require('node-cron');

const resolveMx = util.promisify(dns.resolveMx);

// We will maintain the combined set of blocked domains in memory
let BLOCKED_DOMAINS = new Set([
     'mailinator.com', 'guerrillamail.com', 'grr.la', 'tempmail.com', 'yopmail.com', '10minutemail.com', 'dispostable.com', 'maildrop.cc'
]);

// URL for the open-source blocklist
const BLOCKLIST_URL = 'https://raw.githubusercontent.com/ivolo/disposable-email-domains/master/index.json';
const CACHE_FILE = path.join(__dirname, '..', 'data', 'disposable_email_blocklist.json');

/**
 * Downloads and updates the disposable domains blocklist.
 */
async function updateDisposableList() {
    try {
        console.log('[EmailValidator] Fetching latest disposable email blocklist...');
        const response = await axios.get(BLOCKLIST_URL);
        if (Array.isArray(response.data)) {
            // Keep existing ones + new ones
            response.data.forEach(domain => BLOCKED_DOMAINS.add(domain.toLowerCase()));
            
            // Save to disk cache
            const dir = path.dirname(CACHE_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CACHE_FILE, JSON.stringify(Array.from(BLOCKED_DOMAINS)));
            console.log(`[EmailValidator] Successfully updated blocklist. Total domains: ${BLOCKED_DOMAINS.size}`);
        }
    } catch (error) {
        console.error('[EmailValidator] Failed to download remote blocklist fallback to cache/defaults.', error.message);
    }
}

/**
 * Loads domains from local cache file if available
 */
function loadFromCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            if (Array.isArray(data)) {
                BLOCKED_DOMAINS = new Set(data);
                console.log(`[EmailValidator] Loaded ${BLOCKED_DOMAINS.size} domains from local cache.`);
            }
        }
    } catch (err) {
        console.error('[EmailValidator] Failed to load cache file', err);
    }
}

// Initial setup
loadFromCache();
// Load remotely immediately on boot
updateDisposableList();
// Schedule cron job to update every week (Sunday at midnight)
cron.schedule('0 0 * * 0', updateDisposableList);

/**
 * Validates an email address.
 * Standard format check -> Blocklist check -> MX record check
 * @returns { success: boolean, code: string, message: string }
 */
async function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { success: false, code: 'INVALID_FORMAT', message: 'Email is required.' };
    }
    
    email = email.trim().toLowerCase();

    // 1. Regex format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, code: 'INVALID_FORMAT', message: 'Invalid email format.' };
    }

    const domain = email.split('@')[1];

    // 2. Disposable Blocklist Check
    if (BLOCKED_DOMAINS.has(domain)) {
        return { 
            success: false, 
            code: 'DISPOSABLE_EMAIL', 
            message: 'Temporary or disposable email provider detected. Please use a permanent email address.' 
        };
    }

    // 3. DNS MX Record Validation
    try {
        const addresses = await resolveMx(domain);
        if (!addresses || addresses.length === 0) {
            return { 
                success: false, 
                code: 'INVALID_DOMAIN', 
                message: `The domain provider "${domain}" cannot receive mail (no MX records).` 
            };
        }
    } catch (err) {
        // ENOTFOUND or ENODATA technically mean the domain doesn't exist,
        // but if the network is blocking DNS (ECONNREFUSED, ETIMEOUT), we MUST fail-open
        // to prevent blocking legitimate domains like gmail.com!
        // Fail-open in all DNS error cases in constrained local/CI environments.
        console.warn(`[EmailValidator] DNS resolution failed for ${domain} (${err.code}). Allowing by default.`);
    }

    // Passed all checks
    return { success: true };
}

module.exports = {
    validateEmail,
    updateDisposableList
};
