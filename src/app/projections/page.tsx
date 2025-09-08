'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { addMonths, startOfMonth, endOfMonth, differenceInCalendarMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Account, RecurringTransaction, RecurringIncome, Transaction } from '@/lib/types';
import { getAccounts } from '@/services/accounts';
import { getRecurringTransactions } from '@/services/recurring';
import { getRecurringIncomes } from '@/services/recurringIncomes';
import { getTransactions } from '@/services/transactions';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ProjectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringTransaction[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthsToProject, setMonthsToProject] = useState(6);

  useEffect(() => {
    if (user) {
      let accountsLoaded = false;
      let expensesLoaded = false;
      let incomesLoaded = false;
      let transactionsLoaded = false;

      const checkLoading = () => {
        if (accountsLoaded && expensesLoaded && incomesLoaded && transactionsLoaded) {
          setLoading(false);
        }
      }

      const unsubscribeAccounts = getAccounts(user.uid, (data) => {
        setAccounts(data);
        accountsLoaded = true;
        checkLoading();
      });
      const unsubscribeExpenses = getRecurringTransactions(user.uid, (data) => {
        setRecurringExpenses(data);
        expensesLoaded = true;
        checkLoading();
      });
      const unsubscribeIncomes = getRecurringIncomes(user.uid, (data) => {
        setRecurringIncomes(data);
        incomesLoaded = true;
        checkLoading();
      });
       const unsubscribeTransactions = getTransactions(user.uid, (data) => {
        setTransactions(data);
        transactionsLoaded = true;
        checkLoading();
      });

      return () => {
        unsubscribeAccounts();
        unsubscribeExpenses();
        unsubscribeIncomes();
        unsubscribeTransactions();
      };
    }
  }, [user]);

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const projections = useMemo(() => {
    const results = [];
    let currentBalance = totalBalance;
    const today = new Date();

    const totalMonthlyIncome = recurringIncomes.reduce((sum, income) => sum + income.amount, 0);

    for (let i = 0; i < monthsToProject; i++) {
      const projectionDate = startOfMonth(addMonths(today, i));
      const projectionMonthEnd = endOfMonth(projectionDate);

      // --- Cálculos de Projeção ---
      const monthlyProjectedExpenses = recurringExpenses.reduce((sum, transaction) => {
        const startDate = startOfMonth(transaction.startDate.toDate());
        const monthsSinceStart = differenceInCalendarMonths(projectionDate, startDate);

        if (monthsSinceStart < 0) return sum; 
        if (transaction.installments !== null) {
          if (monthsSinceStart < transaction.installments) return sum + transaction.amount;
        } else {
           return sum + transaction.amount;
        }
        return sum;
      }, 0);
      
      const netProjectedMonthly = totalMonthlyIncome - monthlyProjectedExpenses;
      currentBalance += netProjectedMonthly;

      // --- Cálculos do Realizado ---
      const monthlyActualIncomes = transactions
        .filter(t => t.type === 'income' && t.date.toDate() >= projectionDate && t.date.toDate() <= projectionMonthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyActualExpenses = transactions
        .filter(t => t.type === 'expense' && t.date.toDate() >= projectionDate && t.date.toDate() <= projectionMonthEnd)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const netActualMonthly = monthlyActualIncomes - monthlyActualExpenses;
      
      results.push({
        month: projectionDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        projectedIncome: totalMonthlyIncome,
        projectedExpense: monthlyProjectedExpenses,
        netProjected: netProjectedMonthly,
        netActual: netActualMonthly,
        endBalance: currentBalance,
      });
    }

    return results;
  }, [monthsToProject, totalBalance, recurringIncomes, recurringExpenses, transactions]);
  
  if (authLoading || loading) {
     return (
       <div className="flex flex-1 flex-col gap-4 md:gap-8">
         <div className="flex flex-col sm:flex-row items-center gap-4">
           <Skeleton className="h-8 w-72" />
           <div className="ml-auto flex flex-wrap items-center justify-end gap-4 w-full">
              <Skeleton className="h-10 w-44" />
           </div>
         </div>
         <Card>
           <CardHeader>
              <Skeleton className="h-6 w-80" />
              <Skeleton className="h-4 w-96" />
           </CardHeader>
           <CardContent>
             <Skeleton className="h-60 w-full" />
           </CardContent>
         </Card>
       </div>
     );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Projeções Financeiras</h1>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-4 w-full">
            <div className="flex items-center gap-2">
                <Label htmlFor="projection-months" className="text-sm text-muted-foreground">Projetar</Label>
                <Select value={String(monthsToProject)} onValueChange={(value) => setMonthsToProject(Number(value))}>
                    <SelectTrigger id="projection-months" className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">3 meses</SelectItem>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Demonstração de Resultados (Previsto vs. Realizado)</CardTitle>
          <CardDescription>
            Compare suas finanças projetadas (recorrentes) com as transações reais de cada mês.
            Saldo Inicial: <strong>{formatCurrency(totalBalance)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Mês</TableHead>
                <TableHead className="text-right text-sky-500">Receitas Previstas</TableHead>
                <TableHead className="text-right text-orange-500">Despesas Previstas</TableHead>
                <TableHead className="text-right">Resultado Previsto</TableHead>
                <TableHead className="text-right">Resultado Real</TableHead>
                <TableHead className="text-right">Saldo Final Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projections.map((p, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium capitalize">{p.month}</TableCell>
                  <TableCell className="text-right text-sky-500">{formatCurrency(p.projectedIncome)}</TableCell>
                  <TableCell className="text-right text-orange-500">{formatCurrency(p.projectedExpense)}</TableCell>
                  <TableCell className={cn("text-right font-semibold", p.netProjected >= 0 ? 'text-foreground' : 'text-destructive')}>
                    {formatCurrency(p.netProjected)}
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", p.netActual >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {formatCurrency(p.netActual)}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold", p.endBalance >= 0 ? 'text-foreground' : 'text-destructive')}>
                    {formatCurrency(p.endBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                * Projeções são baseadas apenas nas contas e receitas recorrentes cadastradas. A precisão pode variar.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
