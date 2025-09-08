'use client';

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { TransactionsDataTable } from "@/components/transactions-data-table";
import { categories } from '@/lib/data';
import type { Transaction, Account } from "@/lib/types";
import { getTransactions, addTransaction } from "@/services/transactions";
import { getAccounts } from "@/services/accounts";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribeTransactions = getTransactions(user.uid, (data) => {
        setTransactions(data);
        setLoading(false);
      });
      const unsubscribeAccounts = getAccounts(user.uid, setAccounts);

      return () => {
        unsubscribeTransactions();
        unsubscribeAccounts();
      };
    }
  }, [user]);


  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id' | 'userId'>) => {
    if (user) {
      await addTransaction(user.uid, newTransactionData);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between py-4">
          <Skeleton className="h-10 w-80" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
        <div className="flex items-center justify-end space-x-2 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <TransactionsDataTable 
        transactions={transactions} 
        onAddTransaction={handleAddTransaction}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
