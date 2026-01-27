'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, ExternalLink, BookOpen, Scale, Gavel } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { toast } from '@kit/ui/sonner';

import type { LegalCategory, LegalSource } from '~/lib/legal/types';

interface SearchResult {
  answer: string;
  sources: LegalSource[];
  relatedQuestions: string[];
}

const categories: Array<{ value: LegalCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Alle områder' },
  { value: 'employment_law', label: 'Arbeidsrett' },
  { value: 'contract_law', label: 'Kontraktsrett' },
  { value: 'company_law', label: 'Selskapsrett' },
  { value: 'real_estate', label: 'Eiendomsrett' },
  { value: 'family_law', label: 'Familierett' },
  { value: 'tax_law', label: 'Skatterett' },
  { value: 'intellectual_property', label: 'Immaterialrett' },
  { value: 'data_protection', label: 'Personvern' },
  { value: 'consumer_law', label: 'Forbrukerrett' },
];

export function LegalSearchForm() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LegalCategory | 'all'>('all');
  const [result, setResult] = useState<SearchResult | null>(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/legal-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category: category === 'all' ? undefined : category,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json() as Promise<SearchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      toast.error('Søket feilet. Prøv igjen.');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Skriv inn et søkeord');
      return;
    }
    searchMutation.mutate();
  };

  const handleRelatedQuestion = (question: string) => {
    setQuery(question);
    searchMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="F.eks. 'oppsigelse i prøvetid' eller 'reklamasjonsfrist forbrukerkjøp'"
            className="w-full"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as LegalCategory | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={searchMutation.isPending}>
          {searchMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Søk</span>
        </Button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Answer */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-medium">Svar</span>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {result.answer.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Kilder og referanser</span>
              </div>
              <div className="grid gap-2">
                {result.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="p-1.5 rounded bg-primary/10">
                      {source.type === 'law' && <Scale className="h-4 w-4 text-primary" />}
                      {source.type === 'case' && <Gavel className="h-4 w-4 text-primary" />}
                      {!['law', 'case'].includes(source.type) && <BookOpen className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{source.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {source.reference}
                        {source.excerpt && ` - ${source.excerpt}`}
                      </div>
                    </div>
                    {source.url && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related Questions */}
          {result.relatedQuestions.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Relaterte spørsmål</div>
              <div className="flex flex-wrap gap-2">
                {result.relatedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRelatedQuestion(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state with suggestions */}
      {!result && !searchMutation.isPending && (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">Prøv å søke etter:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Oppsigelsestid',
              'Reklamasjonsfrist',
              'GDPR samtykke',
              'Husleiedeposit',
              'Angrerett',
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery(suggestion);
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
