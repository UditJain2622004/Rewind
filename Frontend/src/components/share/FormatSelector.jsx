import { motion } from 'framer-motion';

export default function FormatSelector({ formats, selected, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-semibold text-memory-ivory">Choose format</h3>
      <div className="grid grid-cols-2 gap-3">
        {formats.map((format, i) => (
          <motion.button
            key={format.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(format.id)}
            className={`p-4 rounded-xl text-left transition-all ${
              selected === format.id
                ? 'glass-strong border-2 border-memory-lavender glow-violet'
                : 'glass border border-white/8 hover:border-white/15'
            }`}
          >
            <span className="text-2xl block mb-2">{format.icon}</span>
            <p className="text-sm font-medium text-memory-ivory">{format.label}</p>
            <p className="text-xs text-memory-ivory-muted mt-1">{format.duration}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
