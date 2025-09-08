'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration object is now hardcoded to prevent environment variable loading issues.
// This is a public configuration and is safe to be exposed on the client-side.
// Security is enforced by Firebase Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyDKCoyihvMBQOqdlVI5hWzXEaTj39fgu_4",
  authDomain: "maestro-financeiro-r3xm8.firebaseapp.com",
  projectId: "maestro-financeiro-r3xm8",
  storageBucket: "maestro-financeiro-r3xm8.firebasestorage.app",
  messagingSenderId: "1064891174128",
  appId: "1:1064891174128:web:01bf56cadda86353008635",
  measurementId: ""
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check
if (typeof window !== 'undefined') {
  // Pass the key directly from process.env
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (recaptchaSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn("Firebase App Check: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set in environment variables.");
  }
}


const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
