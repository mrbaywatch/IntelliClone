'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@kit/ui/button';

const SUGGESTED_QUESTIONS = [
  {
    category: 'Arbeidsrett',
    questions: [
      'Hva er oppsigelsesfristen min?',
      'Kan arbeidsgiver endre arbeidsoppgavene mine?',
      'Hva er reglene for overtid?',
    ],
  },
  {
    category: 'Kontrakt',
    questions: [
      'Når kan jeg heve en avtale?',
      'Hva er reklamasjonsfristen?',
      'Hva gjør en avtale ugyldig?',
    ],
  },
  {
    category: 'Bolig',
    questions: [
      'Hva er maksimalt depositum?',
      'Kan utleier kaste meg ut?',
      'Hvem har vedlikeholdsansvar?',
    ],
  },
  {
    category: 'Forbruker',
    questions: [
      'Hva er angrefristen?',
      'Kan jeg reklamere etter 2 år?',
      'Hva er mine rettigheter ved feil vare?',
    ],
  },
];

interface SuggestedQuestionsProps {
  onSelectQuestion?: (question: string) => void;
}

export function SuggestedQuestions({ onSelectQuestion }: SuggestedQuestionsProps) {
  const handleClick = (question: string) => {
    if (onSelectQuestion) {
      onSelectQuestion(question);
    } else {
      // If no handler, we'll copy to clipboard or navigate
      navigator.clipboard.writeText(question);
    }
  };

  // Flatten and take first 6 questions
  const flatQuestions = SUGGESTED_QUESTIONS.flatMap(cat => 
    cat.questions.map(q => ({ category: cat.category, question: q }))
  ).slice(0, 6);

  return (
    <div className="space-y-2">
      {flatQuestions.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-left h-auto py-2 px-3"
          onClick={() => handleClick(item.question)}
        >
          <MessageSquare className="mr-2 h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <span className="text-xs line-clamp-2">{item.question}</span>
        </Button>
      ))}
    </div>
  );
}

export { SUGGESTED_QUESTIONS };
