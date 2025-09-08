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
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import type { Account } from '@/lib/types';

const accountFormSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome da conta deve ter pelo menos 2 caracteres.',
  }),
  bank: z.string().min(2, {
    message: 'O nome do banco deve ter pelo menos 2 caracteres.',
  }),
  balance: z.coerce.number(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AddAccountSheetProps {
    children: React.ReactNode;
    onSave: (data: Omit<Account, 'id'>) => Promise<void>;
    accountToEdit?: Account | null;
}

export function AddAccountSheet({ children, onSave, accountToEdit }: AddAccountSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const isEditing = !!accountToEdit;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: '',
      bank: '',
      balance: 0,
    },
  });

  useEffect(() => {
    if (accountToEdit) {
      form.reset(accountToEdit);
    } else {
      form.reset({ name: '', bank: '', balance: 0 });
    }
  }, [accountToEdit, form]);

  async function onSubmit(data: AccountFormValues) {
    try {
        await onSave(data);
        toast({
            title: isEditing ? 'Conta Atualizada' : 'Conta Adicionada',
            description: `Sua conta "${data.name}" foi salva.`,
        });
        setOpen(false);
        form.reset();
    } catch (error) {
         toast({
            variant: "destructive",
            title: 'Erro ao Salvar',
            description: 'Ocorreu um problema ao salvar a conta.',
        });
    }
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
              <SheetTitle>{isEditing ? 'Editar Conta' : 'Adicionar Nova Conta'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Atualize os detalhes da sua conta.' : 'Preencha os detalhes da sua nova conta.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 py-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Conta Corrente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Banco/Instituição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Banco Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo {isEditing ? 'Atual' : 'Inicial'} (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit">Salvar Alterações</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
