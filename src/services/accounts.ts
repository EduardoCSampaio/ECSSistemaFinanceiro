'use client';

import { 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Account } from "@/lib/types";

// Collection and Doc references
const getAccountsCollection = (userId: string) => collection(db, `users/${userId}/accounts`);
const getAccountDoc = (userId: string, accountId: string) => doc(db, `users/${userId}/accounts`, accountId);

/**
 * Add a new account to Firestore
 */
export const addAccount = async (userId: string, accountData: Omit<Account, 'id' | 'userId'>) => {
    try {
        await addDoc(getAccountsCollection(userId), accountData);
    } catch (error) {
        console.error("Error adding account:", error);
        throw error;
    }
};

/**
 * Update an existing account in Firestore
 */
export const updateAccount = async (userId: string, accountId: string, accountData: Partial<Omit<Account, 'id' | 'userId'>>) => {
    try {
        await updateDoc(getAccountDoc(userId, accountId), accountData);
    } catch (error) {
        console.error("Error updating account:", error);
        throw error;
    }
};

/**
 * Delete an account from Firestore
 */
export const deleteAccount = async (userId: string, accountId: string) => {
    try {
        await deleteDoc(getAccountDoc(userId, accountId));
    } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
    }
};

/**
 * Get all accounts for a user with real-time updates
 */
export const getAccounts = (userId: string, callback: (accounts: Account[]) => void) => {
    const q = query(getAccountsCollection(userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const accounts: Account[] = [];
        querySnapshot.forEach((doc) => {
            accounts.push({ id: doc.id, ...doc.data() } as Account);
        });
        callback(accounts);
    }, (error) => {
        console.error("Error fetching accounts:", error);
    });

    return unsubscribe;
};
