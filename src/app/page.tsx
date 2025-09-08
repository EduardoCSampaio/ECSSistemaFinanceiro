'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

const signUpBaseSchema = z.object({
    name: z.string().min(3, { message: 'O nome completo é obrigatório.' }),
    email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
    password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    confirmPassword: z.string(),
});

const cpfSchema = signUpBaseSchema.extend({
    personType: z.literal('cpf'),
    cpf: z.string().length(14, { message: 'O CPF deve ter 11 dígitos.' }),
});

const cnpjSchema = signUpBaseSchema.extend({
    personType: z.literal('cnpj'),
    cnpj: z.string().length(18, { message: 'O CNPJ deve ter 14 dígitos.' }),
});

const signUpSchema = z.discriminatedUnion('personType', [
    cpfSchema, 
    cnpjSchema
]).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
});

type LoginValues = z.infer<typeof loginSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;


export default function AuthPage() {
  const [personType, setPersonType] = useState<'cpf' | 'cnpj'>('cpf');
  const [activeTab, setActiveTab] = useState('login');
  const { toast } = useToast();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
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
        signUpForm.reset({
             personType: value,
             name: '',
             email: '',
             password: '',
             confirmPassword: '',
             ...(value === 'cpf' ? { cpf: '' } : { cnpj: '' }),
        });
        signUpForm.trigger();
    }
  };

  const onLogin = async (values: LoginValues) => {
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
            title: "Login bem-sucedido!",
            description: "Redirecionando para o dashboard.",
        });
        router.push('/dashboard');
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro no Login",
            description: "Credenciais inválidas. Verifique seu e-mail e senha.",
        });
    }
  }

  const onRegister = async (values: SignUpValues) => {
    try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        toast({
            title: "Cadastro realizado!",
            description: "Sua conta foi criada com sucesso. Faça o login para continuar.",
        });
        setActiveTab('login');
    } catch (error: any) {
        console.error(error);
        let description = 'Ocorreu um erro ao criar a conta. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este e-mail já está sendo utilizado por outra conta.';
        }
        toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description: description,
        });
    }
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

  useEffect(() => {
    signUpForm.reset({
      personType: personType,
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      ...(personType === 'cpf' ? { cpf: '' } : { cnpj: '' }),
    });
  }, [personType, signUpForm]);

  return (
    <div className="w-full max-w-md">
        <div className="text-center mb-6">
             <div className="flex items-center justify-center gap-2 font-semibold text-primary text-2xl">
                  <Icons.logo className="h-8 w-8" />
                  <span className="">Maestro Financeiro</span>
            </div>
        </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                     <Form {...loginForm}>
                         <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
                            <FormField
                                control={loginForm.control}
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
                                control={loginForm.control}
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
                            <Button className="w-full" type="submit">Entrar</Button>
                         </form>
                     </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <p className="text-xs text-center text-muted-foreground">
                        Esqueceu sua senha? <Link href="#" className="underline">Recupere aqui</Link>
                    </p>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(onRegister)}>
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
                      control={signUpForm.control}
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
                        control={signUpForm.control}
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
                    control={signUpForm.control}
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
                    control={signUpForm.control}
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
                        control={signUpForm.control}
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
                        control={signUpForm.control}
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
