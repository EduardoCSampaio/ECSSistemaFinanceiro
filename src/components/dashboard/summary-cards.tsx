'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Landmark, ArrowUpRight, ArrowDownLeft, PiggyBank } from 'lucide-react';
import { getAccounts } from '@/services/accounts';
import { getTransactions } from '@/services/transactions';
import type { Account, Transaction } from '@/lib/types';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface SummaryCardsProps {
  userId: string;
}

export function SummaryCards({ userId }: SummaryCardsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribeAccounts = getAccounts(userId, setAccounts);
    const unsubscribeTransactions = getTransactions(userId, setTransactions);
    return () => {
      unsubscribeAccounts();
      unsubscribeTransactions();
    };
  }, [userId]);

  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const monthlyIncome = transactions
      .filter(t => {
        const tDate = t.date.toDate();
        return t.type === 'income' && tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => {
        const tDate = t.date.toDate();
        return t.type === 'expense' && tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savings = monthlyIncome - Math.abs(monthlyExpenses);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses: Math.abs(monthlyExpenses),
      monthlySavings: savings
    };
  }, [accounts, transactions]);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</div>
          <p className="text-xs text-muted-foreground">Em todas as contas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.monthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">Entradas no mês atual</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.monthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">Saídas no mês atual</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economia (Mês)</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.monthlySavings)}</div>
          <p className="text-xs text-muted-foreground">Saldo do mês atual</p>
        </CardContent>
      </Card>
    </div>
  )
}
