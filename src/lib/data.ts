import type { Account, Category, Transaction, Budget } from '@/lib/types';
import { Landmark, ShoppingCart, Utensils, Home, Car, Activity, Shirt, Gift, Film, Book, GraduationCap, ArrowDown, ArrowUp } from 'lucide-react';

export const accounts: Account[] = [
  { id: 'acc1', name: 'Conta Corrente', bank: 'Banco Principal', balance: 12540.75 },
  { id: 'acc2', name: 'Conta Poupança', bank: 'Banco Principal', balance: 82300.00 },
  { id: 'acc3', name: 'Carteira Digital', bank: 'App de Pagamentos', balance: 850.20 },
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

const today = new Date();
const getRandomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(today.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

export const transactions: Transaction[] = [
  { id: 'trx1', date: getRandomDate(1), description: 'Salário Mensal', amount: 7500, type: 'income', category: categories[10], account: accounts[0] },
  { id: 'trx2', date: getRandomDate(2), description: 'Aluguel', amount: -1500, type: 'expense', category: categories[0], account: accounts[0] },
  { id: 'trx3', date: getRandomDate(3), description: 'Supermercado do Mês', amount: -850.50, type: 'expense', category: categories[1], account: accounts[0] },
  { id: 'trx4', date: getRandomDate(5), description: 'Gasolina', amount: -150, type: 'expense', category: categories[2], account: accounts[0] },
  { id: 'trx5', date: getRandomDate(7), description: 'Cinema', amount: -80, type: 'expense', category: categories[4], account: accounts[2] },
  { id: 'trx6', date: getRandomDate(10), description: 'Venda de Item Usado', amount: 250, type: 'income', category: categories[11], account: accounts[2] },
  { id: 'trx7', date: getRandomDate(12), description: 'Restaurante Japonês', amount: -220, type: 'expense', category: categories[1], account: accounts[0] },
  { id: 'trx8', date: getRandomDate(15), description: 'Curso Online', amount: -300, type: 'expense', category: categories[7], account: accounts[1] },
  { id: 'trx9', date: getRandomDate(20), description: 'Compra de Roupas', amount: -400, type: 'expense', category: categories[6], account: accounts[0] },
  { id: 'trx10', date: getRandomDate(25), description: 'Consulta Médica', amount: -250, type: 'expense', category: categories[3], account: accounts[0] },
  { id: 'trx11', date: getRandomDate(32), description: 'Salário Mensal', amount: 7500, type: 'income', category: categories[10], account: accounts[0] },
  { id: 'trx12', date: getRandomDate(40), description: 'Supermercado', amount: -600, type: 'expense', category: categories[1], account: accounts[0] },
  { id: 'trx13', date: getRandomDate(50), description: 'Freelance', amount: 1200, type: 'income', category: categories[11], account: accounts[2] },
  { id: 'trx14', date: getRandomDate(65), description: 'Manutenção do Carro', amount: -900, type: 'expense', category: categories[2], account: accounts[0] },
  { id: 'trx15', date: getRandomDate(70), description: 'Conta de Luz', amount: -180, type: 'expense', category: categories[0], account: accounts[0] },
  { id: 'trx16', date: getRandomDate(80), description: 'Presente de Aniversário', amount: -150, type: 'expense', category: categories[8], account: accounts[2]},
  { id: 'trx17', date: getRandomDate(90), description: 'Livros para Estudo', amount: -200, type: 'expense', category: categories[9], account: accounts[1] },
];

export const budgets: Budget[] = [
  { id: 'bud1', category: categories[1], amount: 1200, spent: transactions.filter(t => t.category.id === 'cat2' && t.date.getMonth() === today.getMonth()).reduce((sum, t) => sum + Math.abs(t.amount), 0) },
  { id: 'bud2', category: categories[2], amount: 400, spent: transactions.filter(t => t.category.id === 'cat3' && t.date.getMonth() === today.getMonth()).reduce((sum, t) => sum + Math.abs(t.amount), 0) },
  { id: 'bud3', category: categories[4], amount: 300, spent: transactions.filter(t => t.category.id === 'cat5' && t.date.getMonth() === today.getMonth()).reduce((sum, t) => sum + Math.abs(t.amount), 0) },
  { id: 'bud4', category: categories[6], amount: 500, spent: transactions.filter(t => t.category.id === 'cat7' && t.date.getMonth() === today.getMonth()).reduce((sum, t) => sum + Math.abs(t.amount), 0) },
];
