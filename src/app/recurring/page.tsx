'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { AddRecurringSheet } from '@/components/add-recurring-sheet';
import { accounts as initialAccounts, categories, recurringTransactions as initialRecurring } from '@/lib/data';
import type { RecurringTransaction, Account } from '@/lib/types';
import { differenceInMonths, format } from 'date-fns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function RecurringPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(initialRecurring);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);


  const handleAddRecurring = (newData: Omit<RecurringTransaction, 'id' | 'account' | 'category'>) => {
      const account = accounts.find(acc => acc.id === newData.accountId);
      const category = categories.find(cat => cat.id === newData.categoryId);

      if (!account || !category) {
        console.error("Conta ou categoria não encontrada!");
        return;
      }
      
      const newRecurring: RecurringTransaction = {
        ...newData,
        id: `rec${Date.now()}`,
        account,
        category,
      };
      setRecurring(prev => [...prev, newRecurring]);
  };

  const getInstallmentStatus = (item: RecurringTransaction) => {
    if (item.installments === null) {
      return 'Fixo';
    }
    const now = new Date();
    const start = new Date(item.startDate);
    const monthsPassed = differenceInMonths(now, start) + 1;
    
    if (monthsPassed > item.installments) {
        return 'Finalizado';
    }

    return `${monthsPassed} de ${item.installments}`;
  }


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Contas a Pagar (Recorrentes)</h1>
        <div className="ml-auto flex items-center gap-2">
           <AddRecurringSheet onSave={handleAddRecurring} accounts={accounts} categories={categories}>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nova Conta Recorrente
              </span>
            </Button>
          </AddRecurringSheet>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Lançamentos Fixos e Parcelados</CardTitle>
            <CardDescription>Suas contas e despesas que se repetem.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-center">Dia do Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurring.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma conta recorrente cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                recurring.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category.name}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={item.installments === null ? "secondary" : "default"}>
                            {getInstallmentStatus(item)}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.dayOfMonth}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                           Registrar Pagamento
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
