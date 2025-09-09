'use client';

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { TransactionsDataTable } from "@/components/transactions-data-table";
import { categories } from '@/lib/data';
import type { Transaction, Account } from "@/lib/types";
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, addTransactionsBatch } from "@/services/transactions";
import { getAccounts } from "@/services/accounts";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) return;
    await addTransaction(user.uid, data);
  };
  
  const handleAddTransactionsBatch = async (data: Omit<Transaction, 'id' | 'userId'>[]) => {
    if(!user) return;
    await addTransactionsBatch(user.uid, data);
  }

  const handleUpdateTransaction = async (id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
      if(!user) return;
      await updateTransaction(user.uid, id, data);
  };
  
  const handleDeleteTransaction = async (id: string) => {
      if(!user) return;
      try {
        await deleteTransaction(user.uid, id);
        toast({ title: 'Transação Excluída', description: 'A transação foi removida com sucesso.' });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível remover a transação.' });
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
        onUpdateTransaction={handleUpdateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onAddTransactionsBatch={handleAddTransactionsBatch}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
