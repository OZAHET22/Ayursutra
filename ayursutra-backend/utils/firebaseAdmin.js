/**
 * firebaseAdmin.js
 * Initializes Firebase Admin SDK using service account credentials from .env.
 * Used to:
 *   1. Create Firebase Custom Tokens (post OTP verification)
 *   2. Verify Firebase ID Tokens sent from the React frontend
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
    // Support two config styles:
    //   A) FIREBASE_SERVICE_ACCOUNT_JSON env var (JSON string of the service account)
    //   B) Individual env vars FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_PROJECT_ID) {
        credential = admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // newlines in .env need to be restored
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        });
    } else {
        // No Firebase config — OTP system will still work but tokens won't be Firebase JWTs.
        // Backend will fall back to regular JWT.
        console.warn('[firebaseAdmin] No Firebase credentials found in .env — using fallback JWT mode.');
        credential = null;
    }

    if (credential) {
        admin.initializeApp({ credential });
        console.log('[firebaseAdmin] Firebase Admin SDK initialized ✓');
    }
}

module.exports = admin;
