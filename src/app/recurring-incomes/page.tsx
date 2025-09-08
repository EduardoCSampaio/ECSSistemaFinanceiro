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
import { AddRecurringIncomeSheet } from '@/components/add-recurring-income-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { RecurringIncome, Account } from '@/lib/types';
import { getRecurringIncomes, addRecurringIncome, updateRecurringIncome, deleteRecurringIncome } from '@/services/recurringIncomes';
import { getAccounts } from '@/services/accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function RecurringIncomesPage() {
  const { user, loading: authLoading } = useAuth();
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<RecurringIncome | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RecurringIncome | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribeRecurring = getRecurringIncomes(user.uid, (data) => {
        setRecurringIncomes(data);
        setLoading(false);
      });
      const unsubscribeAccounts = getAccounts(user.uid, setAccounts);

      return () => {
        unsubscribeRecurring();
        unsubscribeAccounts();
      };
    }
  }, [user]);

  const handleSave = async (data: Omit<RecurringIncome, 'id' | 'userId'>) => {
    if (!user) return;
    if (itemToEdit) {
      await updateRecurringIncome(user.uid, itemToEdit.id, data);
    } else {
      await addRecurringIncome(user.uid, data);
    }
    setItemToEdit(null);
  };

  const handleDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
        await deleteRecurringIncome(user.uid, itemToDelete.id);
        toast({
            title: 'Receita Excluída',
            description: `A receita "${itemToDelete.description}" foi removida.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: 'Erro ao Excluir',
            description: 'Não foi possível remover a receita recorrente.',
        });
    }
    setIsConfirmOpen(false);
    setItemToDelete(null);
  }

  const openAddSheet = () => {
    setItemToEdit(null);
    setIsSheetOpen(true);
  }

  const openEditSheet = (item: RecurringIncome) => {
    setItemToEdit(item);
    setIsSheetOpen(true);
  }

  const openDeleteDialog = (item: RecurringIncome) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
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
        <h1 className="text-lg font-semibold md:text-2xl">Receitas Recorrentes</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={openAddSheet}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nova Receita Recorrente
              </span>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Receitas Recorrentes</CardTitle>
            <CardDescription>Suas fontes de renda que se repetem mensalmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Conta de Destino</TableHead>
                <TableHead className="text-center">Dia do Recebimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringIncomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhuma receita recorrente cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                recurringIncomes.map((item) => {
                    const account = accounts.find(a => a.id === item.accountId)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>{account?.name || 'N/A'}</TableCell>
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
                                    <DropdownMenuItem onClick={() => openEditSheet(item)}>
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
      <AddRecurringIncomeSheet 
        key={itemToEdit ? itemToEdit.id : 'add'}
        isOpen={isSheetOpen}
        onSetOpen={setIsSheetOpen}
        onSave={handleSave} 
        itemToEdit={itemToEdit}
        accounts={accounts}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir la receita recorrente "${itemToDelete?.description}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
