'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Target } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import type { Goal } from '@/lib/types';
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/services/goals';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AddGoalSheet } from '@/components/add-goal-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { GoalCard } from '@/components/goal-card';


export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribe = getGoals(user.uid, (data) => {
        setGoals(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSaveGoal = async (data: Omit<Goal, 'id' | 'userId'>) => {
    if (!user) return;
    if (goalToEdit) {
        await updateGoal(user.uid, goalToEdit.id, data);
    } else {
        await addGoal(user.uid, data);
    }
    setGoalToEdit(null);
  };

  const handleDeleteGoal = async () => {
    if (!user || !goalToDelete) return;
    try {
        await deleteGoal(user.uid, goalToDelete.id);
        toast({
            title: 'Meta Excluída',
            description: `A meta "${goalToDelete.name}" foi removida.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: 'Erro ao Excluir',
            description: 'Não foi possível remover a meta.',
        });
    }
    setIsConfirmOpen(false);
    setGoalToDelete(null);
  };

  const openAddSheet = () => {
    setGoalToEdit(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsSheetOpen(true);
  };

  const openDeleteDialog = (goal: Goal) => {
    setGoalToDelete(goal);
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
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Minhas Metas</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1" onClick={openAddSheet}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Nova Meta
            </span>
          </Button>
        </div>
      </div>
       {goals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center flex flex-col items-center justify-center h-60">
             <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Comece a Sonhar!</h3>
            <p className="text-muted-foreground">Nenhuma meta cadastrada ainda. Crie sua primeira meta e comece a planejar seu futuro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard 
                key={goal.id} 
                goal={goal} 
                onEdit={openEditSheet}
                onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}
       <AddGoalSheet 
          key={goalToEdit ? goalToEdit.id : 'add'}
          isOpen={isSheetOpen}
          onSetOpen={setIsSheetOpen}
          onSave={handleSaveGoal} 
          goalToEdit={goalToEdit}
        />
        <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleDeleteGoal}
            title="Confirmar Exclusão"
            description={`Tem certeza que deseja excluir a meta "${goalToDelete?.name}"? Esta ação não pode ser desfeita.`}
        />
    </div>
  );
}
