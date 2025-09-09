'use client';

import { useCSVReader } from 'react-papaparse';
import { Button } from '../ui/button';
import { UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface UploadStepProps {
    onUpload: (results: any) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const { CSVReader } = useCSVReader();

  return (
     <CSVReader onUploadAccepted={onUpload}>
      {({ getRootProps, acceptedFile, ProgressBar, getRemoveFileProps }: any) => (
        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center space-y-6">
            <UploadCloud className="h-16 w-16 text-muted-foreground" />
             <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Arraste e solte seu arquivo CSV aqui</h2>
                <p className="text-muted-foreground">ou clique no botão abaixo para selecionar um arquivo</p>
             </div>

            <Button type="button" size="lg" {...getRootProps()}>
                Selecionar Arquivo
            </Button>
            
            {acceptedFile && (
                <div className="w-full max-w-md">
                    <Alert>
                        <AlertTitle>Arquivo Selecionado</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{acceptedFile.name}</span>
                             <Button variant="ghost" size="sm" {...getRemoveFileProps()} className="text-destructive hover:bg-destructive/10">
                                Remover
                             </Button>
                        </AlertDescription>
                    </Alert>
                    <ProgressBar className="mt-2" />
                </div>
            )}
        </div>
      )}
    </CSVReader>
  );
}
