'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addMonths, startOfMonth, differenceInCalendarMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Account, RecurringTransaction } from '@/lib/types';
import { getAccounts } from '@/services/accounts';
import { getRecurringTransactions } from '@/services/recurring';
import { getPreferences, savePreferences } from '@/services/preferences';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export default function ProjectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [monthsToProject, setMonthsToProject] = useState(6);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  // Function to save income to Firestore
  const saveIncome = useCallback(async (income: number) => {
      if (!user) return;
      try {
        await savePreferences(user.uid, { monthlyIncome: income });
        toast({
            title: 'Receita Salva',
            description: 'Sua receita mensal foi atualizada com sucesso.',
            duration: 2000,
        });
      } catch (error) {
          console.error("Failed to save income:", error);
           toast({
            variant: "destructive",
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar sua receita mensal.',
          });
      }
  }, [user, toast]);

  // Create a debounced version of the save function
  const debouncedSaveIncome = useCallback(debounce(saveIncome, 1500), [saveIncome]);

  useEffect(() => {
    if (user) {
      // Fetch initial preferences
      getPreferences(user.uid).then(prefs => {
        if (prefs && prefs.monthlyIncome) {
          setMonthlyIncome(prefs.monthlyIncome);
        }
      });
      
      const unsubscribeAccounts = getAccounts(user.uid, (data) => {
        setAccounts(data);
        if(!recurring.length) setLoading(false);
      });
      const unsubscribeRecurring = getRecurringTransactions(user.uid, (data) => {
        setRecurring(data);
        setLoading(false);
      });

      return () => {
        unsubscribeAccounts();
        unsubscribeRecurring();
      };
    }
  }, [user]);
  
  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newIncome = Number(e.target.value);
      setMonthlyIncome(newIncome);
      debouncedSaveIncome(newIncome);
  }

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const projections = useMemo(() => {
    const results = [];
    let currentBalance = totalBalance;
    const today = new Date();

    for (let i = 0; i < monthsToProject; i++) {
      const projectionDate = startOfMonth(addMonths(today, i));

      const monthlyExpenses = recurring.reduce((sum, transaction) => {
        const startDate = startOfMonth(transaction.startDate.toDate());
        const monthsSinceStart = Math.max(0, differenceInCalendarMonths(projectionDate, startDate));

        if (transaction.installments !== null) {
          if (monthsSinceStart < transaction.installments) {
            return sum + transaction.amount;
          }
        } else {
           if (projectionDate >= startDate) {
             return sum + transaction.amount;
           }
        }
        
        return sum;
      }, 0);
      
      const netMonthly = monthlyIncome - monthlyExpenses;
      currentBalance += netMonthly;
      
      results.push({
        month: projectionDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        income: monthlyIncome,
        expense: monthlyExpenses,
        net: netMonthly,
        endBalance: currentBalance,
      });
    }

    return results;
  }, [monthsToProject, totalBalance, monthlyIncome, recurring]);
  
  if (authLoading || loading) {
     return (
       <div className="flex flex-1 flex-col gap-4 md:gap-8">
         <div className="flex flex-col sm:flex-row items-center gap-4">
           <Skeleton className="h-8 w-72" />
           <div className="ml-auto flex flex-wrap items-center justify-end gap-4 w-full">
              <Skeleton className="h-10 w-52" />
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
                <Label htmlFor="monthly-income" className="text-sm text-muted-foreground whitespace-nowrap">Receita Mensal (R$)</Label>
                <Input 
                    id="monthly-income"
                    type="number"
                    value={monthlyIncome}
                    onChange={handleIncomeChange}
                    className="w-[150px]"
                    placeholder="Ex: 5000"
                />
            </div>
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
          <CardTitle>Demonstração de Resultados Futuros (DRE)</CardTitle>
          <CardDescription>
            Uma previsão dos seus resultados financeiros com base em despesas recorrentes e receitas fixas.
            Saldo Inicial: <strong>{formatCurrency(totalBalance)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Mês</TableHead>
                <TableHead className="text-right text-emerald-500">Receitas Previstas</TableHead>
                <TableHead className="text-right text-red-500">Despesas Previstas</TableHead>
                <TableHead className="text-right">Resultado do Mês</TableHead>
                <TableHead className="text-right">Saldo Final Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projections.map((p, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium capitalize">{p.month}</TableCell>
                  <TableCell className="text-right text-emerald-500">{formatCurrency(p.income)}</TableCell>
                  <TableCell className="text-right text-red-500">{formatCurrency(p.expense)}</TableCell>
                  <TableCell className={cn("text-right font-semibold", p.net >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {formatCurrency(p.net)}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold", p.endBalance >= 0 ? 'text-foreground' : 'text-red-500')}>
                    {formatCurrency(p.endBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                * Projeções são baseadas apenas nas contas recorrentes e receitas fixas cadastradas. A precisão pode variar.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
