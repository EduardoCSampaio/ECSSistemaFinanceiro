'use server';

import { auth } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';

async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: true,
  });
}

export async function signUp(data: any) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    // You can handle user creation logic here, like saving to Firestore
    return { success: true, userId: userCredential.user.uid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// In a real app, you'd typically handle sign-in on the client and post the ID token here.
// For this example, we'll simulate the client-side token generation.
// This part requires a custom solution or client-side interaction.
// The placeholder below won't work directly in a real server action without client token.
export async function signIn(data: { token: string }) {
    try {
        if (!process.env.RECAPTCHA_SECRET_KEY) {
            console.error("RECAPTCHA_SECRET_KEY is not set");
            return { success: false, error: "Configuração do servidor incompleta." };
        }

        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${data.token}`,
        });
        const recaptchaResponse = await response.json();
        
        if (!recaptchaResponse.success || recaptchaResponse.score < 0.5) {
            return { success: false, error: "Falha na verificação do reCAPTCHA." };
        }

        // Since we can't directly sign in on the server with email/password to get an ID token,
        // this part remains conceptual for server actions.
        // The actual sign-in will be client-side, and this action could be used to create a session
        // if the ID token were passed from the client.
        return { success: true, needsClientLogin: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function signOut() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
    try {
        const sessionCookie = cookies().get(SESSION_COOKIE_NAME);
        if (!sessionCookie) return null;
        const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
        return decodedClaims;
    } catch (error) {
        return null;
    }
}
