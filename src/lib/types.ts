import { Timestamp } from "firebase/firestore";

export type Account = {
  id: string;
  userId: string;
  name: string;
  bank: string;
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type Transaction = {
  id: string;
  userId: string;
  date: Timestamp;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  transferId?: string; // To link two transfer transactions
};

export type Budget = {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
};

export type BudgetWithSpent = Budget & {
  spent: number;
};


export type RecurringTransaction = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  startDate: Timestamp;
  installments: number | null; // null for indefinite
  categoryId: string;
  accountId: string;
};

export type RecurringIncome = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  accountId: string;
};

export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Timestamp;
};


export type UserPreferences = {
    monthlyIncome?: number;
}
