'use client';

import { useState } from 'react';
import { useCSVReader } from 'react-papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Account, Category, Transaction } from '@/lib/types';
import { UploadStep } from './import/upload-step';
import { MappingStep } from './import/mapping-step';
import { SummaryStep } from './import/summary-step';
import { add } from 'date-fns';

interface ImportTransactionsDialogProps {
    children: React.ReactNode;
    accounts: Account[];
    categories: Category[];
    onSave: (data: Omit<Transaction, 'id' | 'userId'>[]) => Promise<void>;
}

const initialColumnMapping = {
    date: null,
    description: null,
    amount: null,
};

export function ImportTransactionsDialog({ children, accounts, categories, onSave }: ImportTransactionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); // 0: upload, 1: mapping, 2: summary
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappedData, setMappedData] = useState<any[]>([]);

  const { toast } = useToast();

  const resetFlow = () => {
    setStep(0);
    setCsvData([]);
    setHeaders([]);
    setMappedData([]);
  };

  const handleUploadAccepted = (results: any) => {
    const headerRow = results.data[0];
    const dataRows = results.data.slice(1);

    // Basic validation
    if (dataRows.length === 0 || dataRows.some((row: string[]) => row.length !== headerRow.length)) {
        toast({
            variant: "destructive",
            title: "Arquivo CSV Inválido",
            description: "Verifique se o arquivo tem cabeçalhos e se todas as linhas têm o mesmo número de colunas.",
        });
        return;
    }
    
    setHeaders(headerRow);
    setCsvData(dataRows);
    setStep(1);
  };

  const handleMappingComplete = (data: any[]) => {
    setMappedData(data);
    setStep(2);
  };

  const handleConfirmImport = async () => {
    try {
        const transactionsToSave = mappedData.filter(t => t.import);
        if (transactionsToSave.length === 0) {
            toast({
                title: "Nenhuma Transação Selecionada",
                description: "Nenhuma transação foi importada.",
            });
            setIsOpen(false);
            resetFlow();
            return;
        }

        await onSave(transactionsToSave);

        toast({
            title: "Importação Concluída",
            description: `${transactionsToSave.length} transações foram importadas com sucesso.`,
        });

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro na Importação",
            description: "Ocorreu um erro ao salvar as transações.",
        });
    } finally {
        setIsOpen(false);
        resetFlow();
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetFlow();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
            {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Importar Transações de um Arquivo CSV</DialogTitle>
                <DialogDescription>
                    Siga os passos para importar suas transações de forma rápida e fácil.
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
                {step === 0 && (
                    <UploadStep onUpload={handleUploadAccepted} />
                )}
                {step === 1 && (
                    <MappingStep 
                        headers={headers} 
                        data={csvData} 
                        accounts={accounts}
                        categories={categories}
                        onComplete={handleMappingComplete} 
                    />
                )}
                {step === 2 && (
                   <SummaryStep data={mappedData} categories={categories} accounts={accounts} />
                )}
            </div>

            <DialogFooter>
                 <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
                {step > 0 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                        Voltar
                    </Button>
                )}
                 {step === 2 && (
                    <Button onClick={handleConfirmImport}>
                        Confirmar e Importar {mappedData.filter(t => t.import).length} Transações
                    </Button>
                )}
            </DialogFooter>

        </DialogContent>
    </Dialog>
  )
}
