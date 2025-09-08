'use client';

import React, { useState, useEffect } from 'react';
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
import type { RecurringIncome, Account } from '@/lib/types';


const recurringIncomeFormSchema = z.object({
  description: z.string().min(2, {
    message: 'A descrição deve ter pelo menos 2 caracteres.',
  }),
  amount: z.coerce.number().min(0.01, {
    message: 'O valor deve ser maior que zero.',
  }),
  dayOfMonth: z.coerce.number().min(1).max(31, { message: 'Dia inválido.'}),
  accountId: z.string().min(1, { message: "Selecione uma conta."}),
});

type RecurringIncomeFormValues = z.infer<typeof recurringIncomeFormSchema>;


interface AddRecurringIncomeSheetProps {
    isOpen: boolean;
    onSetOpen: (isOpen: boolean) => void;
    onSave: (data: RecurringIncomeFormValues) => void;
    itemToEdit?: RecurringIncome | null;
    accounts: Account[];
}

export function AddRecurringIncomeSheet({ isOpen, onSetOpen, onSave, itemToEdit, accounts }: AddRecurringIncomeSheetProps) {
  const { toast } = useToast();
  const isEditing = !!itemToEdit;

  const form = useForm<RecurringIncomeFormValues>({
    resolver: zodResolver(recurringIncomeFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      dayOfMonth: 1,
      accountId: ''
    },
  });

  useEffect(() => {
    if (itemToEdit) {
      form.reset(itemToEdit);
    } else {
      form.reset({
        description: '',
        amount: 0,
        dayOfMonth: new Date().getDate(),
        accountId: ''
      });
    }
  }, [itemToEdit, form, isOpen]);


  function onSubmit(data: RecurringIncomeFormValues) {
    onSave(data);
    toast({
      title: isEditing ? 'Receita Atualizada' : 'Receita Adicionada',
      description: `Sua receita "${data.description}" foi salva com sucesso.`,
    });
    onSetOpen(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onSetOpen}>
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Editar Receita Recorrente' : 'Adicionar Receita Recorrente'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Atualize os detalhes da sua receita.' : 'Preencha os detalhes de uma fonte de renda que se repete mensalmente.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 py-4 overflow-y-auto pr-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Salário, Vale, Aluguel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dia do Recebimento</FormLabel>
                        <FormControl>
                        <Input type="number" min="1" max="31" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta de Destino</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline" onClick={() => onSetOpen(false)}>Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
