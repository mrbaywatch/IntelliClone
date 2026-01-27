'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { PlusCircle, Loader2 } from 'lucide-react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
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
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { toast } from '@kit/ui/sonner';

import type { LegalCategory } from '~/lib/legal/types';

interface NewCaseDialogProps {
  accountId: string;
}

const categories: Array<{ value: LegalCategory; label: string }> = [
  { value: 'employment_law', label: 'Arbeidsrett' },
  { value: 'contract_law', label: 'Kontraktsrett' },
  { value: 'company_law', label: 'Selskapsrett' },
  { value: 'real_estate', label: 'Eiendomsrett' },
  { value: 'family_law', label: 'Familierett' },
  { value: 'tax_law', label: 'Skatterett' },
  { value: 'intellectual_property', label: 'Immaterialrett' },
  { value: 'data_protection', label: 'Personvern' },
  { value: 'consumer_law', label: 'Forbrukerrett' },
  { value: 'public_law', label: 'Offentlig rett' },
  { value: 'criminal_law', label: 'Strafferett' },
  { value: 'immigration_law', label: 'Utlendingsrett' },
  { value: 'bankruptcy_law', label: 'Konkursrett' },
  { value: 'environmental_law', label: 'Miljørett' },
  { value: 'other', label: 'Annet' },
];

export function NewCaseDialog({ accountId }: NewCaseDialogProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [category, setCategory] = useState<LegalCategory>('other');
  const [clientName, setClientName] = useState('');

  const createCase = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('legal_cases' as any)
        .insert({
          account_id: accountId,
          name,
          description: description || null,
          case_number: caseNumber || null,
          category,
          client_name: clientName || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (data) => {
      toast.success('Sak opprettet');
      setOpen(false);
      resetForm();
      router.push(`/home/cases/${data.id}`);
    },
    onError: () => {
      toast.error('Kunne ikke opprette sak');
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setCaseNumber('');
    setCategory('other');
    setClientName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ny sak
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Opprett ny sak</DialogTitle>
          <DialogDescription>
            Opprett en sak for å organisere dokumenter og samtaler relatert til en juridisk sak.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Saksnavn *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Arbeidskontrakt ABC AS"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caseNumber">Saksnummer</Label>
            <Input
              id="caseNumber"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="F.eks. 2024-001"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as LegalCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clientName">Klient/Part</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Navn på klient eller motpart"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av saken..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => createCase.mutate()}
            disabled={!name.trim() || createCase.isPending}
          >
            {createCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oppretter...
              </>
            ) : (
              'Opprett sak'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
