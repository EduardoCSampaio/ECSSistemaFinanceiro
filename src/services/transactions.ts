'use client';

import { 
    collection, 
    addDoc, 
    query,
    onSnapshot,
    runTransaction,
    doc,
    Timestamp,
    updateDoc,
    deleteDoc,
    writeBatch,
    getDoc,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';


// Collection and Doc references
const getTransactionsCollection = (userId: string) => collection(db, `users/${userId}/transactions`);
const getTransactionDoc = (userId: string, transactionId: string) => doc(db, `users/${userId}/transactions`, transactionId);
const getAccountDoc = (userId: string, accountId: string) => doc(db, `users/${userId}/accounts`, accountId);

/**
 * Add a new transaction and update the account balance in a single operation
 */
export const addTransaction = async (userId: string, transactionData: Omit<Transaction, 'id' | 'userId'>) => {
    const accountDocRef = getAccountDoc(userId, transactionData.accountId);
    const transactionsCollectionRef = getTransactionsCollection(userId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const accountDoc = await firestoreTransaction.get(accountDocRef);
            if (!accountDoc.exists()) throw "Account does not exist!";
            
            const currentBalance = accountDoc.data().balance;
            const amount = transactionData.amount;
            const newBalance = transactionData.type === 'income' ? currentBalance + amount : currentBalance - amount;

            firestoreTransaction.update(accountDocRef, { balance: newBalance });

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
 * Add a new transfer between accounts.
 * This creates two transactions (one expense, one income) and updates both account balances.
 */
export const addTransfer = async (userId: string, transferData: { fromAccountId: string, toAccountId: string, amount: number, date: Date }) => {
    const { fromAccountId, toAccountId, amount, date } = transferData;
    const fromAccountRef = getAccountDoc(userId, fromAccountId);
    const toAccountRef = getAccountDoc(userId, toAccountId);
    const transactionsCollectionRef = getTransactionsCollection(userId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const fromAccountDoc = await firestoreTransaction.get(fromAccountRef);
            const toAccountDoc = await firestoreTransaction.get(toAccountRef);

            if (!fromAccountDoc.exists()) throw `Origin account ${fromAccountId} does not exist!`;
            if (!toAccountDoc.exists()) throw `Destination account ${toAccountId} does not exist!`;

            // Update balances
            const fromAccountBalance = fromAccountDoc.data().balance;
            const toAccountBalance = toAccountDoc.data().balance;
            firestoreTransaction.update(fromAccountRef, { balance: fromAccountBalance - amount });
            firestoreTransaction.update(toAccountRef, { balance: toAccountBalance + amount });

            const transferId = uuidv4();
            const transactionTimestamp = Timestamp.fromDate(date);

            // Create expense transaction
            const expenseTransaction: Omit<Transaction, 'id' | 'userId'> = {
                accountId: fromAccountId,
                amount,
                categoryId: 'cat15', // Transfer category
                date: transactionTimestamp,
                description: `Transferência para ${toAccountDoc.data().name}`,
                type: 'expense',
                transferId,
            };
            firestoreTransaction.set(doc(transactionsCollectionRef), expenseTransaction);

            // Create income transaction
            const incomeTransaction: Omit<Transaction, 'id' | 'userId'> = {
                accountId: toAccountId,
                amount,
                categoryId: 'cat15', // Transfer category
                date: transactionTimestamp,
                description: `Transferência de ${fromAccountDoc.data().name}`,
                type: 'income',
                transferId,
            };
            firestoreTransaction.set(doc(transactionsCollectionRef), incomeTransaction);
        });
    } catch (error) {
        console.error("Transfer failed: ", error);
        throw error;
    }
};

/**
 * Add multiple transactions and update account balances in a batch
 */
export const addTransactionsBatch = async (userId: string, transactionsData: Omit<Transaction, 'id' | 'userId'>[]) => {
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const transactionsCollectionRef = getTransactionsCollection(userId);
            const accountBalances: { [key: string]: number } = {};

            // Pre-fetch all necessary account balances to avoid multiple reads of the same doc
            const accountIds = [...new Set(transactionsData.map(t => t.accountId))];
            const accountDocs = await Promise.all(accountIds.map(async (id) => {
                const docRef = getAccountDoc(userId, id);
                const docSnap = await firestoreTransaction.get(docRef);
                 if (!docSnap.exists()) throw `Account ${id} does not exist!`;
                return { id, data: docSnap.data() };
            }));

            accountDocs.forEach(doc => {
                accountBalances[doc.id] = doc.data.balance;
            });
            
            // Process each transaction
            transactionsData.forEach(transactionData => {
                const { accountId, type, amount } = transactionData;
                
                // Add new transaction document to the batch
                 const newTransactionDoc = {
                    ...transactionData,
                    date: Timestamp.fromDate(transactionData.date as unknown as Date)
                };
                firestoreTransaction.set(doc(transactionsCollectionRef), newTransactionDoc);
                
                // Calculate new balance locally
                const balanceChange = type === 'income' ? amount : -amount;
                accountBalances[accountId] += balanceChange;
            });
            
            // Update all account balances in the batch
            for (const accountId in accountBalances) {
                const accountDocRef = getAccountDoc(userId, accountId);
                firestoreTransaction.update(accountDocRef, { balance: accountBalances[accountId] });
            }
        });

    } catch (error) {
        console.error("Batch transaction failed: ", error);
        throw error;
    }
};



/**
 * Update an existing transaction and adjust account balances accordingly
 */
export const updateTransaction = async (userId: string, transactionId: string, updatedData: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    const transactionDocRef = getTransactionDoc(userId, transactionId);
    
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const transactionDoc = await firestoreTransaction.get(transactionDocRef);
            if (!transactionDoc.exists()) throw "Transaction does not exist!";
            
            const oldTransaction = transactionDoc.data() as Transaction;
            const oldAmount = oldTransaction.type === 'income' ? oldTransaction.amount : -oldTransaction.amount;
            
            // Revert old transaction from its account
            const oldAccountRef = getAccountDoc(userId, oldTransaction.accountId);
            const oldAccountDoc = await firestoreTransaction.get(oldAccountRef);
            if (!oldAccountDoc.exists()) throw `Old account ${oldTransaction.accountId} not found!`;
            firestoreTransaction.update(oldAccountRef, { balance: oldAccountDoc.data().balance - oldAmount });

            // Apply new transaction to its account (might be the same or different)
            const newTransaction = { ...oldTransaction, ...updatedData };
            const newAmount = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
            const newAccountRef = getAccountDoc(userId, newTransaction.accountId);
            const newAccountDoc = await firestoreTransaction.get(newAccountRef);
            if (!newAccountDoc.exists()) throw `New account ${newTransaction.accountId} not found!`;
            firestoreTransaction.update(newAccountRef, { balance: newAccountDoc.data().balance + newAmount });

            // Finally, update the transaction document itself
            const finalUpdateData = {
                ...updatedData,
                date: updatedData.date ? Timestamp.fromDate(updatedData.date as unknown as Date) : oldTransaction.date,
            };
            firestoreTransaction.update(transactionDocRef, finalUpdateData);
        });
    } catch (error) {
        console.error("Update transaction failed: ", error);
        throw error;
    }
}


/**
 * Delete a transaction and revert the balance change on the associated account
 * If it's a transfer, delete both linked transactions.
 */
export const deleteTransaction = async (userId: string, transactionId: string) => {
    const transactionDocRef = getTransactionDoc(userId, transactionId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const transactionDoc = await firestoreTransaction.get(transactionDocRef);
            if (!transactionDoc.exists()) throw "Transaction does not exist!";

            const transactionToDelete = transactionDoc.data() as Transaction;
            
            // If it's a transfer, find and delete the other part too
            if (transactionToDelete.transferId) {
                const q = query(getTransactionsCollection(userId), where("transferId", "==", transactionToDelete.transferId));
                const querySnapshot = await getDocs(q);
                
                querySnapshot.forEach(doc => {
                    const t = doc.data() as Transaction;
                    const amountToRevert = t.type === 'income' ? -t.amount : t.amount;
                    const accountRef = getAccountDoc(userId, t.accountId);
                    
                    // We don't need to get the account doc again inside the loop for balance update,
                    // we can just prepare the update. The transaction runner will handle consistency.
                    firestoreTransaction.update(accountRef, { balance: doc.ref.parent.parent ? (getDoc(accountRef).then(d => d.data()?.balance || 0)) : 0 + amountToRevert });
                    firestoreTransaction.delete(doc.ref);
                });

                const batch = writeBatch(db);
                querySnapshot.forEach(async (doc) => {
                    const t = doc.data() as Transaction;
                    const amountToRevert = t.type === 'income' ? -t.amount : t.amount;
                    const accountRef = getAccountDoc(userId, t.accountId);
                    
                    const accountSnap = await firestoreTransaction.get(accountRef);
                    if (accountSnap.exists()) {
                        firestoreTransaction.update(accountRef, { balance: accountSnap.data().balance + amountToRevert });
                    }
                    firestoreTransaction.delete(doc.ref);
                });

            } else {
                 const amountToRevert = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
                 const accountRef = getAccountDoc(userId, transactionToDelete.accountId);
                 const accountDoc = await firestoreTransaction.get(accountRef);
                 if(accountDoc.exists()){
                     const newBalance = accountDoc.data().balance + amountToRevert;
                     firestoreTransaction.update(accountRef, { balance: newBalance });
                 }
                 firestoreTransaction.delete(transactionDocRef);
            }
        });
    } catch (error) {
        console.error("Delete transaction failed: ", error);
        throw error;
    }
}


/**
 * Get all transactions for a user with real-time updates
 */
export const getTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
    const q = query(getTransactionsCollection(userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Error fetching transactions:", error);
    });

    return unsubscribe;
};
