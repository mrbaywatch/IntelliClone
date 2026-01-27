'use client';

import { useState } from 'react';
import { FileText, Download, Eye, Scale } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import { TemplatePreviewDialog } from './template-preview-dialog';
import { TemplateGeneratorDialog } from './template-generator-dialog';

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

interface TemplateCardProps {
  template: Template;
  accountId: string;
}

const documentTypeLabels: Record<string, string> = {
  employment_contract: 'Arbeidsavtale',
  lease_agreement: 'Leieavtale',
  nda: 'Konfidensialitetsavtale',
  contract: 'Kontrakt',
  power_of_attorney: 'Fullmakt',
  purchase_agreement: 'Kjøpsavtale',
  shareholder_agreement: 'Aksjonæravtale',
  terms_of_service: 'Vilkår',
  privacy_policy: 'Personvernerklæring',
  board_resolution: 'Styrevedtak',
  general_assembly: 'Generalforsamlingsprotokoll',
};

export function TemplateCard({ template, accountId }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{template.name_norwegian}</CardTitle>
                <CardDescription className="text-xs">{template.name}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground mb-3">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {documentTypeLabels[template.document_type] || template.document_type}
            </Badge>
            {template.legal_basis && (
              <Badge variant="secondary" className="text-xs">
                <Scale className="mr-1 h-3 w-3" />
                {template.legal_basis}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Se mal
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowGenerator(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Bruk mal
          </Button>
        </CardFooter>
      </Card>

      {showPreview && (
        <TemplatePreviewDialog
          template={template}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}

      {showGenerator && (
        <TemplateGeneratorDialog
          template={template}
          accountId={accountId}
          open={showGenerator}
          onOpenChange={setShowGenerator}
        />
      )}
    </>
  );
}
