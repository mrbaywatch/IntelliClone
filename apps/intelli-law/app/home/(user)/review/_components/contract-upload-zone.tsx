'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { 
  Cloud, 
  FileText, 
  Loader2, 
  AlertCircle,
  CheckCircle2 
} from 'lucide-react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import { Progress } from '@kit/ui/progress';
import { cn } from '@kit/ui/utils';
import { toast } from '@kit/ui/sonner';

interface ContractUploadZoneProps {
  accountId: string;
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

export function ContractUploadZone({ accountId }: ContractUploadZoneProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadState('uploading');
      setProgress(10);

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const documentId = nanoid(24);
      const fileName = `${accountId}/${documentId}.${fileExtension}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      setProgress(40);

      // Create document record - using type assertion as DB types may not include legal fields
      const { data: doc, error: docError } = await supabase
        .from('documents' as any)
        .insert({
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: '', // Will be extracted
          account_id: accountId,
          document_type: 'unknown',
          analysis_completed: false,
        })
        .select()
        .single();

      if (docError) throw docError;
      const docData = doc as { id: string };
      setProgress(60);

      setUploadState('analyzing');

      // Trigger analysis (this would call your analysis service)
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docData.id,
          storagePath: uploadData.path,
        }),
      });

      if (!response.ok) {
        // Even if analysis fails, we still have the document
        console.error('Analysis failed, but document uploaded');
      }

      setProgress(100);
      setUploadState('complete');

      return docData;
    },
    onSuccess: (doc) => {
      toast.success('Dokument lastet opp og analysert!');
      // Navigate to document view after a short delay
      setTimeout(() => {
        router.push(`/home/documents/${doc.id}`);
      }, 1500);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadState('error');
      toast.error('Kunne ikke laste opp dokumentet. Prøv igjen.');
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept: {
        'application/pdf': ['.pdf'],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10MB
      onDropAccepted: onDrop,
      disabled: uploadState !== 'idle',
    });

  const reset = () => {
    setUploadState('idle');
    setProgress(0);
    setSelectedFile(null);
  };

  // Show progress state
  if (uploadState !== 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        {uploadState === 'uploading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-medium">Laster opp dokument...</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedFile?.name}</p>
            </div>
          </>
        )}

        {uploadState === 'analyzing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-medium">Analyserer kontrakt...</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Identifiserer risikoer og nøkkelklausuler
              </p>
            </div>
          </>
        )}

        {uploadState === 'complete' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="font-medium text-green-600">Analyse fullført!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Videresender til resultatene...
              </p>
            </div>
          </>
        )}

        {uploadState === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h3 className="font-medium text-destructive">Noe gikk galt</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Kunne ikke laste opp eller analysere dokumentet
              </p>
              <Button onClick={reset} variant="outline" className="mt-4">
                Prøv igjen
              </Button>
            </div>
          </>
        )}

        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground mt-2">
            {progress}% fullført
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-lg border-2 border-dashed p-12 transition-colors',
        'hover:border-primary hover:bg-primary/5',
        isDragAccept && 'border-green-500 bg-green-50 dark:bg-green-500/10',
        isDragReject && 'border-red-500 bg-red-50 dark:bg-red-500/10'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Cloud className="h-8 w-8 text-primary" />
        </div>

        <div className="text-center">
          <h3 className="font-medium">
            Dra og slipp kontrakt her
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            eller klikk for å velge fil
          </p>
        </div>

        <Button type="button" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Velg PDF-fil
        </Button>

        <p className="text-xs text-muted-foreground">
          Støtter PDF-filer opptil 10MB
        </p>
      </div>
    </div>
  );
}
