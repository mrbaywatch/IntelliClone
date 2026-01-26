'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  FileText, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  ChevronRight 
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

interface Document {
  id: string;
  title: string;
  document_type?: string | null;
  risk_level?: string | null;
  risk_score?: number | null;
  analysis_completed?: boolean | null;
  created_at: string;
}

interface RecentReviewsProps {
  documents: Document[];
}

const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  contract: 'Avtale',
  employment_contract: 'Arbeidsavtale',
  lease_agreement: 'Leieavtale',
  purchase_agreement: 'Kjøpsavtale',
  shareholder_agreement: 'Aksjonæravtale',
  nda: 'Konfidensialitetsavtale',
  terms_of_service: 'Vilkår',
  privacy_policy: 'Personvernerklæring',
  power_of_attorney: 'Fullmakt',
  memorandum: 'Notat',
  legal_opinion: 'Juridisk vurdering',
  board_resolution: 'Styrevedtak',
  general_assembly: 'Generalforsamling',
  unknown: 'Ukjent',
};

const RISK_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  low: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle2 
  },
  medium: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: AlertCircle 
  },
  high: { 
    bg: 'bg-orange-100 dark:bg-orange-900/30', 
    text: 'text-orange-700 dark:text-orange-400',
    icon: AlertTriangle 
  },
  critical: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-400',
    icon: AlertTriangle 
  },
};

const RISK_LABELS: Record<string, string> = {
  low: 'Lav risiko',
  medium: 'Middels risiko',
  high: 'Høy risiko',
  critical: 'Kritisk risiko',
};

export function RecentReviews({ documents }: RecentReviewsProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Ingen analyserte dokumenter ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const riskStyle = doc.risk_level ? RISK_COLORS[doc.risk_level] : null;
        const RiskIcon = riskStyle?.icon || CheckCircle2;

        return (
          <Link
            key={doc.id}
            href={`/home/documents/${doc.id}`}
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-2 rounded-lg',
                riskStyle?.bg || 'bg-muted'
              )}>
                <FileText className={cn(
                  'h-5 w-5',
                  riskStyle?.text || 'text-muted-foreground'
                )} />
              </div>

              <div>
                <h4 className="font-medium line-clamp-1">{doc.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {DOCUMENT_TYPE_NAMES[doc.document_type || 'unknown'] || doc.document_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {doc.risk_level && riskStyle && (
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                  riskStyle.bg,
                  riskStyle.text
                )}>
                  <RiskIcon className="h-3.5 w-3.5" />
                  <span className="font-medium">{RISK_LABELS[doc.risk_level]}</span>
                  {doc.risk_score !== null && (
                    <span className="opacity-70">({doc.risk_score})</span>
                  )}
                </div>
              )}

              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
