import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { people } from '../../data/mockData';

export default function ContributorPanel({ contributors, perspectives }) {
  const [ref, isVisible] = useScrollAnimation();

  const displayContributors = contributors?.length > 0
    ? contributors
    : people.slice(0, 3).map((p, i) => ({ ...p, photos: [12, 9, 18][i], voiceNotes: [2, 3, 1][i] }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-memory-ivory mb-2">
          One experience. Five perspectives.
        </h2>
        <p className="text-memory-ivory-muted">Everyone remembers it a little differently.</p>
      </div>

      {/* Contributor list */}
      <div className="space-y-3">
        {displayContributors.map((person, i) => (
          <motion.div
            key={person.id || i}
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="glass rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: `${person.color}20` }}
              >
                {person.avatar}
              </div>
              <span className="font-medium text-memory-ivory">{person.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-memory-ivory-muted">
              <span>📸 {person.photos} photos</span>
              <span>🎙️ {person.voiceNotes} voice notes</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Different perspectives */}
      {perspectives && perspectives.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="font-display text-xl font-semibold text-memory-ivory">
            Different perspectives
          </h3>
          {perspectives.map((p, i) => (
            <div key={i} className="glass rounded-xl p-6 space-y-4">
              {p.views.map((view, j) => (
                <div key={j} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: `${view.person.color}20` }}
                  >
                    {view.person.avatar}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-memory-ivory">{view.person.name}</span>
                    <p className="text-memory-ivory-muted italic mt-1">"{view.quote}"</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/8 pt-3 mt-3">
                <p className="text-sm text-memory-lavender font-medium">
                  ✨ {p.aiSummary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
