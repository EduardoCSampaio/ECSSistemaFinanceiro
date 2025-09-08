'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { accounts, recurringTransactions } from '@/lib/data';
import { addMonths, startOfMonth, differenceInCalendarMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ProjectionsPage() {
  const [monthsToProject, setMonthsToProject] = useState(6);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), []);

  useEffect(() => {
    const savedIncome = localStorage.getItem('monthlyIncome');
    if (savedIncome) {
      setMonthlyIncome(Number(savedIncome));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('monthlyIncome', String(monthlyIncome));
  }, [monthlyIncome]);


  const projections = useMemo(() => {
    const results = [];
    let currentBalance = totalBalance;
    const today = new Date();

    for (let i = 0; i < monthsToProject; i++) {
      const projectionDate = startOfMonth(addMonths(today, i));

      const monthlyExpenses = recurringTransactions.reduce((sum, transaction) => {
        const startDate = startOfMonth(new Date(transaction.startDate));
        // Garante que a comparação de meses seja sempre positiva ou zero
        const monthsSinceStart = Math.max(0, differenceInCalendarMonths(projectionDate, startDate));

        if (transaction.installments !== null) {
          // Se for parcelado, só entra no cálculo se a parcela atual estiver dentro do prazo
          if (monthsSinceStart < transaction.installments) {
            return sum + transaction.amount;
          }
        } else {
          // Se for fixo, entra sempre no cálculo após a data de início
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
  }, [monthsToProject, totalBalance, monthlyIncome]);

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
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
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
