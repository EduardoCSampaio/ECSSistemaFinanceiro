import type { Account, Category, Transaction, Budget } from '@/lib/types';
import { Landmark, ShoppingCart, Utensils, Home, Car, Activity, Shirt, Gift, Film, Book, GraduationCap, ArrowDown, ArrowUp } from 'lucide-react';

export const accounts: Account[] = [
  { id: 'acc1', name: 'Conta Corrente', bank: 'Banco Principal', balance: 0 },
];

export const categories: Category[] = [
  { id: 'cat1', name: 'Moradia', icon: Home },
  { id: 'cat2', name: 'Alimentação', icon: Utensils },
  { id: 'cat3', name: 'Transporte', icon: Car },
  { id: 'cat4', name: 'Saúde', icon: Activity },
  { id: 'cat5', name: 'Lazer', icon: Film },
  { id: 'cat6', name: 'Compras', icon: ShoppingCart },
  { id: 'cat7', name: 'Vestuário', icon: Shirt },
  { id: 'cat8', name: 'Educação', icon: GraduationCap },
  { id: 'cat9', name: 'Presentes', icon: Gift },
  { id: 'cat10', name: 'Livros', icon: Book },
  { id: 'cat11', name: 'Salário', icon: ArrowUp },
  { id: 'cat12', name: 'Outras Receitas', icon: ArrowUp },
  { id: 'cat13', name: 'Outras Despesas', icon: ArrowDown },
];

export const transactions: Transaction[] = [];

export const budgets: Budget[] = [];
