import { motion } from 'framer-motion';

export default function StyleSelector({ styles, selected, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-semibold text-memory-ivory">Choose style</h3>
      <div className="flex flex-wrap gap-2">
        {styles.map((style, i) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(style.id)}
            className={`px-5 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              selected === style.id
                ? 'bg-memory-violet text-white shadow-lg shadow-memory-violet/30'
                : 'glass border border-white/8 text-memory-ivory hover:border-white/15'
            }`}
          >
            <span>{style.emoji}</span>
            {style.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
