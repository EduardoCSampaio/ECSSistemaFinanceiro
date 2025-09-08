'use client';

import { useState, useMemo, useEffect } from 'react';
import { AlertCircle, PlusCircle, Target, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { categories } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AddBudgetSheet } from '@/components/add-budget-sheet';
import type { Budget, BudgetWithSpent } from '@/lib/types';
import { getBudgetsWithSpent, addBudget, updateBudget, deleteBudget } from '@/services/budgets';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from '@/hooks/use-toast';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function BudgetsPage() {
  const { user, loading: authLoading } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribe = getBudgetsWithSpent(user.uid, (data) => {
        setBudgets(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSaveBudget = async (data: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    if (budgetToEdit) {
        await updateBudget(user.uid, budgetToEdit.id, data);
    } else {
        await addBudget(user.uid, data);
    }
  };

  const handleDeleteBudget = async () => {
    if (!user || !budgetToDelete) return;
    try {
        await deleteBudget(user.uid, budgetToDelete.id);
        const categoryName = categories.find(c => c.id === budgetToDelete.categoryId)?.name;
        toast({
            title: 'Orçamento Excluído',
            description: `O orçamento para "${categoryName}" foi removido.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: 'Erro ao Excluir',
            description: 'Não foi possível remover o orçamento.',
        });
    }
    setIsConfirmOpen(false);
    setBudgetToDelete(null);
  };

  const openAddSheet = () => {
    setBudgetToEdit(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (budget: Budget) => {
    setBudgetToEdit(budget);
    setIsSheetOpen(true);
  };

  const openDeleteDialog = (budget: Budget) => {
    setBudgetToDelete(budget);
    setIsConfirmOpen(true);
  }

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
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Orçamentos</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1" onClick={openAddSheet}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Novo Orçamento
            </span>
          </Button>
        </div>
      </div>
       {budgets.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum orçamento cadastrado. Crie um para monitorar seus gastos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const isOverBudget = percentage > 100;
            const category = categories.find(c => c.id === budget.categoryId);

            return (
              <Card key={budget.id}>
                <CardHeader className="pb-4 flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                     {category?.icon && <category.icon className="h-5 w-5 text-muted-foreground" />}
                     <CardTitle className="text-base font-medium">
                        {category?.name || 'Categoria'}
                     </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditSheet(budget)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(budget)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <Progress value={Math.min(percentage, 100)} className={cn(percentage > 90 && 'bg-destructive/20 [&>*]:bg-destructive')} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{formatCurrency(budget.spent)}</span>
                    <span className="text-muted-foreground">de {formatCurrency(budget.amount)}</span>
                  </div>
                  {isOverBudget && (
                    <Alert variant="destructive" className="p-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Você ultrapassou o orçamento em {formatCurrency(budget.spent - budget.amount)}.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
       <AddBudgetSheet 
          key={budgetToEdit ? budgetToEdit.id : 'add'}
          isOpen={isSheetOpen}
          onSetOpen={setIsSheetOpen}
          onSave={handleSaveBudget} 
          budgetToEdit={budgetToEdit}
        />
        <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleDeleteBudget}
            title="Confirmar Exclusão"
            description={`Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.`}
        />
    </div>
  );
}
