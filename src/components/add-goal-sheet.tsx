'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Goal } from '@/lib/types';
import { cn } from '@/lib/utils';

const goalFormSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome da meta deve ter pelo menos 2 caracteres.',
  }),
  targetAmount: z.coerce.number().min(1, {
      message: 'O valor alvo deve ser maior que zero.'
  }),
  currentAmount: z.coerce.number().min(0),
  deadline: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface AddGoalSheetProps {
    isOpen: boolean;
    onSetOpen: (isOpen: boolean) => void;
    onSave: (data: Omit<Goal, 'id' | 'userId'>) => Promise<void>;
    goalToEdit?: Goal | null;
}

export function AddGoalSheet({ isOpen, onSetOpen, onSave, goalToEdit }: AddGoalSheetProps) {
  const { toast } = useToast();
  const isEditing = !!goalToEdit;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: undefined
    },
  });

  useEffect(() => {
    if (goalToEdit && isOpen) {
      form.reset({
          ...goalToEdit,
          deadline: goalToEdit.deadline ? goalToEdit.deadline.toDate() : undefined
      });
    } else if (!isOpen) {
      form.reset({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        deadline: undefined
      });
    }
  }, [goalToEdit, form, isOpen]);

  async function onSubmit(data: GoalFormValues) {
    try {
        await onSave(data as Omit<Goal, 'id' | 'userId'>);
        toast({
            title: isEditing ? 'Meta Atualizada' : 'Meta Criada',
            description: `Sua meta "${data.name}" foi salva.`,
        });
        onSetOpen(false);
    } catch (error) {
         toast({
            variant: "destructive",
            title: 'Erro ao Salvar',
            description: 'Ocorreu um problema ao salvar a meta.',
        });
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onSetOpen}>
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Editar Meta' : 'Criar Nova Meta'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Atualize os detalhes do seu objetivo financeiro.' : 'Preencha os detalhes do seu novo objetivo financeiro.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 py-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Meta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Viagem para o Japão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="25000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                    </FormControl>
                     <FormDescription>Quanto você já tem guardado para esta meta.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline" onClick={() => onSetOpen(false)}>Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar Meta</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
