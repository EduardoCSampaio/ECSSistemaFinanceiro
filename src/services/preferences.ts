'use client';

import { 
    doc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserPreferences } from "@/lib/types";

// This file is now unused as income is managed via recurring incomes.
// It is kept for potential future user preferences.

// Doc reference
const getPreferencesDoc = (userId: string) => doc(db, `users/${userId}/preferences`, 'general');

/**
 * Get user preferences from Firestore
 * @param userId - The ID of the user
 * @returns The user's preferences object or null if not found
 */
export const getPreferences = async (userId: string): Promise<UserPreferences | null> => {
    try {
        const docSnap = await getDoc(getPreferencesDoc(userId));
        if (docSnap.exists()) {
            return docSnap.data() as UserPreferences;
        }
        return null;
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return null;
    }
};

/**
 * Save user preferences to Firestore
 * @param userId - The ID of the user
 * @param preferences - The preferences object to save
 */
export const savePreferences = async (userId: string, preferences: UserPreferences) => {
    try {
        await setDoc(getPreferencesDoc(userId), preferences, { merge: true });
    } catch (error) {
        console.error("Error saving preferences:", error);
        throw error;
    }
};
