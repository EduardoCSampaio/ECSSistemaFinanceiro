'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PlusCircle, SlidersHorizontal, MoreHorizontal, Pencil, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Account, Category, Goal } from '@/lib/types';
import { AddTransactionSheet } from './add-transaction-sheet';
import { ConfirmDialog } from './confirm-dialog';
import { ImportTransactionsDialog } from './import-transactions-dialog';
import { cn } from '@/lib/utils';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

interface TransactionsDataTableProps {
  transactions: Transaction[];
  onAddTransaction: (data: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  onUpdateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onAddTransactionsBatch: (data: Omit<Transaction, 'id' | 'userId'>[]) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
}

export function TransactionsDataTable({ 
    transactions, 
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onAddTransactionsBatch,
    accounts, 
    categories,
    goals
}: TransactionsDataTableProps) {
  const [data, setData] = React.useState(() => [...transactions]);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'date', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<Transaction | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<Transaction | null>(null);

  React.useEffect(() => {
    setData(transactions);
  }, [transactions]);

  const openEditSheet = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsSheetOpen(true);
  };

  const openAddSheet = () => {
    setTransactionToEdit(null);
    setIsSheetOpen(true);
  };
  
  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmOpen(true);
  };
  
  const handleSaveTransaction = async (values: Omit<Transaction, 'id' | 'userId'>) => {
      if (transactionToEdit) {
          await onUpdateTransaction(transactionToEdit.id, values);
      } else {
          await onAddTransaction(values);
      }
      setIsSheetOpen(false);
      setTransactionToEdit(null);
  };

  const handleDelete = async () => {
      if(transactionToDelete) {
        await onDeleteTransaction(transactionToDelete.id);
        setIsConfirmOpen(false);
        setTransactionToDelete(null);
      }
  }

 const columns: ColumnDef<Transaction>[] = [
    {
        accessorKey: 'date',
        header: 'Data',
        cell: ({ row }) => {
            const date = row.getValue('date') as any;
            return formatDate(date.toDate()); // Firestore timestamp to Date
        },
    },
    {
        accessorKey: 'description',
        header: 'Descrição',
    },
    {
        accessorKey: 'categoryId',
        header: 'Categoria',
        cell: ({ row }) => {
            const categoryId = row.getValue('categoryId');
            const category = categories.find((c: Category) => c.id === categoryId);
            return <Badge variant="outline">{category?.name || 'N/A'}</Badge>
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'accountId',
        header: 'Conta',
        cell: ({ row }) => {
            const accountId = row.getValue('accountId');
            const account = accounts.find((a: Account) => a.id === accountId);
            return account?.name || 'N/A';
        },
    },
    {
        accessorKey: 'amount',
        header: () => <div className="text-right">Valor</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('amount'));
            const type = row.original.type;
            const formatted = formatCurrency(Math.abs(amount));

            return <div className={cn("text-right font-medium", type === 'income' ? 'text-emerald-500' : 'text-red-500')}>{type === 'expense' ? '-' : ''}{formatted}</div>;
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
          const transaction = row.original;
          const category = categories.find(c => c.id === transaction.categoryId);
          const isTransfer = category?.name === 'Transferência';

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditSheet(transaction)} disabled={isTransfer}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openDeleteDialog(transaction)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
];


  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
        accounts,
        categories
    },
    initialState: {
        pagination: {
            pageSize: 10,
        }
    }
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filtrar por descrição..."
          value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('description')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4"/> Colunas
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    const columnLabels: { [key: string]: string } = {
                        date: 'Data',
                        description: 'Descrição',
                        categoryId: 'Categoria',
                        accountId: 'Conta',
                        amount: 'Valor',
                    };
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {columnLabels[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
            <ImportTransactionsDialog 
              accounts={accounts} 
              categories={categories}
              onSave={onAddTransactionsBatch}
            >
              <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Importar CSV
              </Button>
            </ImportTransactionsDialog>
            <Button onClick={openAddSheet}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Transação
            </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhuma transação encontrada. Adicione uma para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} transação(ões).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
       <AddTransactionSheet 
        key={transactionToEdit ? transactionToEdit.id : 'new'}
        isOpen={isSheetOpen}
        onSetOpen={setIsSheetOpen}
        onSave={handleSaveTransaction} 
        transactionToEdit={transactionToEdit}
        accounts={accounts} 
        categories={categories}
        goals={goals}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a transação "${transactionToDelete?.description}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
