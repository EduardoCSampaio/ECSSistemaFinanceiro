'use client';

import { 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    Timestamp,
    where,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Budget, BudgetWithSpent, Transaction } from "@/lib/types";

// Collection references
const getBudgetsCollection = (userId: string) => collection(db, `users/${userId}/budgets`);
const getBudgetDoc = (userId: string, budgetId: string) => doc(db, `users/${userId}/budgets`, budgetId);
const getTransactionsCollection = (userId: string) => collection(db, `users/${userId}/transactions`);

/**
 * Add a new budget to Firestore
 * @param userId - The ID of the user
 * @param budgetData - The data for the new budget
 */
export const addBudget = async (userId: string, budgetData: Omit<Budget, 'id' | 'userId'>) => {
    try {
        await addDoc(getBudgetsCollection(userId), budgetData);
    } catch (error) {
        console.error("Error adding budget:", error);
        throw error;
    }
};

/**
 * Update an existing budget in Firestore
 */
export const updateBudget = async (userId: string, budgetId: string, budgetData: Partial<Omit<Budget, 'id' | 'userId'>>) => {
    try {
        await updateDoc(getBudgetDoc(userId, budgetId), budgetData);
    } catch (error) {
        console.error("Error updating budget:", error);
        throw error;
    }
};

/**
 * Delete a budget from Firestore
 */
export const deleteBudget = async (userId: string, budgetId: string) => {
    try {
        await deleteDoc(getBudgetDoc(userId, budgetId));
    } catch (error) {
        console.error("Error deleting budget:", error);
        throw error;
    }
};


/**
 * Get all budgets for a user and calculate spent amount in real-time
 * @param userId - The ID of the user
 * @param callback - Function to call with the budget data (including spent amount)
 * @returns An unsubscribe function for the listeners
 */
export const getBudgetsWithSpent = (userId: string, callback: (budgets: BudgetWithSpent[]) => void) => {
    const budgetsCollection = getBudgetsCollection(userId);
    const qBudgets = query(budgetsCollection);

    let unsubscribeTransactions = () => {};

    const unsubscribeBudgets = onSnapshot(qBudgets, (budgetSnapshot) => {
        const budgets = budgetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
        
        // Unsubscribe from previous transaction listener
        unsubscribeTransactions();

        if (budgets.length === 0) {
            callback([]);
            return;
        }

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

        const transactionsCollection = getTransactionsCollection(userId);
        const qTransactions = query(
            transactionsCollection, 
            where("type", "==", "expense"),
            where("date", ">=", startOfMonthTimestamp)
        );

        unsubscribeTransactions = onSnapshot(qTransactions, (transactionSnapshot) => {
            const transactions = transactionSnapshot.docs.map(doc => doc.data() as Transaction);

            const budgetsWithSpent = budgets.map(budget => {
                const spent = transactions
                    .filter(t => t.categoryId === budget.categoryId)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                
                return { ...budget, spent };
            });

            callback(budgetsWithSpent);
        }, (error) => {
            console.error("Error fetching transactions for budgets:", error);
        });

    }, (error) => {
        console.error("Error fetching budgets:", error);
    });

    return () => {
        unsubscribeBudgets();
        unsubscribeTransactions();
    };
};
