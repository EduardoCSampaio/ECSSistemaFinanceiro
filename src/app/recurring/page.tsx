'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AddRecurringSheet } from '@/components/add-recurring-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { categories } from '@/lib/data';
import type { RecurringTransaction, Account } from '@/lib/types';
import { differenceInMonths, format } from 'date-fns';
import { getRecurringTransactions, addRecurringTransaction, deleteRecurringTransaction } from '@/services/recurring';
import { getAccounts } from '@/services/accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function RecurringPage() {
  const { user, loading: authLoading } = useAuth();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RecurringTransaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribeRecurring = getRecurringTransactions(user.uid, (data) => {
        setRecurring(data);
        setLoading(false);
      });
      const unsubscribeAccounts = getAccounts(user.uid, setAccounts);

      return () => {
        unsubscribeRecurring();
        unsubscribeAccounts();
      };
    }
  }, [user]);

  const handleAddRecurring = async (newData: Omit<RecurringTransaction, 'id' | 'userId' | 'category' | 'account'>) => {
    if (user) {
        await addRecurringTransaction(user.uid, newData);
    }
  };

  const handleDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
        await deleteRecurringTransaction(user.uid, itemToDelete.id);
        toast({
            title: 'Despesa Excluída',
            description: `A despesa "${itemToDelete.description}" foi removida.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: 'Erro ao Excluir',
            description: 'Não foi possível remover a despesa recorrente.',
        });
    }
    setIsConfirmOpen(false);
    setItemToDelete(null);
  }

  const openDeleteDialog = (item: RecurringTransaction) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  }

  const getInstallmentStatus = (item: RecurringTransaction) => {
    if (item.installments === null) {
      return 'Fixo';
    }
    const now = new Date();
    const start = item.startDate.toDate(); // Convert Firestore Timestamp to Date
    const monthsPassed = differenceInMonths(now, start) + 1;
    
    if (monthsPassed > item.installments) {
        return 'Finalizado';
    }

    return `${monthsPassed} de ${item.installments}`;
  }

  if (authLoading || loading) {
    return (
       <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <Skeleton className="h-8 w-72" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-80" />
                <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </div>
    )
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
                <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                recurring.map((item) => {
                    const category = categories.find(c => c.id === item.categoryId)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category?.name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={item.installments === null ? "secondary" : "default"}>
                                {getInstallmentStatus(item)}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">{item.dayOfMonth}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem disabled>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a despesa recorrente "${itemToDelete?.description}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
