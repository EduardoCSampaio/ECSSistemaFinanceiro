'use client';

import React, { useState } from 'react';
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
  SheetTrigger,
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


interface AddRecurringIncomeSheetProps {
    children: React.ReactNode;
    onSave: (data: Omit<RecurringIncome, 'id' | 'userId'>) => void;
    accounts: Account[];
}

export function AddRecurringIncomeSheet({ children, onSave, accounts }: AddRecurringIncomeSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof recurringIncomeFormSchema>>({
    resolver: zodResolver(recurringIncomeFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      dayOfMonth: 1,
      accountId: ''
    },
  });

  function onSubmit(data: z.infer<typeof recurringIncomeFormSchema>) {
    onSave(data);
    toast({
      title: 'Receita Recorrente Adicionada',
      description: `Sua receita "${data.description}" foi salva com sucesso.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Adicionar Receita Recorrente</SheetTitle>
              <SheetDescription>
                Preencha os detalhes de uma fonte de renda que se repete mensalmente.
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar Receita</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
