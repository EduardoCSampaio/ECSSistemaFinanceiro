'use client';

import { useState, useMemo } from 'react';
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { accounts, recurringTransactions } from '@/lib/data';
import { addMonths, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ProjectionsPage() {
  const [monthsToProject, setMonthsToProject] = useState(6);
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const projections = useMemo(() => {
    const results = [];
    let currentBalance = totalBalance;

    for (let i = 1; i <= monthsToProject; i++) {
      const projectionDate = addMonths(new Date(), i-1);

      const monthlyExpenses = recurringTransactions.reduce((sum, transaction) => {
        const startDate = new Date(transaction.startDate);
        const monthsSinceStart = differenceInMonths(projectionDate, startDate);

        // A transação já começou?
        if (monthsSinceStart >= 0) {
          // Se for parcelada, já acabou?
          if (transaction.installments !== null && monthsSinceStart >= transaction.installments) {
            return sum; // Parcela já finalizou, não soma
          }
          // Se for fixa ou parcela ativa, soma a despesa
          return sum + transaction.amount;
        }
        
        return sum; // Transação ainda não começou
      }, 0);

      // Por enquanto, vamos assumir que não há receitas recorrentes cadastradas
      const monthlyIncome = 0; 
      const netMonthly = monthlyIncome - monthlyExpenses;
      
      if (i > 1) { // O saldo do primeiro mês já é calculado com o primeiro net
        currentBalance += netMonthly;
      } else { // Para o primeiro mês, o saldo inicial é o total e o final é calculado
        currentBalance = totalBalance + netMonthly;
      }
      
      results.push({
        month: projectionDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        income: monthlyIncome,
        expense: monthlyExpenses,
        net: netMonthly,
        endBalance: currentBalance,
      });
    }

    return results;
  }, [monthsToProject, totalBalance]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Projeções Financeiras</h1>
        <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Projetar para:</span>
            <Select value={String(monthsToProject)} onValueChange={(value) => setMonthsToProject(Number(value))}>
                <SelectTrigger className="w-[120px]">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Demonstração de Resultados Futuros (DRE)</CardTitle>
          <CardDescription>
            Uma previsão dos seus resultados financeiros com base em despesas recorrentes cadastradas.
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
                * Projeções são baseadas apenas nas contas recorrentes cadastradas. A precisão pode variar.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
