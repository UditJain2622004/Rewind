import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Edit3 } from 'lucide-react';

const suggestions = [
  'Goa Trip — July 2026',
  'College Farewell',
  'Birthday 2026',
];

export default function ExperienceCreator({ initialName = '', onNameSet }) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  const handleSelectSuggestion = (suggestedName) => {
    setName(suggestedName);
    onNameSet?.(suggestedName);
  };

  return (
    <div className="space-y-3.5">
      {/* Compact Header with Landing Page Serif Italic Font */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5">
          <Edit3 size={15} className="text-violet-400" />
          <span>Story <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-purple-200">Details.</span></span>
        </h3>
        <span className="text-[11px] text-white/40 font-mono">Step 1 of 2</span>
      </div>

      {/* Sleek Input */}
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            onNameSet?.(e.target.value);
          }}
          placeholder="e.g. Goa Trip — July 2026..."
          className="w-full bg-[#1b1b22] border border-white/10 focus:border-violet-400 text-white font-display text-sm py-2.5 px-3.5 rounded-xl outline-none transition-colors placeholder:text-white/30 placeholder:font-sans"
        />
      </div>

      {/* Single Row Quick Picks */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-[11px] text-white/40 font-medium shrink-0">Quick:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSelectSuggestion(s)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-medium transition-all shrink-0"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
