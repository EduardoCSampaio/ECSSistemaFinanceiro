
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Landmark, ArrowUpRight, ArrowDownLeft, PiggyBank } from 'lucide-react';
import { accounts, transactions } from '@/lib/data';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function SummaryCards() {
  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && t.date.getMonth() === thisMonth && t.date.getFullYear() === thisYear)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && t.date.getMonth() === thisMonth && t.date.getFullYear() === thisYear)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Na lib/types.ts, as despesas já são negativas, então somar é o correto.
    // Mas no data.ts, elas são positivas, então a lógica aqui precisa subtrair.
    // Para consistência, vamos usar Math.abs e subtrair.
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
