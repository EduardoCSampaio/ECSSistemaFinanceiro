'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getTransactions } from '@/services/transactions';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewChartProps {
  userId: string;
}

const getMonthlyData = (transactions: Transaction[]) => {
  const dataMap = new Map<string, { name: string; income: number; expense: number }>();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Initialize months
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(sixMonthsAgo);
    monthDate.setMonth(sixMonthsAgo.getMonth() + i);
    const monthName = monthDate.toLocaleString('pt-BR', { month: 'short' });
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    dataMap.set(capitalizedMonthName, { name: capitalizedMonthName, income: 0, expense: 0 });
  }
  
  transactions.forEach(t => {
    const transactionDate = t.date.toDate();
    if (transactionDate >= sixMonthsAgo) {
      const monthName = transactionDate.toLocaleString('pt-BR', { month: 'short' });
      const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const monthData = dataMap.get(capitalizedMonthName);
      if (monthData) {
        if (t.type === 'income') {
          monthData.income += t.amount;
        } else {
          monthData.expense += Math.abs(t.amount);
        }
      }
    }
  });

  return Array.from(dataMap.values());
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function OverviewChart({ userId }: OverviewChartProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const unsubscribe = getTransactions(userId, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);
    
    const data = useMemo(() => getMonthlyData(transactions), [transactions]);
    
    if (loading) {
       return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
                <CardDescription>Receitas e despesas dos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="w-full h-[350px]" />
            </CardContent>
        </Card>
       )
    }

    return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
                <CardDescription>Receitas e despesas dos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {data.length === 0 && !loading ? (
                 <div className="w-full h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">Sem dados para exibir.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                    <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Receita' : 'Despesa']}
                    />
                    <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Receita" />
                    <Bar dataKey="expense" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Despesa"/>
                </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
        </Card>
    )
}
