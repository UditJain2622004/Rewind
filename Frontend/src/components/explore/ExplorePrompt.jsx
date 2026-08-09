import { motion } from 'framer-motion';

const defaultQuestions = [
  'What was the funniest thing that happened?',
  'Who was with us at the beach?',
  'Where did we get lost?',
  'Show me moments with Rahul',
  'What happened after dinner?',
  'What was our best day?',
];

export default function ExplorePrompt({ onQuestion, suggestedQuestions }) {
  const questions = suggestedQuestions || defaultQuestions;

  return (
    <div className="py-6 space-y-3 text-left">
      <p className="text-xs text-white/50 font-medium px-1">Suggested questions to ask:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onQuestion(q)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
