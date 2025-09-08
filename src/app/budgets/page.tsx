import { AlertCircle, PlusCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { budgets } from '@/lib/data';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function BudgetsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Orçamentos</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Novo Orçamento
            </span>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.amount) * 100;
          const isOverBudget = percentage > 100;

          return (
            <Card key={budget.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <budget.category.icon className="h-5 w-5 text-muted-foreground" />
                    {budget.category.name}
                  </CardTitle>
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <Progress value={Math.min(percentage, 100)} className={cn(percentage > 90 && 'bg-destructive/20 [&>*]:bg-destructive')} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(budget.spent)}</span>
                  <span className="text-muted-foreground">de {formatCurrency(budget.amount)}</span>
                </div>
                {isOverBudget && (
                   <Alert variant="destructive" className="p-3">
                     <AlertCircle className="h-4 w-4" />
                     <AlertDescription className="text-xs">
                       Você ultrapassou o orçamento em {formatCurrency(budget.spent - budget.amount)}.
                     </AlertDescription>
                   </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
