'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Account, Category } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Lightbulb } from 'lucide-react';
import { parse, format } from 'date-fns';

interface MappingStepProps {
    headers: string[];
    data: string[][];
    accounts: Account[];
    categories: Category[];
    onComplete: (data: any[]) => void;
}

const REQUIRED_COLUMNS = ['date', 'description', 'amount'];
const COMMON_DATE_FORMATS = [
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd-MM-yyyy',
    'yyyy/MM/dd'
];


const parseAmount = (value: string): number => {
    if (!value) return 0;
    // Remove currency symbols, thousand separators, and replace comma decimal with dot
    const cleaned = value.replace(/[^0-9,-.]/g, '').replace('.', '').replace(',', '.');
    return parseFloat(cleaned);
}

const parseDate = (value: string): Date | null => {
    if (!value) return null;
    for (const format of COMMON_DATE_FORMATS) {
        try {
            const parsed = parse(value, format, new Date());
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        } catch (e) {
            // ignore and try next format
        }
    }
    return null;
}

export function MappingStep({ headers, data, accounts, categories, onComplete }: MappingStepProps) {
    const [mapping, setMapping] = useState<{ [key: string]: string | null }>({
        date: null,
        description: null,
        amount: null,
    });
    const [accountId, setAccountId] = useState<string | null>(null);
    const [selectAll, setSelectAll] = useState(true);
    const [rows, setRows] = useState<any[]>([]);

    const handleMappingChange = (key: string, value: string) => {
        setMapping(prev => ({ ...prev, [key]: value }));
    };

    const isMappingComplete = useMemo(() => {
        return REQUIRED_COLUMNS.every(col => mapping[col] !== null) && accountId !== null;
    }, [mapping, accountId]);

    const expenseCategories = useMemo(() => {
        return categories.filter(c => !['Salário', 'Outras Receitas'].includes(c.name));
    }, [categories]);

    useEffect(() => {
        if(isMappingComplete) {
            const mappedData = data.map((row, index) => {
                const amountValue = parseAmount(row[headers.indexOf(mapping.amount!)]);
                const dateValue = parseDate(row[headers.indexOf(mapping.date!)]);
                const descriptionValue = row[headers.indexOf(mapping.description!)];

                return {
                    id: index,
                    import: true,
                    date: dateValue,
                    description: descriptionValue,
                    amount: Math.abs(amountValue),
                    type: amountValue < 0 ? 'expense' : 'income',
                    accountId: accountId,
                    categoryId: null
                }
            });
            setRows(mappedData);
        }
    }, [mapping, accountId, data, headers]);

    const handleRowChange = (id: number, key: string, value: any) => {
        setRows(prevRows => prevRows.map(row => row.id === id ? { ...row, [key]: value } : row));
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        setRows(prevRows => prevRows.map(row => ({...row, import: checked })));
    }

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold">Passo 1: Mapear Colunas e Selecionar Conta</h3>
            <p className="text-sm text-muted-foreground">Associe as colunas do seu arquivo CSV aos campos necessários e escolha a conta para importar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
            {REQUIRED_COLUMNS.map(col => (
                <div key={col} className="space-y-1">
                    <label className="text-sm font-medium">Coluna de {col === 'date' ? 'Data' : col === 'description' ? 'Descrição' : 'Valor'}</label>
                    <Select onValueChange={(value) => handleMappingChange(col, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma coluna" />
                        </SelectTrigger>
                        <SelectContent>
                            {headers.map(header => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            ))}
            <div className="space-y-1">
                 <label className="text-sm font-medium">Importar para a conta</label>
                 <Select onValueChange={setAccountId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        {isMappingComplete && (
            <div>
                 <h3 className="text-lg font-semibold mt-6 mb-2">Passo 2: Revisar e Ajustar Transações</h3>
                 <p className="text-sm text-muted-foreground mb-4">Ajuste a categoria e decida quais transações importar. O sistema tentará adivinhar o tipo (receita/despesa) com base no valor.</p>
                
                 <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Dica!</AlertTitle>
                    <AlertDescription>
                        Valores negativos no CSV foram marcados como Despesas. Se não for o caso, ajuste o tipo manualmente. Verifique se as datas foram reconhecidas corretamente.
                    </AlertDescription>
                </Alert>


                 <div className="rounded-md border mt-4">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox
                                        checked={selectAll}
                                        onCheckedChange={handleSelectAll}
                                     />
                                </TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="w-40">Tipo</TableHead>
                                <TableHead className="w-56">Categoria</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={row.import}
                                            onCheckedChange={(checked) => handleRowChange(row.id, 'import', checked)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.date ? format(row.date, 'dd/MM/yyyy') : <span className="text-destructive">Data inválida</span>}
                                    </TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell className="text-right font-mono">{row.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                         <Select value={row.type} onValueChange={(value) => handleRowChange(row.id, 'type', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="income">Receita</SelectItem>
                                                <SelectItem value="expense">Despesa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                         <Select value={row.categoryId || ''} onValueChange={(value) => handleRowChange(row.id, 'categoryId', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {expenseCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>

                 <div className="flex justify-end mt-6">
                    <Button onClick={() => onComplete(rows)}>
                        Continuar para Resumo
                    </Button>
                 </div>
            </div>
        )}
    </div>
  )
}
