'use client';

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
    orderBy,
    onSnapshot,
    writeBatch,
    doc,
    deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BudgetWithSpent, Goal, Notification } from "@/lib/types";
import { getBudgetsWithSpent } from "./budgets";
import { getGoals } from "./goals";

// --- Collection References ---
const getNotificationsCollection = (userId: string) => collection(db, `users/${userId}/notifications`);
const getNotificationDoc = (userId: string, notificationId: string) => doc(db, `users/${userId}/notifications`, notificationId);


// --- Public Functions ---

/**
 * Checks for conditions that should trigger notifications (e.g., budget limits, goals achieved)
 * and creates them if they don't already exist.
 * @param userId The ID of the user.
 */
export const checkForNotifications = async (userId: string) => {
    // We wrap the logic in a way that the services can be called,
    // process the data, and then unsubscribe immediately.
    const checkBudgets = new Promise<void>(resolve => {
        const unsubscribe = getBudgetsWithSpent(userId, (budgets) => {
            handleBudgetChecks(userId, budgets);
            unsubscribe();
            resolve();
        });
    });

    const checkGoals = new Promise<void>(resolve => {
        const unsubscribe = getGoals(userId, (goals) => {
            handleGoalChecks(userId, goals);
            unsubscribe();
            resolve();
        });
    });

    await Promise.all([checkBudgets, checkGoals]);
};


/**
 * Get all notifications for a user with real-time updates, ordered by date.
 * @param userId The ID of the user.
 * @param callback A function to call with the notifications data.
 * @returns An unsubscribe function for the listener.
 */
export const getNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    const q = query(getNotificationsCollection(userId), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: Notification[] = [];
        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });
        callback(notifications);
    }, (error) => {
        console.error("Error fetching notifications:", error);
    });

    return unsubscribe;
};

/**
 * Marks all unread notifications as read for a user.
 * @param userId The ID of the user.
 */
export const markAllNotificationsAsRead = async (userId: string) => {
    const notificationsCollection = getNotificationsCollection(userId);
    const q = query(notificationsCollection, where("isRead", "==", false));
    
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach(docSnap => {
            const docRef = doc(db, `users/${userId}/notifications`, docSnap.id);
            batch.update(docRef, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
}

/**
 * Deletes a specific notification.
 * @param userId The ID of the user.
 * @param notificationId The ID of the notification to delete.
 */
export const deleteNotification = async (userId: string, notificationId: string) => {
    try {
        await deleteDoc(getNotificationDoc(userId, notificationId));
    } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
};


// --- Internal Helper Functions ---

/**
 * Handles the logic for checking budget-related notifications.
 */
const handleBudgetChecks = async (userId: string, budgets: BudgetWithSpent[]) => {
    for (const budget of budgets) {
        const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        const category = categories.find(c => c.id === budget.categoryId);
        if (percentage >= 90) {
            await createNotificationIfNotExists(userId, {
                type: 'budget_warning',
                relatedId: budget.id,
                message: `Você usou mais de 90% do seu orçamento de ${category?.name || 'uma categoria'}.`,
                href: '/budgets'
            });
        }
    }
};

/**
 * Handles the logic for checking goal-related notifications.
 */
const handleGoalChecks = async (userId: string, goals: Goal[]) => {
    for (const goal of goals) {
        if (goal.currentAmount >= goal.targetAmount) {
             await createNotificationIfNotExists(userId, {
                type: 'goal_achieved',
                relatedId: goal.id,
                message: `Parabéns! Você atingiu sua meta de "${goal.name}".`,
                href: '/goals'
            });
        }
    }
};

/**
 * Creates a notification document in Firestore if a notification with the same
 * type and relatedId does not already exist for the current month.
 * @param userId The ID of the user.
 * @param notificationData The core data for the notification.
 */
const createNotificationIfNotExists = async (userId: string, notificationData: Omit<Notification, 'id' | 'userId' | 'isRead' | 'timestamp'>) => {
    const notificationsCollection = getNotificationsCollection(userId);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Simplified query to avoid composite index
    const q = query(
        notificationsCollection,
        where("type", "==", notificationData.type),
        where("relatedId", "==", notificationData.relatedId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Client-side filtering for the current month
    const existingNotificationsThisMonth = querySnapshot.docs.filter(doc => {
        const timestamp = doc.data().timestamp.toDate();
        return timestamp >= startOfMonth;
    });

    if (existingNotificationsThisMonth.length === 0) {
        await addDoc(notificationsCollection, {
            ...notificationData,
            userId,
            isRead: false,
            timestamp: Timestamp.now()
        });
    }
};

// This needs to be here to avoid a reference error, but it's not ideal.
// A better solution would be to pass categories from the component that calls this service.
const categories = [
  { id: 'cat1', name: 'Moradia' },
  { id: 'cat2', name: 'Alimentação' },
  { id: 'cat3', name: 'Transporte' },
  { id: 'cat4', name: 'Saúde' },
  { id: 'cat5', name: 'Lazer' },
  { id: 'cat6', name: 'Compras' },
  { id: 'cat7', name: 'Vestuário' },
  { id: 'cat8', name: 'Educação' },
  { id: 'cat9', name: 'Presentes' },
  { id: 'cat10', name: 'Livros' },
  { id: 'cat11', name: 'Salário' },
  { id: 'cat12', name: 'Outras Receitas' },
  { id: 'cat13', name: 'Outras Despesas' },
  { id: 'cat14', name: 'Contas Fixas' },
  { id: 'cat15', name: 'Transferência' },
  { id: 'cat16', name: 'Aporte para Meta' },
];
