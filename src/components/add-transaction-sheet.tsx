'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Transaction, Account, Category, Goal } from '@/lib/types';


const transactionFormSchema = z.object({
  description: z.string().min(2, {
    message: 'A descrição deve ter pelo menos 2 caracteres.',
  }),
  amount: z.coerce.number().min(0.01, {
    message: 'O valor deve ser maior que zero.',
  }),
  type: z.enum(['income', 'expense']),
  date: z.date(),
  accountId: z.string().min(1, { message: "Selecione uma conta."}),
  categoryId: z.string().min(1, { message: "Selecione uma categoria."}),
  goalId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface AddTransactionSheetProps {
    isOpen: boolean;
    onSetOpen: (isOpen: boolean) => void;
    onSave: (data: TransactionFormValues) => Promise<void>;
    transactionToEdit?: Transaction | null;
    accounts: Account[];
    categories: Category[];
    goals: Goal[];
}

export function AddTransactionSheet({ 
    isOpen, 
    onSetOpen, 
    onSave, 
    transactionToEdit, 
    accounts, 
    categories,
    goals
}: AddTransactionSheetProps) {
  const { toast } = useToast();
  const isEditing = !!transactionToEdit;
  const [activeTab, setActiveTab] = useState(isEditing ? transactionToEdit.type : 'expense');

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense'
    }
  });

  const incomeCategories = useMemo(() => 
    categories.filter(c => ['Salário', 'Outras Receitas'].includes(c.name)), 
  [categories]);
  
  const expenseCategories = useMemo(() => 
    categories.filter(c => !['Salário', 'Outras Receitas'].includes(c.name)), 
  [categories]);

  const selectedCategoryId = form.watch('categoryId');
  const isGoalContribution = useMemo(() => {
    const category = categories.find(c => c.id === selectedCategoryId);
    return category?.name === 'Aporte para Meta';
  }, [selectedCategoryId, categories]);


  useEffect(() => {
    if (isOpen) {
        if (transactionToEdit) {
            form.reset({
                ...transactionToEdit,
                date: transactionToEdit.date.toDate(),
            });
            setActiveTab(transactionToEdit.type);
        } else {
            form.reset({
                type: 'expense',
                date: new Date(),
                description: '',
                amount: 0,
                accountId: '',
                categoryId: ''
            });
            setActiveTab('expense');
        }
    }
  }, [transactionToEdit, isOpen, form]);

  useEffect(() => {
    if (isEditing) return;
    form.setValue('type', activeTab as 'income' | 'expense');
    form.setValue('categoryId', '');
    form.setValue('goalId', undefined);
  }, [activeTab, isEditing, form])

  async function onSubmit(data: TransactionFormValues) {
    try {
        await onSave(data);
        toast({
            title: isEditing ? 'Transação Atualizada' : 'Transação Adicionada',
            description: `Sua transação "${data.description}" foi salva com sucesso.`,
        });
        onSetOpen(false);
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: 'Erro ao Salvar',
            description: 'Ocorreu um problema ao salvar a transação.',
        });
    }
  }
  
  const handleTabChange = (value: string) => {
    if (isEditing) return;
    setActiveTab(value);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onSetOpen}>
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Editar Transação' : 'Adicionar Transação'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Atualize os detalhes da sua movimentação.' : 'Selecione o tipo de transação e preencha os detalhes.'}
              </SheetDescription>
            </SheetHeader>
             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expense" disabled={isEditing && activeTab !=='expense'}>Despesa</TabsTrigger>
                    <TabsTrigger value="income" disabled={isEditing && activeTab !=='income'}>Receita</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex-1 space-y-4 py-4 overflow-y-auto pr-4">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                        <Input placeholder={activeTab === 'expense' ? "Ex: Almoço, Mercado" : "Ex: Salário, Venda"} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                                <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {activeTab === 'expense' ? 
                                    expenseCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>) :
                                    incomeCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)
                                }
                            </SelectContent>
                            </Select>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                {isGoalContribution && (
                  <FormField
                    control={form.control}
                    name="goalId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Meta de Destino</FormLabel>
                        <div className="relative">
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione a meta" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {goals.map(goal => <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
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
                            disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                            }
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
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar {isEditing ? 'Alterações' : 'Transação'}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
