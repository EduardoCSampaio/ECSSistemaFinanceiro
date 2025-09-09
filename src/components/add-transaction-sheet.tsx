'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, ArrowRightLeft } from 'lucide-react';
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
import type { Transaction, Account, Category } from '@/lib/types';


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
});

const transferFormSchema = z.object({
    fromAccountId: z.string().min(1, { message: 'Selecione a conta de origem.'}),
    toAccountId: z.string().min(1, { message: 'Selecione a conta de destino.'}),
    amount: z.coerce.number().min(0.01, { message: 'O valor deve ser maior que zero.'}),
    date: z.date(),
}).refine(data => data.fromAccountId !== data.toAccountId, {
    message: 'A conta de origem e destino não podem ser iguais.',
    path: ['toAccountId'],
});


type TransactionFormValues = z.infer<typeof transactionFormSchema>;
type TransferFormValues = z.infer<typeof transferFormSchema>;


interface AddTransactionSheetProps {
    isOpen: boolean;
    onSetOpen: (isOpen: boolean) => void;
    onSaveTransaction: (data: TransactionFormValues) => Promise<void>;
    onSaveTransfer: (data: TransferFormValues) => Promise<void>;
    transactionToEdit?: Transaction | null;
    accounts: Account[];
    categories: Category[];
}

export function AddTransactionSheet({ 
    isOpen, 
    onSetOpen, 
    onSaveTransaction, 
    onSaveTransfer,
    transactionToEdit, 
    accounts, 
    categories 
}: AddTransactionSheetProps) {
  const { toast } = useToast();
  const isEditing = !!transactionToEdit;
  const [activeTab, setActiveTab] = useState('expense');

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
  });

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
        amount: 0,
        date: new Date(),
        fromAccountId: '',
        toAccountId: '',
    }
  });

  const transactionType = transactionForm.watch('type');

  const filteredCategories = React.useMemo(() => {
    const incomeCategoryNames = ['Salário', 'Outras Receitas', 'Transferência'];
    if (transactionType === 'income') {
        return categories.filter(c => incomeCategoryNames.includes(c.name));
    }
    return categories.filter(c => !incomeCategoryNames.includes(c.name));
  }, [categories, transactionType]);
  
  useEffect(() => {
    if (isOpen) {
        if (transactionToEdit) {
            transactionForm.reset({
                ...transactionToEdit,
                date: transactionToEdit.date.toDate(),
            });
            setActiveTab(transactionToEdit.type);
        } else {
            transactionForm.reset({
                type: 'expense',
                date: new Date(),
                description: '',
                amount: 0,
                accountId: '',
                categoryId: ''
            });
            transferForm.reset({
                amount: 0,
                date: new Date(),
                fromAccountId: '',
                toAccountId: '',
            });
            setActiveTab('expense');
        }
    }
  }, [transactionToEdit, isOpen, transactionForm, transferForm]);

  useEffect(() => {
    transactionForm.setValue('categoryId', '');
  }, [transactionType, transactionForm]);

  async function onTransactionSubmit(data: TransactionFormValues) {
    try {
        await onSaveTransaction(data);
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

  async function onTransferSubmit(data: TransferFormValues) {
    try {
        await onSaveTransfer(data);
        toast({
            title: 'Transferência Realizada',
            description: `Sua transferência foi salva com sucesso.`,
        });
        onSetOpen(false);
    } catch (error) {
         console.error(error);
        toast({
            variant: "destructive",
            title: 'Erro na Transferência',
            description: 'Ocorreu um problema ao realizar a transferência.',
        });
    }
  }

  const handleTabChange = (value: string) => {
    if (isEditing) return; // Don't allow tab change when editing
    setActiveTab(value);
    if (value === 'income' || value === 'expense') {
        transactionForm.reset(transactionForm.getValues())
        transactionForm.setValue('type', value);
    }
  }


  return (
    <Sheet open={isOpen} onOpenChange={onSetOpen}>
      <SheetContent className="sm:max-w-lg">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Editar Transação' : 'Adicionar Movimentação'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Atualize os detalhes da sua movimentação.' : 'Selecione o tipo de movimentação que deseja adicionar.'}
              </SheetDescription>
            </SheetHeader>
            {!isEditing && (
                <TabsList className="grid w-full grid-cols-3 mt-4">
                    <TabsTrigger value="expense">Despesa</TabsTrigger>
                    <TabsTrigger value="income">Receita</TabsTrigger>
                    <TabsTrigger value="transfer">Transferência</TabsTrigger>
                </TabsList>
            )}

            <div className="flex-1 overflow-y-auto py-4 pr-2">
                <TabsContent value="expense" forceMount={true} className={cn(activeTab !== 'expense' && 'hidden')}>
                     <Form {...transactionForm}>
                        <form id="transactionFormExpense" onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                             <FormField
                                control={transactionForm.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Ex: Almoço, Supermercado" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={transactionForm.control}
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
                                control={transactionForm.control}
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
                                control={transactionForm.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <div className="relative">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                            </Trigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <FormField
                                control={transactionForm.control}
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
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="income" forceMount={true} className={cn(activeTab !== 'income' && 'hidden')}>
                    <Form {...transactionForm}>
                        <form id="transactionFormIncome" onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                            <FormField
                                control={transactionForm.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Ex: Salário" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={transactionForm.control}
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
                                control={transactionForm.control}
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
                                control={transactionForm.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <div className="relative">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                            </Trigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <FormField
                                control={transactionForm.control}
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
                        </form>
                    </Form>
                </TabsContent>
                 <TabsContent value="transfer">
                   <Form {...transferForm}>
                        <form id="transferForm" onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                            <FormField
                                control={transferForm.control}
                                name="amount"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor (R$)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="0.01" placeholder="100.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex items-center gap-4">
                                <FormField
                                    control={transferForm.control}
                                    name="fromAccountId"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                        <FormLabel>De</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Conta de Origem" />
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
                                <div className="pt-7">
                                    <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                                </div>
                                 <FormField
                                    control={transferForm.control}
                                    name="toAccountId"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                        <FormLabel>Para</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Conta de Destino" />
                                            </Trigger>
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
                             <FormField
                                control={transferForm.control}
                                name="date"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data da Transferência</FormLabel>
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
                        </form>
                   </Form>
                </TabsContent>
            </div>

            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline" onClick={() => onSetOpen(false)}>Cancelar</Button>
                </SheetClose>
                 {activeTab === 'expense' && <Button type="submit" form="transactionFormExpense">Salvar {isEditing ? 'Alterações' : 'Despesa'}</Button>}
                 {activeTab === 'income' && <Button type="submit" form="transactionFormIncome">Salvar {isEditing ? 'Alterações' : 'Receita'}</Button>}
                {activeTab === 'transfer' && <Button type="submit" form="transferForm">Confirmar Transferência</Button>}
            </SheetFooter>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
