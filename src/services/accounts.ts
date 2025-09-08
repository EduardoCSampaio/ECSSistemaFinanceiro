'use client';

import { 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Account } from "@/lib/types";

// Collection reference
const getAccountsCollection = (userId: string) => {
    return collection(db, `users/${userId}/accounts`);
}

/**
 * Add a new account to Firestore
 * @param userId - The ID of the user
 * @param accountData - The data for the new account
 */
export const addAccount = async (userId: string, accountData: Omit<Account, 'id' | 'userId'>) => {
    try {
        const accountsCollection = getAccountsCollection(userId);
        await addDoc(accountsCollection, accountData);
    } catch (error) {
        console.error("Error adding account:", error);
        // Optionally, re-throw the error or handle it as needed
        throw error;
    }
};

/**
 * Get all accounts for a user with real-time updates
 * @param userId - The ID of the user
 * @param callback - Function to call with the accounts data
 * @returns An unsubscribe function for the listener
 */
export const getAccounts = (userId: string, callback: (accounts: Account[]) => void) => {
    const accountsCollection = getAccountsCollection(userId);
    const q = query(accountsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const accounts: Account[] = [];
        querySnapshot.forEach((doc) => {
            accounts.push({ id: doc.id, userId, ...doc.data() } as Account);
        });
        callback(accounts);
    }, (error) => {
        console.error("Error fetching accounts:", error);
    });

    return unsubscribe;
};
