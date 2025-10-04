import { ExampleQuestionsProps } from '@/types';
import { MessageCircle } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
  "What is the vacation policy?",
  "How do I request time off?",
  "What are the working hours?",
  "What is the dress code policy?",
  "How is performance evaluated?",
  "What are the benefits offered?",
  "What is the remote work policy?",
  "How do I report workplace issues?"
];

export function ExampleQuestions({ onQuestionSelect, disabled }: ExampleQuestionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Example Questions</h3>
      </div>
      
      <div className="grid gap-2">
        {EXAMPLE_QUESTIONS.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(question)}
            disabled={disabled}
            className="text-left p-3 text-sm border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

