'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

import { 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  FolderOpen, 
  FileText 
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';

import type { LegalCategory } from '~/lib/legal/types';

interface Case {
  id: string;
  name: string;
  description?: string;
  case_number?: string;
  category: string;
  status: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
  case_documents: Array<{ count: number }>;
}

interface CasesTableProps {
  data: Case[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Aktiv', variant: 'default' },
  pending: { label: 'Ventende', variant: 'secondary' },
  closed: { label: 'Avsluttet', variant: 'outline' },
  archived: { label: 'Arkivert', variant: 'outline' },
};

const categoryLabels: Record<LegalCategory, string> = {
  employment_law: 'Arbeidsrett',
  contract_law: 'Kontraktsrett',
  company_law: 'Selskapsrett',
  real_estate: 'Eiendomsrett',
  family_law: 'Familierett',
  tax_law: 'Skatterett',
  intellectual_property: 'Immaterialrett',
  data_protection: 'Personvern',
  consumer_law: 'Forbrukerrett',
  public_law: 'Offentlig rett',
  criminal_law: 'Strafferett',
  immigration_law: 'Utlendingsrett',
  bankruptcy_law: 'Konkursrett',
  environmental_law: 'Miljørett',
  other: 'Annet',
};

export function CasesTable({ data }: CasesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sak</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Dokumenter</TableHead>
          <TableHead>Oppdatert</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((caseItem) => {
          const status = statusLabels[caseItem.status] || statusLabels.active;
          const documentCount = caseItem.case_documents?.[0]?.count || 0;

          return (
            <TableRow key={caseItem.id}>
              <TableCell>
                <Link href={`/home/cases/${caseItem.id}`} className="hover:underline">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{caseItem.name}</div>
                      {caseItem.case_number && (
                        <div className="text-xs text-muted-foreground">
                          #{caseItem.case_number}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[caseItem.category] || caseItem.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span className="text-sm">{documentCount}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(caseItem.updated_at), {
                  addSuffix: true,
                  locale: nb,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/home/cases/${caseItem.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Se detaljer
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Slett
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
