'use client';

import { 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RecurringTransaction } from "@/lib/types";

// Collection reference
const getRecurringCollection = (userId: string) => {
    return collection(db, `users/${userId}/recurring`);
}

/**
 * Add a new recurring transaction to Firestore
 * @param userId - The ID of the user
 * @param data - The data for the new recurring transaction
 */
export const addRecurringTransaction = async (userId: string, data: Omit<RecurringTransaction, 'id' | 'userId'>) => {
    try {
        const recurringCollection = getRecurringCollection(userId);
        const docData = {
            ...data,
            startDate: Timestamp.fromDate(data.startDate as unknown as Date)
        }
        await addDoc(recurringCollection, docData);
    } catch (error) {
        console.error("Error adding recurring transaction:", error);
        throw error;
    }
};

/**
 * Get all recurring transactions for a user with real-time updates
 * @param userId - The ID of the user
 * @param callback - Function to call with the recurring transactions data
 * @returns An unsubscribe function for the listener
 */
export const getRecurringTransactions = (userId: string, callback: (transactions: RecurringTransaction[]) => void) => {
    const recurringCollection = getRecurringCollection(userId);
    const q = query(recurringCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: RecurringTransaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, userId, ...doc.data() } as RecurringTransaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Error fetching recurring transactions:", error);
    });

    return unsubscribe;
};
