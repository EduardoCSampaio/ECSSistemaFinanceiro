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
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { transactions, accounts } from '@/lib/data';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getRecurringTransactions = () => {
    // Para esta demonstração, vamos simular transações recorrentes.
    // Em um app real, você teria uma lógica para identificá-las ou marcá-las.
    const recurringIncome = transactions.find(t => t.description === 'Salário Mensal');
    const recurringExpenses = transactions.filter(t => ['Aluguel', 'Conta de Luz'].includes(t.description));
    
    return {
        incomes: recurringIncome ? [recurringIncome] : [],
        expenses: recurringExpenses
    }
}

export default function ProjectionsPage() {
  const [monthsToProject, setMonthsToProject] = useState(6);
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const projections = useMemo(() => {
    const { incomes, expenses } = getRecurringTransactions();
    const monthlyIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netMonthly = monthlyIncome - monthlyExpense;

    const results = [];
    let currentBalance = totalBalance;

    for (let i = 1; i <= monthsToProject; i++) {
      const projectionDate = new Date();
      projectionDate.setMonth(projectionDate.getMonth() + i);

      currentBalance += netMonthly;

      results.push({
        month: projectionDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        income: monthlyIncome,
        expense: monthlyExpense,
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
            Uma previsão dos seus resultados financeiros com base em receitas e despesas recorrentes.
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
                  <TableCell className={cn("text-right font-semibold", p.net > 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {formatCurrency(p.net)}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold", p.endBalance > 0 ? 'text-foreground' : 'text-red-500')}>
                    {formatCurrency(p.endBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                * Projeções são baseadas em 'Salário Mensal' como renda recorrente e 'Aluguel' e 'Conta de Luz' como despesas recorrentes. A precisão pode variar.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
