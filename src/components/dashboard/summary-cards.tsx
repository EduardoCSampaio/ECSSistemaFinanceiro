import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Landmark, ArrowUpRight, ArrowDownLeft, PiggyBank } from 'lucide-react';
import { accounts, transactions } from '@/lib/data';

export function SummaryCards() {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date.getMonth() === thisMonth && t.date.getFullYear() === thisYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.getMonth() === thisMonth && t.date.getFullYear() === thisYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySavings = monthlyIncome + monthlyExpenses; // expenses are negative

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <p className="text-xs text-muted-foreground">Em todas as contas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">Entradas no mês atual</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(Math.abs(monthlyExpenses))}</div>
          <p className="text-xs text-muted-foreground">Saídas no mês atual</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economia (Mês)</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthlySavings)}</div>
          <p className="text-xs text-muted-foreground">Saldo do mês atual</p>
        </CardContent>
      </Card>
    </div>
  )
}
