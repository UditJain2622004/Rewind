import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw } from 'lucide-react';
import ExplorePrompt from './ExplorePrompt';
import ExploreResult from './ExploreResult';

export default function MemoryExplorer({ conversations, suggestedQuestions, memoryId, memoryTitle }) {
  const [results, setResults] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [results, isTyping]);

  const askQuestion = (question) => {
    const match = conversations.find((c) =>
      c.question.toLowerCase() === question.toLowerCase()
    ) || conversations[Math.floor(Math.random() * conversations.length)];

    setIsTyping(true);

    setTimeout(() => {
      setResults((prev) => [...prev, { ...match, question }]);
      setIsTyping(false);
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    askQuestion(input.trim());
    setInput('');
  };

  const handleReset = () => {
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full space-y-3 relative">
      
      {/* Minimal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div>
          <h3 className="font-bold text-sm text-white">Ask about {memoryTitle}</h3>
          <p className="text-[11px] text-white/50">Search moments, photos & notes</p>
        </div>

        {results.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            title="Clear chat"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 min-h-0 custom-scrollbar">
        {results.length === 0 && (
          <ExplorePrompt
            onQuestion={askQuestion}
            suggestedQuestions={suggestedQuestions}
          />
        )}

        {results.map((result, i) => (
          <ExploreResult key={i} result={result} memoryId={memoryId} />
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex justify-start"
            >
              <div className="bg-[#18181c] border border-white/10 rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs text-white/50">Thinking...</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Simple Clean Input Bar */}
      <form onSubmit={handleSubmit} className="relative pt-1 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${memoryTitle}...`}
            className="w-full bg-[#18181c] border border-white/10 focus:border-white/30 rounded-xl pl-4 pr-12 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
          />

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
