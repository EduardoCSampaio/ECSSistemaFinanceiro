'use client';

import { 
    collection, 
    addDoc, 
    query,
    onSnapshot,
    runTransaction,
    doc,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/lib/types";

// Collection reference
const getTransactionsCollection = (userId: string) => collection(db, `users/${userId}/transactions`);
const getAccountDoc = (userId: string, accountId: string) => doc(db, `users/${userId}/accounts`, accountId);

/**
 * Add a new transaction and update the account balance in a single operation
 * @param userId - The ID of the user
 * @param transactionData - The data for the new transaction
 */
export const addTransaction = async (userId: string, transactionData: Omit<Transaction, 'id' | 'userId'>) => {
    const accountDocRef = getAccountDoc(userId, transactionData.accountId);
    const transactionsCollectionRef = getTransactionsCollection(userId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            // 1. Get the current account balance
            const accountDoc = await firestoreTransaction.get(accountDocRef);
            if (!accountDoc.exists()) {
                throw "Account does not exist!";
            }
            const currentBalance = accountDoc.data().balance;

            // 2. Calculate the new balance
            const amount = transactionData.amount;
            const newBalance = transactionData.type === 'income'
                ? currentBalance + amount
                : currentBalance - amount;

            // 3. Update the account balance
            firestoreTransaction.update(accountDocRef, { balance: newBalance });

            // 4. Add the new transaction document
            const newTransactionDoc = {
                ...transactionData,
                date: Timestamp.fromDate(transactionData.date as unknown as Date)
            };
            firestoreTransaction.set(doc(transactionsCollectionRef), newTransactionDoc);
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
};


/**
 * Get all transactions for a user with real-time updates
 * @param userId - The ID of the user
 *_param callback - Function to call with the transactions data
 * @returns An unsubscribe function for the listener
 */
export const getTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
    const transactionsCollection = getTransactionsCollection(userId);
    const q = query(transactionsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, userId, ...doc.data() } as Transaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Error fetching transactions:", error);
    });

    return unsubscribe;
};
