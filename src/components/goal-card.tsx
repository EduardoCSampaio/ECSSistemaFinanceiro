'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Goal } from '@/lib/types';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    onDelete: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    
    const daysLeft = goal.deadline ? differenceInDays(goal.deadline.toDate(), new Date()) : null;

    let deadlineText = 'Sem prazo definido';
    if (daysLeft !== null) {
        if (daysLeft < 0) {
            deadlineText = `Prazo encerrado em ${format(goal.deadline!.toDate(), 'dd/MM/yyyy')}`;
        } else if (daysLeft === 0) {
            deadlineText = 'O prazo é hoje!';
        } else {
            deadlineText = `Faltam ${daysLeft} dia(s) (${format(goal.deadline!.toDate(), 'dd/MM/yyyy')})`;
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{goal.name}</CardTitle>
                    <CardDescription>{deadlineText}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(goal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(goal)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Progress value={percentage} />
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-primary">{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                </div>
                <Separator />
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className={cn("font-semibold", percentage >= 100 ? 'text-emerald-500' : 'text-foreground')}>{percentage.toFixed(1)}%</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Falta</span>
                        <span className="font-semibold">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
