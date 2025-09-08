'use server';

import { auth } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import {
  signInWithEmailAndPassword,
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

export async function signIn(data: any) {
  try {
    // Firebase Auth doesn't have a direct server-side signInWithEmailAndPassword
    // that returns an ID token directly. This is a workaround for server-side session creation.
    // In a real app, you'd typically handle sign-in on the client and post the ID token here.
    // For this example, we'll simulate the client-side token generation.
    // This part requires a custom solution or client-side interaction.
    // The placeholder below won't work directly in a real server action without client token.
    return { success: false, error: "Server-side sign-in needs client ID token." };

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
