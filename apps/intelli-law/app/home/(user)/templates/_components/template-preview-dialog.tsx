'use client';

import { FileText, Scale, Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Badge } from '@kit/ui/badge';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Separator } from '@kit/ui/separator';

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

interface TemplatePreviewDialogProps {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewDialog({ 
  template, 
  open, 
  onOpenChange 
}: TemplatePreviewDialogProps) {
  // Highlight placeholders in template content
  const highlightedContent = template.template_content.replace(
    /\{\{(\w+)\}\}/g,
    '<span class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</span>'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <DialogTitle>{template.name_norwegian}</DialogTitle>
          </div>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Template Content */}
          <div className="md:col-span-2">
            <h3 className="font-medium mb-2">Malinnhold</h3>
            <ScrollArea className="h-[500px] rounded-md border p-4">
              <pre 
                className="text-sm whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
            </ScrollArea>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Info */}
            <div>
              <h3 className="font-medium mb-2">Om malen</h3>
              <div className="space-y-2 text-sm">
                {template.legal_basis && (
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span>{template.legal_basis}</span>
                  </div>
                )}
                <Badge variant="outline">v{template.version}</Badge>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            {template.instructions && (
              <>
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Instruksjoner
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {template.instructions}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Placeholders */}
            <div>
              <h3 className="font-medium mb-2">Felt som må fylles ut</h3>
              <div className="space-y-2">
                {template.placeholders.map((placeholder) => (
                  <div 
                    key={placeholder.key}
                    className="text-sm p-2 rounded bg-muted"
                  >
                    <div className="font-medium">
                      {placeholder.labelNorwegian}
                      {placeholder.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {placeholder.label}
                    </div>
                    {placeholder.type === 'select' && placeholder.options && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {placeholder.options.map((opt) => (
                          <Badge key={opt} variant="secondary" className="text-xs">
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
