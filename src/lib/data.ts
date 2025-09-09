import type { Category } from '@/lib/types';
import { Landmark, ShoppingCart, Utensils, Home, Car, Activity, Shirt, Gift, Film, Book, GraduationCap, ArrowDown, ArrowUp, CalendarClock, ArrowRightLeft, PiggyBank } from 'lucide-react';

// Static data like categories can remain here
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
  { id: 'cat14', name: 'Contas Fixas', icon: CalendarClock },
  { id: 'cat15', name: 'Transferência', icon: ArrowRightLeft },
  { id: 'cat16', name: 'Aporte para Meta', icon: PiggyBank },
];

// User-specific data is now fetched from Firestore, so these arrays are empty.
export const accounts = [];
export const transactions = [];
export const budgets = [];
export const recurringTransactions = [];
