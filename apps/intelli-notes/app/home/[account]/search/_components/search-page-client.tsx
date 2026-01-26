'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  Search,
  FileText,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

import { Input } from '@kit/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import type { MeetingSearchResult } from '~/lib/meetings/types';

// =============================================================================
// Types
// =============================================================================

interface SearchPageClientProps {
  accountSlug: string;
}

interface SearchResponse {
  results: MeetingSearchResult[];
}

// =============================================================================
// API Functions
// =============================================================================

async function searchTranscripts(
  accountId: string,
  query: string
): Promise<SearchResponse> {
  if (!query.trim()) return { results: [] };

  const params = new URLSearchParams({
    account_id: accountId,
    query,
    limit: '20',
  });

  const response = await fetch(`/api/meetings/search?${params}`);
  if (!response.ok) throw new Error('Failed to search');
  return response.json();
}

// =============================================================================
// Search Result Card Component
// =============================================================================

function SearchResultCard({ result, accountSlug }: { result: MeetingSearchResult; accountSlug: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{result.meeting_title}</CardTitle>
          </div>
          <Link
            href={`/home/${accountSlug}/meetings/${result.meeting_id}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Se møte
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-sm text-muted-foreground prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: result.snippet }}
        />
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span className="bg-muted px-2 py-0.5 rounded">
            Relevans: {Math.round(result.rank * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SearchPageClient({ accountSlug }: SearchPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      debouncedSetQuery(value);
    },
    [debouncedSetQuery]
  );

  const accountId = accountSlug;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['search', accountId, debouncedQuery],
    queryFn: () => searchTranscripts(accountId, debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  const results = data?.results || [];
  const hasQuery = debouncedQuery.length >= 2;
  const showResults = hasQuery && !isLoading;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Søk i alle møtetranskripsjoner..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 h-12 text-lg"
          autoFocus
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Tips (when no query) */}
      {!hasQuery && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Søketips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Søk etter nøkkelord, navn, eller temaer som ble diskutert i møtene dine.</p>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Eksempler:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>«budsjettet for 2024»</li>
                <li>«Ola nevnte»</li>
                <li>«lansering neste uke»</li>
                <li>«beslutning om»</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && hasQuery && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-center text-destructive">
            Søket feilet. Vennligst prøv igjen.
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length} resultat{results.length !== 1 ? 'er' : ''} for «{debouncedQuery}»
          </p>
          <div className="space-y-3">
            {results.map((result, index) => (
              <SearchResultCard
                key={`${result.meeting_id}-${index}`}
                result={result}
                accountSlug={accountSlug}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && (
        <Card className="flex flex-col items-center justify-center h-64">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Ingen resultater</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            Fant ingen møter som inneholder «{debouncedQuery}». Prøv et annet søkeord.
          </p>
        </Card>
      )}
    </div>
  );
}
