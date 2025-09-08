'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTransactions } from '@/services/transactions';
import { getAccounts } from '@/services/accounts';
import { categories } from '@/lib/data';
import type { Transaction, Account } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ accountId: 'all', period: 'all' });

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
    
    // Filter by account
    if (filters.accountId !== 'all') {
      filtered = filtered.filter(t => t.accountId === filters.accountId);
    }

    // Filter by period
    const now = new Date();
    if (filters.period !== 'all') {
      let startDate: Date;
      switch (filters.period) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3-months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case '6-months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
         case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0); // far in the past
      }
      filtered = filtered.filter(t => t.date.toDate() >= startDate);
    }
    
    return filtered;
  }, [transactions, filters]);

  const expenseData = useMemo(() => {
    const expenseByCategory: { [key: string]: number } = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const category = categories.find(c => c.id === t.categoryId);
            if (category) {
                 if (!expenseByCategory[category.name]) {
                    expenseByCategory[category.name] = 0;
                }
                expenseByCategory[category.name] += Math.abs(t.amount);
            }
        });

    return Object.keys(expenseByCategory).map(name => ({
        name,
        value: expenseByCategory[name]
    })).sort((a,b) => b.value - a.value);
  }, [filteredTransactions]);
  
  if (authLoading || loading) {
    return (
       <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Relatórios</h1>
      </div>
      <div className="flex items-center gap-4">
        <Select value={filters.accountId} onValueChange={value => setFilters(f => ({...f, accountId: value}))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Contas</SelectItem>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.period} onValueChange={value => setFilters(f => ({...f, period: value}))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="this-month">Este Mês</SelectItem>
            <SelectItem value="3-months">Últimos 3 Meses</SelectItem>
            <SelectItem value="6-months">Últimos 6 Meses</SelectItem>
            <SelectItem value="this-year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição dos seus gastos no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Nenhuma despesa encontrada para o filtro selecionado.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    >
                    {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Tendência Financeira</CardTitle>
                <CardDescription>Em breve: um gráfico de linhas mostrando a evolução do seu patrimônio.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Gráfico em construção.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
