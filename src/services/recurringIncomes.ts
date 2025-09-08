'use client';

import { 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    deleteDoc,
    doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RecurringIncome } from "@/lib/types";

// Collection and Doc references
const getRecurringIncomesCollection = (userId: string) => collection(db, `users/${userId}/recurringIncomes`);
const getRecurringIncomeDoc = (userId: string, docId: string) => doc(db, `users/${userId}/recurringIncomes`, docId);

/**
 * Add a new recurring income to Firestore
 * @param userId - The ID of the user
 * @param data - The data for the new recurring income
 */
export const addRecurringIncome = async (userId: string, data: Omit<RecurringIncome, 'id' | 'userId'>) => {
    try {
        const recurringCollection = getRecurringIncomesCollection(userId);
        await addDoc(recurringCollection, data);
    } catch (error) {
        console.error("Error adding recurring income:", error);
        throw error;
    }
};

/**
 * Delete a recurring income from Firestore
 * @param userId - The ID of the user
 * @param docId - The ID of the document to delete
 */
export const deleteRecurringIncome = async (userId: string, docId: string) => {
    try {
        await deleteDoc(getRecurringIncomeDoc(userId, docId));
    } catch (error) {
        console.error("Error deleting recurring income:", error);
        throw error;
    }
};


/**
 * Get all recurring incomes for a user with real-time updates
 * @param userId - The ID of the user
 * @param callback - Function to call with the recurring incomes data
 * @returns An unsubscribe function for the listener
 */
export const getRecurringIncomes = (userId: string, callback: (incomes: RecurringIncome[]) => void) => {
    const recurringCollection = getRecurringIncomesCollection(userId);
    const q = query(recurringCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const incomes: RecurringIncome[] = [];
        querySnapshot.forEach((doc) => {
            incomes.push({ id: doc.id, userId, ...doc.data() } as RecurringIncome);
        });
        callback(incomes);
    }, (error) => {
        console.error("Error fetching recurring incomes:", error);
    });

    return unsubscribe;
};
