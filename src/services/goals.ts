'use client';

import {
    collection,
    addDoc,
    query,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Goal } from "@/lib/types";

// Collection and Doc references
const getGoalsCollection = (userId: string) => collection(db, `users/${userId}/goals`);
const getGoalDoc = (userId: string, goalId: string) => doc(db, `users/${userId}/goals`, goalId);

/**
 * Add a new goal to Firestore
 */
export const addGoal = async (userId: string, goalData: Omit<Goal, 'id' | 'userId'>) => {
    try {
        const dataToSave: any = { ...goalData };
        if (goalData.deadline) {
            dataToSave.deadline = Timestamp.fromDate(goalData.deadline as unknown as Date);
        }
        await addDoc(getGoalsCollection(userId), dataToSave);
    } catch (error) {
        console.error("Error adding goal:", error);
        throw error;
    }
};

/**
 * Update an existing goal in Firestore
 */
export const updateGoal = async (userId: string, goalId: string, goalData: Partial<Omit<Goal, 'id' | 'userId'>>) => {
    try {
         const dataToUpdate: any = { ...goalData };
        if (goalData.deadline) {
            dataToUpdate.deadline = Timestamp.fromDate(goalData.deadline as unknown as Date);
        }
        await updateDoc(getGoalDoc(userId, goalId), dataToUpdate);
    } catch (error) {
        console.error("Error updating goal:", error);
        throw error;
    }
};

/**
 * Delete a goal from Firestore
 */
export const deleteGoal = async (userId: string, goalId: string) => {
    try {
        await deleteDoc(getGoalDoc(userId, goalId));
    } catch (error) {
        console.error("Error deleting goal:", error);
        throw error;
    }
};

/**
 * Get all goals for a user with real-time updates
 */
export const getGoals = (userId: string, callback: (goals: Goal[]) => void) => {
    const q = query(getGoalsCollection(userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const goals: Goal[] = [];
        querySnapshot.forEach((doc) => {
            goals.push({ id: doc.id, ...doc.data() } as Goal);
        });
        callback(goals);
    }, (error) => {
        console.error("Error fetching goals:", error);
    });

    return unsubscribe;
};
