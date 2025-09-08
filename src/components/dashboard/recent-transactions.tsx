'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
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
import { categories } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { getTransactions } from '@/services/transactions';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface RecentTransactionsProps {
  userId: string;
}

export function RecentTransactions({ userId }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = getTransactions(userId, setTransactions);
    return () => unsubscribe();
  }, [userId]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
      .slice(0, 6);
  }, [transactions]);


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
            {recentTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  Nenhuma transação recente.
                </TableCell>
              </TableRow>
            ) : (
              recentTransactions.map((transaction) => {
                const category = categories.find(c => c.id === transaction.categoryId);
                return (
                    <TableRow key={transaction.id}>
                    <TableCell>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">{category?.name || 'N/A'}</div>
                    </TableCell>
                    <TableCell className={cn(
                        "text-right font-medium",
                        transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                        {transaction.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </TableCell>
                    </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
