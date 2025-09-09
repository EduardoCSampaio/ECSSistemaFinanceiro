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
    deleteDoc,
    setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BudgetWithSpent, Goal, Notification, RecurringTransaction } from "@/lib/types";
import { getBudgetsWithSpent } from "./budgets";
import { getGoals } from "./goals";
import { getRecurringTransactions } from "./recurring";
import { differenceInDays, isToday, startOfDay } from "date-fns";


// --- Collection References ---
const getNotificationsCollection = (userId: string) => collection(db, `users/${userId}/notifications`);
const getNotificationDoc = (userId: string, notificationId: string) => doc(db, `users/${userId}/notifications`, notificationId);
const getGeneratedNotificationsCollection = (userId: string) => collection(db, `users/${userId}/generatedNotifications`);


// --- Public Functions ---

/**
 * Checks for conditions that should trigger notifications (e.g., budget limits, goals achieved)
 * and creates them if they don't already exist for the day.
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

    const checkRecurring = new Promise<void>(resolve => {
        const unsubscribe = getRecurringTransactions(userId, (recurring) => {
            handleRecurringExpenseChecks(userId, recurring);
            unsubscribe();
            resolve();
        })
    });

    await Promise.all([checkBudgets, checkGoals, checkRecurring]);
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
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    for (const budget of budgets) {
        const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        if (percentage >= 90) {
            const categoryName = categoryMap.get(budget.categoryId) || 'uma categoria';
            await createNotificationIfNotExists(userId, {
                type: 'budget_warning',
                relatedId: budget.id,
                message: `Você usou mais de 90% do seu orçamento de ${categoryName}.`,
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
 * Handles logic for checking recurring expense due dates.
 */
const handleRecurringExpenseChecks = async (userId: string, recurring: RecurringTransaction[]) => {
    const today = startOfDay(new Date());

    for (const expense of recurring) {
        const expenseStartDate = expense.startDate.toDate();
        // Skip if the expense hasn't started yet
        if (today < startOfDay(expenseStartDate)) {
            continue;
        }

        // Check if the expense is still active
        if (expense.installments !== null) {
            const lastInstallmentDate = new Date(expenseStartDate);
            lastInstallmentDate.setMonth(lastInstallmentDate.getMonth() + expense.installments - 1);
            if (today > lastInstallmentDate) {
                continue; // Installments finished, skip
            }
        }
        
        const dueDateInCurrentMonth = new Date(today.getFullYear(), today.getMonth(), expense.dayOfMonth);
        const daysUntilDue = differenceInDays(dueDateInCurrentMonth, today);

        if (daysUntilDue >= 0 && daysUntilDue <= 3) {
            let message = '';
            if (daysUntilDue === 0) {
                message = `Sua conta '${expense.description}' vence hoje. Lembre-se de realizar o pagamento!`;
            } else if (daysUntilDue === 1) {
                message = `Sua conta '${expense.description}' vence amanhã!`;
            } else {
                message = `Sua conta '${expense.description}' vence em ${daysUntilDue} dias.`;
            }
            
            await createNotificationIfNotExists(userId, {
                type: 'recurring_due',
                relatedId: expense.id,
                message: message,
                href: '/recurring-expenses'
            });
        }
    }
};


/**
 * Creates a notification if one for the same relatedId hasn't been generated today.
 * It uses a separate collection with TTL to track generated notifications for 24 hours.
 * @param userId The ID of the user.
 * @param notificationData The core data for the notification.
 */
const createNotificationIfNotExists = async (userId: string, notificationData: Omit<Notification, 'id' | 'userId' | 'isRead' | 'timestamp'>) => {
    // Unique ID for the daily generated notification record
    const generatedNotificationId = `${notificationData.type}_${notificationData.relatedId}`;
    const generatedDocRef = doc(getGeneratedNotificationsCollection(userId), generatedNotificationId);

    try {
        const generatedDocSnap = await getDoc(generatedDocRef);
        
        // If the document exists and was created today, do nothing.
        if (generatedDocSnap.exists() && isToday(generatedDocSnap.data().generatedAt.toDate())) {
            return; 
        }

        // If it doesn't exist or is from a previous day, create a new notification and the record.
        const batch = writeBatch(db);
        
        // 1. Add the actual notification for the user to see
        const newNotificationRef = doc(getNotificationsCollection(userId));
        batch.set(newNotificationRef, {
            ...notificationData,
            userId,
            isRead: false,
            timestamp: Timestamp.now()
        });

        // 2. Add the tracking record with a TTL
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        batch.set(generatedDocRef, {
            generatedAt: Timestamp.now(),
            expireAt: Timestamp.fromDate(tomorrow), // Set TTL for 24 hours
        });

        await batch.commit();

    } catch (error) {
        console.error("Error creating notification:", error);
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