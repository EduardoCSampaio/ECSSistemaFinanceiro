'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { transactions } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { Transaction } from '@/lib/types';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function RecentTransactions() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
    setRecentTransactions(sorted);
  }, []);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>As últimas movimentações financeiras.</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/transactions">
            Ver Todas
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  Carregando transações...
                </TableCell>
              </TableRow>
            )}
            {recentTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">{transaction.category.name}</div>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {transaction.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(transaction.amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
