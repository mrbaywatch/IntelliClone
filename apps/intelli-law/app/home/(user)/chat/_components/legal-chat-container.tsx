'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Loader2, User, Bot, BookOpen, ExternalLink } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';
import { Avatar, AvatarFallback } from '@kit/ui/avatar';

interface LegalChatContainerProps {
  accountId: string;
  sessionId?: string;
  documentContext?: string;
}

export function LegalChatContainer({ 
  accountId, 
  sessionId,
  documentContext 
}: LegalChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/legal-chat',
    body: {
      accountId,
      sessionId,
      documentContext,
    },
    initialMessages: [],
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
        }
      }
    },
    [input, isLoading, handleSubmit]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Bot className="mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">Hei! Jeg er din juridiske assistent.</h3>
            <p className="mt-2 max-w-md text-sm">
              Jeg kan hjelpe deg med spørsmål om norsk lov, kontrakter, arbeidsrett, 
              og mye mer. Still meg et spørsmål for å komme i gang!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Tenker...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm">
            Beklager, det oppstod en feil. Vennligst prøv igjen.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ditt juridiske spørsmål her..."
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Trykk Enter for å sende, Shift+Enter for ny linje
        </p>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  };
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Extract citations from message content (format: [Lovnavn § X])
  const citations = extractCitations(message.content);

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className={cn('h-8 w-8', isUser ? 'bg-secondary' : 'bg-primary')}>
        <AvatarFallback className={cn(
          isUser ? 'bg-secondary' : 'bg-primary text-primary-foreground'
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <div className={cn(
          'prose prose-sm max-w-none',
          isUser ? 'prose-invert' : 'dark:prose-invert'
        )}>
          <MessageContent content={message.content} />
        </div>

        {/* Show citations if any */}
        {!isUser && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <BookOpen className="h-3 w-3" />
              <span>Kilder</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {citations.map((citation, index) => (
                <CitationBadge key={index} citation={citation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, index) => {
        // Handle headers
        if (line.startsWith('###')) {
          return <h4 key={index} className="font-semibold mt-2">{line.replace(/^###\s*/, '')}</h4>;
        }
        if (line.startsWith('##')) {
          return <h3 key={index} className="font-semibold mt-3">{line.replace(/^##\s*/, '')}</h3>;
        }
        if (line.startsWith('#')) {
          return <h2 key={index} className="font-bold mt-4">{line.replace(/^#\s*/, '')}</h2>;
        }

        // Handle bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={index} className="ml-4">
              {formatInlineText(line.slice(2))}
            </li>
          );
        }

        // Handle numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
          return (
            <li key={index} className="ml-4 list-decimal">
              {formatInlineText(numberedMatch[2])}
            </li>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <br key={index} />;
        }

        // Regular paragraph
        return <p key={index} className="mb-2">{formatInlineText(line)}</p>;
      })}
    </>
  );
}

function formatInlineText(text: string): React.ReactNode {
  // Handle bold text **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function extractCitations(content: string): string[] {
  // Match patterns like "arbeidsmiljøloven § 14-6" or "aml. § 15-3"
  const pattern = /(?:arbeidsmiljøloven|aksjeloven|avtaleloven|husleieloven|kjøpsloven|forbrukerkjøpsloven|personopplysningsloven|markedsføringsloven|GDPR|aml\.|asl\.|husll\.|kjl\.|fkjl\.)[\s]*(?:§|art\.?)[\s]*[\d\-a-zA-Z]+/gi;
  
  const matches = content.match(pattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

function CitationBadge({ citation }: { citation: string }) {
  // Generate Lovdata URL based on citation
  const url = generateLovdataUrl(citation);

  if (url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
      >
        {citation}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs">
      {citation}
    </Badge>
  );
}

function generateLovdataUrl(citation: string): string | null {
  const lowerCitation = citation.toLowerCase();
  
  // Map law names to Lovdata URLs
  const lawUrls: Record<string, string> = {
    'arbeidsmiljøloven': 'https://lovdata.no/lov/2005-06-17-62',
    'aml.': 'https://lovdata.no/lov/2005-06-17-62',
    'aksjeloven': 'https://lovdata.no/lov/1997-06-13-44',
    'asl.': 'https://lovdata.no/lov/1997-06-13-44',
    'avtaleloven': 'https://lovdata.no/lov/1918-05-31-4',
    'husleieloven': 'https://lovdata.no/lov/1999-03-26-17',
    'husll.': 'https://lovdata.no/lov/1999-03-26-17',
    'kjøpsloven': 'https://lovdata.no/lov/1988-05-13-27',
    'kjl.': 'https://lovdata.no/lov/1988-05-13-27',
    'forbrukerkjøpsloven': 'https://lovdata.no/lov/2002-06-21-34',
    'fkjl.': 'https://lovdata.no/lov/2002-06-21-34',
    'personopplysningsloven': 'https://lovdata.no/lov/2018-06-15-38',
    'markedsføringsloven': 'https://lovdata.no/lov/2009-01-09-2',
  };

  for (const [key, baseUrl] of Object.entries(lawUrls)) {
    if (lowerCitation.includes(key)) {
      // Extract section number
      const sectionMatch = citation.match(/§\s*([\d\-a-zA-Z]+)/);
      if (sectionMatch) {
        return `${baseUrl}/§${sectionMatch[1]}`;
      }
      return baseUrl;
    }
  }

  return null;
}
