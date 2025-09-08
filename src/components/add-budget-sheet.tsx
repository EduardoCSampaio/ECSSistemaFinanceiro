'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import type { Budget } from '@/lib/types';


const budgetFormSchema = z.object({
  amount: z.coerce.number().min(0.01, {
    message: 'O valor deve ser maior que zero.',
  }),
  categoryId: z.string().min(1, { message: "Selecione uma categoria."}),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface AddBudgetSheetProps {
    isOpen: boolean;
    onSetOpen: (isOpen: boolean) => void;
    onSave: (data: BudgetFormValues) => Promise<void>;
    budgetToEdit?: Budget | null;
}

export function AddBudgetSheet({ isOpen, onSetOpen, onSave, budgetToEdit }: AddBudgetSheetProps) {
  const { toast } = useToast();
  const isEditing = !!budgetToEdit;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
  });

  useEffect(() => {
    if (budgetToEdit && isOpen) {
        form.reset({
            amount: budgetToEdit.amount,
            categoryId: budgetToEdit.categoryId
        });
    } else if (!isOpen) {
        form.reset({
            amount: 0,
            categoryId: ''
        });
    }
  }, [budgetToEdit, form, isOpen]);

  async function onSubmit(data: BudgetFormValues) {
    try {
        await onSave(data);
        const categoryName = categories.find(c => c.id === data.categoryId)?.name;
        toast({
          title: isEditing ? 'Orçamento Atualizado' : 'Orçamento Criado',
          description: `Seu orçamento para "${categoryName}" foi salvo com sucesso.`,
        });
        onSetOpen(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar o orçamento.',
        });
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onSetOpen}>
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Atualize o limite de gastos para esta categoria.' : 'Defina um limite de gastos para uma categoria.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 py-4">
              <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <div className="relative">
                        <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.filter(c => !['Salário', 'Outras Receitas'].includes(c.name)).map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Orçamento (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline" onClick={() => onSetOpen(false)}>Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar Alterações</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
