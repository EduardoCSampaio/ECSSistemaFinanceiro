'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const sharedSchema = {
    name: z.string().min(3, { message: 'O nome completo é obrigatório.' }),
    email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
    password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    confirmPassword: z.string(),
};

const cpfSchema = z.object({
    ...sharedSchema,
    cpf: z.string().length(14, { message: 'O CPF deve ter 11 dígitos.' }),
    personType: z.literal('cpf'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
});

const cnpjSchema = z.object({
    ...sharedSchema,
    cnpj: z.string().length(18, { message: 'O CNPJ deve ter 14 dígitos.' }),
    personType: z.literal('cnpj'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
});

const formSchema = z.discriminatedUnion('personType', [cpfSchema, cnpjSchema]);

type FormValues = z.infer<typeof formSchema>;


export default function AuthPage() {
  const [personType, setPersonType] = useState<'cpf' | 'cnpj'>('cpf');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(personType === 'cpf' ? cpfSchema : cnpjSchema),
    defaultValues: {
      personType: personType,
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      ...(personType === 'cpf' ? { cpf: '' } : { cnpj: '' }),
    },
  });

  const handlePersonTypeChange = (value: string | undefined) => {
    if (value === 'cpf' || value === 'cnpj') {
        setPersonType(value);
        form.reset();
        form.setValue('personType', value);
    }
  };

  const onSubmit = (values: FormValues) => {
    console.log(values);
    toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso.",
    });
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };
  
  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .substring(0, 18);
  };

  return (
    <div className="w-full max-w-md">
        <div className="text-center mb-6">
             <Link href="/" className="flex items-center justify-center gap-2 font-semibold text-primary text-2xl">
                  <Icons.logo className="h-8 w-8" />
                  <span className="">Maestro Financeiro</span>
            </Link>
        </div>
      <Tabs defaultValue="signup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Cadastro</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
            <Card>
                 <CardHeader>
                    <CardTitle>Acesse sua Conta</CardTitle>
                    <CardDescription>Bem-vindo de volta! Insira seus dados para continuar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Form {...form}>
                         <form className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input placeholder="seu@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </form>
                     </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full">Entrar</Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Esqueceu sua senha? <Link href="#" className="underline">Recupere aqui</Link>
                    </p>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Crie sua Conta</CardTitle>
                  <CardDescription>
                    Escolha entre pessoa física (CPF) ou jurídica (CNPJ) para começar.
                  </CardDescription>
                  <Tabs value={personType} onValueChange={handlePersonTypeChange} className="pt-4">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="cpf">Pessoa Física</TabsTrigger>
                          <TabsTrigger value="cnpj">Pessoa Jurídica</TabsTrigger>
                      </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="space-y-4">
                  {personType === 'cpf' && (
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatCpf(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {personType === 'cnpj' && (
                     <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                                <Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => field.onChange(formatCnpj(e.target.value))}/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{personType === 'cpf' ? "Nome Completo" : "Razão Social"}</FormLabel>
                        <FormControl>
                          <Input placeholder={personType === 'cpf' ? "Seu Nome Completo" : "Nome da sua Empresa"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Criar Conta
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
