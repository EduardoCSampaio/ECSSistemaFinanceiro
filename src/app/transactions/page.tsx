'use client';

import { TransactionsDataTable } from "@/components/transactions-data-table";
import { accounts as initialAccounts, categories, transactions as initialTransactions } from '@/lib/data';
import { useState }from "react";
import type { Transaction, Account } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

  const handleAddTransaction = (newTransactionData: Omit<Transaction, 'id' | 'account' | 'category'>) => {
    const account = accounts.find(acc => acc.id === newTransactionData.accountId);
    const category = categories.find(cat => cat.id === newTransactionData.categoryId);

    if (!account || !category) {
      console.error("Conta ou categoria não encontrada!");
      // Adicionar um toast de erro aqui seria uma boa melhoria
      return;
    }

    const newTransaction: Transaction = {
      ...newTransactionData,
      id: `trx${Date.now()}`,
      account,
      category,
    };
    
    // Atualiza o estado das transações
    setTransactions(prev => [...prev, newTransaction]);

    // Atualiza o saldo da conta
    setAccounts(prevAccounts => 
        prevAccounts.map(acc => {
            if (acc.id === newTransaction.accountId) {
                const newBalance = newTransaction.type === 'income'
                    ? acc.balance + newTransaction.amount
                    : acc.balance - newTransaction.amount;
                return { ...acc, balance: newBalance };
            }
            return acc;
        })
    );
  };

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
