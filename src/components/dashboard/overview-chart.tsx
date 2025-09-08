
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { transactions } from '@/lib/data';

const getMonthlyData = () => {
  const dataMap = new Map<string, { name: string; income: number; expense: number }>();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(sixMonthsAgo);
    monthDate.setMonth(sixMonthsAgo.getMonth() + i);
    const monthName = monthDate.toLocaleString('default', { month: 'short' });
    dataMap.set(monthName, { name: monthName, income: 0, expense: 0 });
  }

  transactions.forEach(t => {
    const transactionDate = new Date(t.date);
    if (transactionDate >= sixMonthsAgo) {
      const monthName = transactionDate.toLocaleString('default', { month: 'short' });
      const monthData = dataMap.get(monthName);
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

export function OverviewChart() {
    const data = useMemo(() => getMonthlyData(), [transactions]);
    
    if (!data.length) {
      return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
                <CardDescription>Receitas e despesas dos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="w-full h-[350px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados para exibir.</p>
              </div>
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
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                    <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
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
                    <Bar dataKey="income" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Receita" />
                    <Bar dataKey="expense" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Despesa"/>
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
