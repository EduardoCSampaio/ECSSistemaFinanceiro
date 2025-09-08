'use client';

import { useState } from 'react';
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
import { transactions, categories, accounts } from '@/lib/data';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const getExpenseData = () => {
    const expenseByCategory: { [key: string]: number } = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (!expenseByCategory[t.category.name]) {
                expenseByCategory[t.category.name] = 0;
            }
            expenseByCategory[t.category.name] += Math.abs(t.amount);
        });

    return Object.keys(expenseByCategory).map(name => ({
        name,
        value: expenseByCategory[name]
    })).sort((a,b) => b.value - a.value);
};


export default function ReportsPage() {
  const expenseData = getExpenseData();

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Relatórios</h1>
      </div>
      <div className="flex items-center gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Contas</SelectItem>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select defaultValue="3-months">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por período" />
          </SelectTrigger>
          <SelectContent>
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
            <CardDescription>Distribuição dos seus gastos.</CardDescription>
          </CardHeader>
          <CardContent>
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
