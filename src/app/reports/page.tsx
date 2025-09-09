'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
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
import { DateRangePicker } from '@/components/date-range-picker';
import { getTransactions } from '@/services/transactions';
import { getAccounts } from '@/services/accounts';
import { categories } from '@/lib/data';
import type { Transaction, Account } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28'
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultToDate = new Date();
  const defaultFromDate = subMonths(defaultToDate, 5);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(defaultFromDate),
    to: endOfMonth(defaultToDate)
  });
  const [accountId, setAccountId] = useState('all');

  useEffect(() => {
    if (user) {
      const unsubscribeTransactions = getTransactions(user.uid, (data) => {
        setTransactions(data);
        if (accounts.length > 0 || data.length > 0) setLoading(false);
      });
      const unsubscribeAccounts = getAccounts(user.uid, (data) => {
        setAccounts(data);
        if (transactions.length > 0 || data.length > 0) setLoading(false);
      });

      return () => {
        unsubscribeTransactions();
        unsubscribeAccounts();
      };
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (accountId !== 'all') {
      filtered = filtered.filter(t => t.accountId === accountId);
    }
    
    if (dateRange?.from && dateRange?.to) {
        const fromDate = dateRange.from;
        const toDate = dateRange.to;
        filtered = filtered.filter(t => {
            const transactionDate = t.date.toDate();
            return transactionDate >= fromDate && transactionDate <= toDate;
        })
    }
    
    return filtered;
  }, [transactions, accountId, dateRange]);

  const expenseData = useMemo(() => {
    const expenseByCategory: { [key: string]: { value: number; count: number } } = {};
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    expenseTransactions.forEach(t => {
        const category = categories.find(c => c.id === t.categoryId);
        if (category) {
             if (!expenseByCategory[category.name]) {
                expenseByCategory[category.name] = { value: 0, count: 0 };
            }
            expenseByCategory[category.name].value += Math.abs(t.amount);
            expenseByCategory[category.name].count += 1;
        }
    });

    const chartData = Object.keys(expenseByCategory).map(name => ({
        name,
        value: expenseByCategory[name].value
    })).sort((a,b) => b.value - a.value);

    const tableData = Object.keys(expenseByCategory).map(name => ({
        name,
        ...expenseByCategory[name],
        percentage: totalExpenses > 0 ? ((expenseByCategory[name].value / totalExpenses) * 100).toFixed(2) + '%' : '0.00%'
    })).sort((a,b) => b.value - a.value);

    return { chartData, tableData, totalExpenses };
  }, [filteredTransactions]);

  const financialTrendData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    const dataByMonth: { [key: string]: { month: string; Receitas: number; Despesas: number }} = {};
    
    let currentDate = new Date(dateRange.from);
    while(currentDate <= dateRange.to) {
      const monthKey = format(currentDate, 'yyyy-MM');
      const monthName = format(currentDate, 'MMM/yy');
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = { month: monthName, Receitas: 0, Despesas: 0 };
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    filteredTransactions.forEach(t => {
      const monthKey = format(t.date.toDate(), 'yyyy-MM');
      if (dataByMonth[monthKey]) {
        if (t.type === 'income') {
          dataByMonth[monthKey].Receitas += t.amount;
        } else {
          dataByMonth[monthKey].Despesas += Math.abs(t.amount);
        }
      }
    });

    return Object.values(dataByMonth).sort((a,b) => a.month.localeCompare(b.month));
  }, [filteredTransactions, dateRange]);
  
  if (authLoading || loading) {
    return (
       <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Relatórios</h1>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Contas</SelectItem>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição dos seus gastos no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseData.chartData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Nenhuma despesa encontrada para o filtro selecionado.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                    data={expenseData.chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    >
                    {expenseData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Tendência Financeira</CardTitle>
                <CardDescription>Evolução de receitas e despesas no período.</CardDescription>
            </CardHeader>
            <CardContent>
               {financialTrendData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center">
                      <p className="text-muted-foreground">Sem dados para exibir.</p>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financialTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="Receitas" stroke="hsl(var(--chart-1))" />
                        <Line type="monotone" dataKey="Despesas" stroke="hsl(var(--chart-2))" />
                    </LineChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Despesas por Categoria</CardTitle>
          <CardDescription>Análise detalhada dos seus gastos no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
                <TableHead className="text-center">Nº de Transações</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseData.tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhuma despesa para analisar.
                  </TableCell>
                </TableRow>
              ) : (
                expenseData.tableData.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                    <TableCell className="text-center">{item.count}</TableCell>
                    <TableCell className="text-right font-medium">{item.percentage}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <p className="text-sm font-bold">Total de Despesas no Período: {formatCurrency(expenseData.totalExpenses)}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
