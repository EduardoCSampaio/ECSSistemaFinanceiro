import admin from 'firebase-admin';

// This file is intended for server-side code (e.g., Next.js API Routes or Server Actions)
// It is NOT safe to expose the service account key to the client.

try {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
} catch (error) {
    console.error('Firebase server initialization error:', error);
    // You might want to throw the error or handle it in a way that
    // doesn't crash the entire application if the server-side SDK is not critical
    // for all parts of your app.
}


export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
