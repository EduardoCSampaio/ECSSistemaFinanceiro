'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import debounce from 'lodash.debounce';

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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { accounts, categories } from '@/lib/data';
import { getCategorySuggestion } from '@/app/actions';

const transactionFormSchema = z.object({
  description: z.string().min(2, {
    message: 'A descrição deve ter pelo menos 2 caracteres.',
  }),
  amount: z.coerce.number().min(0.01, {
    message: 'O valor deve ser maior que zero.',
  }),
  type: z.enum(['income', 'expense']),
  date: z.date(),
  accountId: z.string(),
  categoryId: z.string(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState('');

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
    },
  });

  const fetchSuggestion = useCallback((description: string) => {
    startTransition(async () => {
      const result = await getCategorySuggestion(description);
      if (result.suggestedCategory) {
        const matchedCategory = categories.find(c => c.name.toLowerCase() === result.suggestedCategory.toLowerCase());
        if (matchedCategory) {
          setSuggestion(matchedCategory.id);
        }
      } else {
        setSuggestion('');
      }
    });
  }, []);
  
  const debouncedFetchSuggestion = useCallback(debounce(fetchSuggestion, 500), [fetchSuggestion]);


  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'description' && value.description) {
        debouncedFetchSuggestion(value.description);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedFetchSuggestion]);

  function onSubmit(data: TransactionFormValues) {
    console.log(data);
    toast({
      title: 'Transação Adicionada',
      description: `Sua transação "${data.description}" foi salva com sucesso.`,
    });
    setOpen(false);
    form.reset();
  }
  
  const handleSuggestionClick = () => {
    if(suggestion) {
        form.setValue('categoryId', suggestion);
        setSuggestion('');
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Adicionar Nova Transação</SheetTitle>
              <SheetDescription>
                Preencha os detalhes da sua movimentação financeira.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 py-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                           <Button type="button" variant={field.value === 'expense' ? 'default': 'outline'} onClick={() => field.onChange('expense')}>Despesa</Button>
                           <Button type="button" variant={field.value === 'income' ? 'default': 'outline'} onClick={() => field.onChange('income')}>Receita</Button>
                        </div>
                      </FormControl>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aluguel" {...field} />
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
                      <Input type="number" placeholder="1500.00" {...field} />
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
                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {suggestion && suggestion !== field.value && (
                            <Button type="button" size="sm" variant="outline" className="absolute -top-4 right-0 text-xs h-6 px-2" onClick={handleSuggestionClick}>
                                <Sparkles className="h-3 w-3 mr-1"/> Sugestão
                            </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Transação</FormLabel>
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
                <Button type="submit">Salvar Transação</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
