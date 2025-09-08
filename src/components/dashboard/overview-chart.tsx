'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { transactions } from '@/lib/data';
import { useEffect, useState } from 'react';

const getMonthlyData = () => {
  const data: { name: string; income: number; expense: number }[] = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  for (let i = 0; i < 6; i++) {
    const month = new Date(sixMonthsAgo);
    month.setMonth(sixMonthsAgo.getMonth() + i);
    
    const monthName = month.toLocaleString('default', { month: 'short' });

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && t.date.getMonth() === month.getMonth() && t.date.getFullYear() === month.getFullYear())
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = transactions
      .filter(t => t.type === 'expense' && t.date.getMonth() === month.getMonth() && t.date.getFullYear() === month.getFullYear())
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    data.push({ name: monthName, income: monthlyIncome, expense: monthlyExpense });
  }
  return data;
};

export function OverviewChart() {
    const [data, setData] = useState<{ name: string; income: number; expense: number }[]>([]);

    useEffect(() => {
      setData(getMonthlyData());
    }, []);
    
    if (!data.length) {
      return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
                <CardDescription>Receitas e despesas dos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="w-full h-[350px] flex items-center justify-center">
                <p>Carregando gráfico...</p>
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
                    />
                    <Bar dataKey="income" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Receita" />
                    <Bar dataKey="expense" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Despesa"/>
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
