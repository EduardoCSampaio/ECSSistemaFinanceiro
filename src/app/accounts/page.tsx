'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Landmark, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Account } from '@/lib/types';
import { AddAccountSheet } from '@/components/add-account-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '@/services/accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribe = getAccounts(user.uid, (data) => {
        setAccounts(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSaveAccount = async (data: Omit<Account, 'id' | 'userId'>) => {
    if (!user) return;
    if (accountToEdit) {
      await updateAccount(user.uid, accountToEdit.id, data);
    } else {
      await addAccount(user.uid, data);
    }
    setAccountToEdit(null);
  };

  const handleDeleteAccount = async () => {
    if (!user || !accountToDelete) return;
    try {
        await deleteAccount(user.uid, accountToDelete.id);
        toast({
            title: 'Conta Excluída',
            description: `A conta "${accountToDelete.name}" foi removida.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: 'Erro ao Excluir',
            description: 'Não foi possível remover a conta. Verifique se ela possui transações vinculadas.',
        });
    }
    setIsConfirmOpen(false);
    setAccountToDelete(null);
  };

  const openEditSheet = (account: Account) => {
    setAccountToEdit(account);
    setIsSheetOpen(true);
  };

  const openAddSheet = () => {
    setAccountToEdit(null);
    setIsSheetOpen(true);
  };

  const openDeleteDialog = (account: Account) => {
    setAccountToDelete(account);
    setIsConfirmOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex items-center">
          <Skeleton className="h-8 w-48" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Contas</h1>
        <div className="ml-auto flex items-center gap-2">
           <AddAccountSheet onSave={handleSaveAccount} accountToEdit={accountToEdit}>
            <Button size="sm" className="h-8 gap-1" onClick={openAddSheet}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Conta
              </span>
            </Button>
          </AddAccountSheet>
        </div>
      </div>
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma conta cadastrada. Adicione uma para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">{account.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{account.bank}</p>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditSheet(account)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(account)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(account.balance)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a conta "${accountToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
