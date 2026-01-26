'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { MessageCircle, Clock } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

interface ChatSession {
  id: string;
  title: string;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

interface RecentChatsProps {
  sessions: ChatSession[];
}

const CATEGORY_COLORS: Record<string, string> = {
  employment_law: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contract_law: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  company_law: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  real_estate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  family_law: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  tax_law: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  data_protection: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  consumer_law: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const CATEGORY_NAMES: Record<string, string> = {
  employment_law: 'Arbeidsrett',
  contract_law: 'Kontrakt',
  company_law: 'Selskap',
  real_estate: 'Eiendom',
  family_law: 'Familie',
  tax_law: 'Skatt',
  intellectual_property: 'IP',
  data_protection: 'Personvern',
  consumer_law: 'Forbruker',
  public_law: 'Forvaltning',
  criminal_law: 'Straff',
  immigration_law: 'Utlending',
  bankruptcy_law: 'Konkurs',
  environmental_law: 'Miljø',
  other: 'Annet',
};

export function RecentChats({ sessions }: RecentChatsProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Ingen nylige samtaler
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Link
          key={session.id}
          href={`/home/chat/${session.id}`}
          className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {session.category && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs px-1.5 py-0',
                      CATEGORY_COLORS[session.category] || CATEGORY_COLORS.other
                    )}
                  >
                    {CATEGORY_NAMES[session.category] || session.category}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(session.updated_at), {
                    addSuffix: true,
                    locale: nb,
                  })}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
