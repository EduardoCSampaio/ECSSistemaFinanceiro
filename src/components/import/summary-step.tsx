'use client';

import { useMemo } from 'react';
import type { Account, Category, Transaction } from '@/lib/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface SummaryStepProps {
    data: any[];
    categories: Category[];
    accounts: Account[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};


export function SummaryStep({ data, categories, accounts }: SummaryStepProps) {
  const transactionsToImport = useMemo(() => data.filter(row => row.import), [data]);

  const summary = useMemo(() => {
    return transactionsToImport.reduce((acc, curr) => {
        if (curr.type === 'income') {
            acc.totalIncome += curr.amount;
            acc.incomeCount += 1;
        } else {
            acc.totalExpense += curr.amount;
            acc.expenseCount += 1;
        }
        return acc;
    }, { totalIncome: 0, incomeCount: 0, totalExpense: 0, expenseCount: 0 });
  }, [transactionsToImport]);
  
  return (
    <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold">Passo 3: Resumo da Importação</h3>
            <p className="text-sm text-muted-foreground">Confira os dados antes de confirmar. Apenas as transações marcadas serão importadas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground">Total de Transações</p>
                <p className="text-2xl font-bold">{transactionsToImport.length}</p>
            </div>
            <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground">Receitas a importar ({summary.incomeCount})</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(summary.totalIncome)}</p>
            </div>
             <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground">Despesas a importar ({summary.expenseCount})</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalExpense)}</p>
            </div>
        </div>
        
        <ScrollArea className="h-96 rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactionsToImport.map(row => {
                         const category = categories.find(c => c.id === row.categoryId);
                         const account = accounts.find(a => a.id === row.accountId);
                         return (
                            <TableRow key={row.id}>
                                <TableCell>{format(row.date, 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{row.description}</TableCell>
                                <TableCell>{account?.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{category?.name || 'Não definida'}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${row.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {row.type === 'income' ? '+' : '-'} {formatCurrency(row.amount)}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
    </div>
  )
}
