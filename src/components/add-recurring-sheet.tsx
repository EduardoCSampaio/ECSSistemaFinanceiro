'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { RecurringTransaction, Account, Category } from '@/lib/types';


const recurringFormSchema = z.object({
  description: z.string().min(2, {
    message: 'A descrição deve ter pelo menos 2 caracteres.',
  }),
  amount: z.coerce.number().min(0.01, {
    message: 'O valor deve ser maior que zero.',
  }),
  dayOfMonth: z.coerce.number().min(1).max(31, { message: 'Dia inválido.'}),
  startDate: z.date(),
  isInstallment: z.boolean().default(false),
  installments: z.coerce.number().optional(),
  accountId: z.string().min(1, { message: "Selecione uma conta."}),
  categoryId: z.string().min(1, { message: "Selecione uma categoria."}),
}).refine(data => {
    if (data.isInstallment) {
        return data.installments && data.installments > 0;
    }
    return true;
}, {
    message: 'Número de parcelas deve ser maior que zero.',
    path: ['installments']
});

type RecurringFormValues = Omit<RecurringTransaction, 'id' | 'account' | 'category'> & { isInstallment?: boolean };


interface AddRecurringSheetProps {
    children: React.ReactNode;
    onSave: (data: Omit<RecurringTransaction, 'id' | 'account' | 'category'>) => void;
    accounts: Account[];
    categories: Category[];
}

export function AddRecurringSheet({ children, onSave, accounts, categories }: AddRecurringSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof recurringFormSchema>>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      dayOfMonth: new Date().getDate(),
      startDate: new Date(),
      isInstallment: false,
      installments: 1,
      accountId: '',
      categoryId: ''
    },
  });

  const isInstallment = form.watch('isInstallment');

  const expenseCategories = React.useMemo(() => {
    return categories.filter(c => !['Salário', 'Outras Receitas'].includes(c.name));
  }, [categories]);


  function onSubmit(data: z.infer<typeof recurringFormSchema>) {
    const finalData = {
        ...data,
        installments: data.isInstallment ? data.installments! : null,
    };
    onSave(finalData);
    toast({
      title: 'Conta Recorrente Adicionada',
      description: `Sua conta "${data.description}" foi salva com sucesso.`,
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
              <SheetTitle>Adicionar Conta Recorrente</SheetTitle>
              <SheetDescription>
                Preencha os detalhes de uma despesa que se repete mensalmente.
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
                      <Input placeholder="Ex: Aluguel, Assinatura Netflix" {...field} />
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
                        <Input type="number" step="0.01" placeholder="150.00" {...field} />
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
                        <FormLabel>Dia do Vencimento</FormLabel>
                        <FormControl>
                        <Input type="number" min="1" max="31" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta Padrão</FormLabel>
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
                 <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <div className="relative">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expenseCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
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
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isInstallment"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                         <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                É uma compra parcelada?
                            </FormLabel>
                        </div>
                    </FormItem>
                )}
                />
                {isInstallment && (
                    <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de Parcelas</FormLabel>
                            <FormControl>
                            <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar Conta</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
