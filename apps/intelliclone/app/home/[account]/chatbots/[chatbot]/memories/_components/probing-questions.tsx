'use client';

/**
 * Probing Questions Component
 * 
 * Shows suggested questions to learn more about users.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import {
  HelpCircle,
  Copy,
  Check,
  Brain,
  Briefcase,
  MessageSquare,
  Settings,
  Users,
  Target,
} from 'lucide-react';

import type { UserPersona, ProbingQuestion, QuestionCategory } from '~/lib/persona';

interface ProbingQuestionsProps {
  persona: UserPersona;
  questions: ProbingQuestion[];
  askedQuestionIds: string[];
  language?: 'no' | 'en';
  onQuestionAsked?: (questionId: string) => void;
}

const CATEGORY_ICONS: Record<QuestionCategory, React.ReactNode> = {
  professional: <Briefcase className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
  preferences: <Settings className="h-4 w-4" />,
  relationships: <Users className="h-4 w-4" />,
  goals: <Target className="h-4 w-4" />,
  challenges: <Brain className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  professional: 'Professional',
  communication: 'Communication',
  preferences: 'Preferences',
  relationships: 'Relationships',
  goals: 'Goals',
  challenges: 'Challenges',
};

export function ProbingQuestions({
  persona,
  questions,
  askedQuestionIds,
  language = 'no',
  onQuestionAsked,
}: ProbingQuestionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  
  // Filter questions by category and asked status
  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    return true;
  });
  
  const availableQuestions = filteredQuestions.filter(
    (q) => !askedQuestionIds.includes(q.id)
  );
  
  const askedQuestions = filteredQuestions.filter((q) =>
    askedQuestionIds.includes(q.id)
  );
  
  const handleCopy = async (question: ProbingQuestion) => {
    const text = language === 'no' ? question.questionNo : question.question;
    await navigator.clipboard.writeText(text);
    setCopiedId(question.id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const categories: (QuestionCategory | 'all')[] = [
    'all',
    'professional',
    'communication',
    'preferences',
    'goals',
    'challenges',
    'relationships',
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Learning Questions
        </CardTitle>
        <CardDescription>
          Questions to help learn more about users. Use these naturally in conversation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? (
                'All'
              ) : (
                <>
                  {CATEGORY_ICONS[cat]}
                  <span className="ml-1">{CATEGORY_LABELS[cat]}</span>
                </>
              )}
            </Button>
          ))}
        </div>
        
        {/* Progress */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Questions asked</span>
            <span className="font-medium">
              {askedQuestionIds.length} / {questions.length}
            </span>
          </div>
          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(askedQuestionIds.length / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
        
        {/* Available Questions */}
        {availableQuestions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Available Questions</h4>
            <div className="space-y-3">
              {availableQuestions.slice(0, 5).map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  language={language}
                  isAsked={false}
                  onCopy={() => handleCopy(q)}
                  onMarkAsked={() => onQuestionAsked?.(q.id)}
                  isCopied={copiedId === q.id}
                />
              ))}
            </div>
            {availableQuestions.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                +{availableQuestions.length - 5} more questions available
              </p>
            )}
          </div>
        )}
        
        {/* Asked Questions */}
        {askedQuestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Already Asked
            </h4>
            <div className="space-y-2">
              {askedQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  language={language}
                  isAsked={true}
                  onCopy={() => handleCopy(q)}
                  isCopied={copiedId === q.id}
                />
              ))}
            </div>
          </div>
        )}
        
        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No questions in this category</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuestionCardProps {
  question: ProbingQuestion;
  language: 'no' | 'en';
  isAsked: boolean;
  onCopy: () => void;
  onMarkAsked?: () => void;
  isCopied: boolean;
}

function QuestionCard({
  question,
  language,
  isAsked,
  onCopy,
  onMarkAsked,
  isCopied,
}: QuestionCardProps) {
  const text = language === 'no' ? question.questionNo : question.question;
  
  return (
    <div
      className={`p-3 rounded-lg border ${
        isAsked ? 'bg-muted/50 opacity-60' : 'bg-background'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {CATEGORY_ICONS[question.category]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">{text}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[question.category]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Priority: {question.priority}
            </Badge>
            {question.successRate > 0.8 && (
              <Badge variant="default" className="text-xs">
                High success
              </Badge>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onCopy}>
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {!isAsked && onMarkAsked && (
            <Checkbox
              onCheckedChange={(checked) => checked && onMarkAsked()}
              aria-label="Mark as asked"
            />
          )}
        </div>
      </div>
      
      {/* Follow-up questions */}
      {!isAsked && question.followUpQuestions.length > 0 && (
        <div className="mt-2 ml-7 text-xs text-muted-foreground">
          <span className="font-medium">Follow-ups: </span>
          {question.followUpQuestions.join(' • ')}
        </div>
      )}
    </div>
  );
}
