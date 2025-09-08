'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Landmark } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Account } from '@/lib/types';
import { AddAccountSheet } from '@/components/add-account-sheet';
import { getAccounts, addAccount } from '@/services/accounts';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = getAccounts(user.uid, (data) => {
        setAccounts(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddAccount = async (newAccountData: Omit<Account, 'id' | 'userId'>) => {
    if (user) {
      await addAccount(user.uid, newAccountData);
    }
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
          <AddAccountSheet onSave={handleAddAccount}>
            <Button size="sm" className="h-8 gap-1">
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">{account.name}</CardTitle>
                <Landmark className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(account.balance)}</div>
                <p className="text-sm text-muted-foreground">{account.bank}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
