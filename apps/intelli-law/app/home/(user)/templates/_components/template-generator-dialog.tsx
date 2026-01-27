'use client';

import { useState } from 'react';
import { Download, FileText, Copy, Check, Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { toast } from '@kit/ui/sonner';

interface TemplatePlaceholder {
  key: string;
  label: string;
  labelNorwegian: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

interface Template {
  id: string;
  name: string;
  name_norwegian: string;
  description: string | null;
  category: string;
  document_type: string;
  template_content: string;
  placeholders: TemplatePlaceholder[];
  instructions: string | null;
  legal_basis: string | null;
  version: string;
  is_public: boolean;
}

interface TemplateGeneratorDialogProps {
  template: Template;
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateGeneratorDialog({ 
  template, 
  accountId,
  open, 
  onOpenChange 
}: TemplateGeneratorDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Initialize with default values
    const initial: Record<string, string> = {};
    template.placeholders.forEach((p) => {
      if (p.defaultValue) {
        initial[p.key] = p.defaultValue;
      }
    });
    return initial;
  });
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

  const handleValueChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const generateDocument = () => {
    // Check required fields
    const missingRequired = template.placeholders
      .filter((p) => p.required && !values[p.key]?.trim())
      .map((p) => p.labelNorwegian);

    if (missingRequired.length > 0) {
      toast.error(`Mangler påkrevde felt: ${missingRequired.join(', ')}`);
      return;
    }

    // Replace placeholders
    let document = template.template_content;
    
    // Handle regular placeholders
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      document = document.replace(regex, value || '');
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    template.placeholders.forEach((p) => {
      const ifRegex = new RegExp(`\\{\\{#if ${p.key}\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}`, 'g');
      document = document.replace(ifRegex, (_, content) => {
        return values[p.key]?.trim() ? content : '';
      });
    });

    // Clean up any remaining unfilled placeholders
    document = document.replace(/\{\{\w+\}\}/g, '_______________');

    setGeneratedDocument(document);
    setActiveTab('preview');
    toast.success('Dokument generert!');
  };

  const copyToClipboard = async () => {
    if (!generatedDocument) return;
    
    try {
      await navigator.clipboard.writeText(generatedDocument);
      setCopied(true);
      toast.success('Kopiert til utklippstavlen');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kunne ikke kopiere');
    }
  };

  const downloadAsText = () => {
    if (!generatedDocument) return;
    
    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name_norwegian.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dokument lastet ned');
  };

  const renderField = (placeholder: TemplatePlaceholder) => {
    const value = values[placeholder.key] || '';
    const id = `field-${placeholder.key}`;

    switch (placeholder.type) {
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(v) => handleValueChange(placeholder.key, v)}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder="Velg..." />
            </SelectTrigger>
            <SelectContent>
              {placeholder.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'multiline':
        return (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => handleValueChange(placeholder.key, e.target.value)}
            rows={3}
          />
        );
      
      case 'date':
        return (
          <Input
            id={id}
            type="date"
            value={value}
            onChange={(e) => handleValueChange(placeholder.key, e.target.value)}
          />
        );
      
      case 'number':
        return (
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) => handleValueChange(placeholder.key, e.target.value)}
          />
        );
      
      default:
        return (
          <Input
            id={id}
            type="text"
            value={value}
            onChange={(e) => handleValueChange(placeholder.key, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <DialogTitle>Generer {template.name_norwegian}</DialogTitle>
          </div>
          <DialogDescription>
            Fyll ut feltene nedenfor for å generere dokumentet.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Fyll ut</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedDocument}>
              Forhåndsvisning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-4 md:grid-cols-2">
                {template.placeholders.map((placeholder) => (
                  <div key={placeholder.key} className="space-y-2">
                    <Label htmlFor={`field-${placeholder.key}`}>
                      {placeholder.labelNorwegian}
                      {placeholder.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {renderField(placeholder)}
                    {placeholder.label !== placeholder.labelNorwegian && (
                      <p className="text-xs text-muted-foreground">
                        {placeholder.label}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[500px] rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {generatedDocument}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {activeTab === 'form' ? (
            <Button onClick={generateDocument}>
              <FileText className="mr-2 h-4 w-4" />
              Generer dokument
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Kopier tekst
                  </>
                )}
              </Button>
              <Button onClick={downloadAsText}>
                <Download className="mr-2 h-4 w-4" />
                Last ned
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
