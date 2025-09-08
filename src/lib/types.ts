export type Account = {
  id: string;
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
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  account: Account;
};

export type Budget = {
  id: string;
  category: Category;
  amount: number;
  spent: number;
};
