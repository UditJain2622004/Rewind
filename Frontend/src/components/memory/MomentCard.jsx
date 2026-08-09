import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import VoiceNotePlayer from '../shared/VoiceNotePlayer';
import { people as allPeople } from '../../data/mockData';

export default function MomentCard({ moment, index = 0 }) {
  const [ref, isVisible] = useScrollAnimation(0.2);

  const momentPeople = moment.people
    ? moment.people.map((pid) => allPeople.find((p) => p.id === pid)).filter(Boolean)
    : [];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.05, duration: 0.6 }}
      className="relative pl-12 sm:pl-16 pb-8"
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-8 h-8 rounded-full glass flex items-center justify-center text-lg border border-white/8">
        {moment.emoji}
      </div>

      {/* Timeline line */}
      <div className="absolute left-[15px] top-10 bottom-0 w-px bg-gradient-to-b from-memory-lavender/30 to-transparent" />

      {/* Content */}
      <div className="space-y-3">
        {/* Time & Location */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-mono text-memory-lavender">{moment.time}</span>
          {moment.location && (
            <span className="text-xs text-memory-ivory-muted flex items-center gap-1">
              📍 {moment.location}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-memory-ivory font-medium">{moment.description}</p>

        {/* AI narration */}
        {moment.aiNarration && (
          <p className="text-sm text-memory-ivory-muted italic leading-relaxed">
            "{moment.aiNarration}"
          </p>
        )}

        {/* Photos */}
        {moment.photos && moment.photos.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {moment.photos.map((photo, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -4 }}
                className="flex-shrink-0 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden"
              >
                <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Voice note */}
        {moment.voiceNote && (
          <div className="max-w-sm">
            <VoiceNotePlayer
              duration={moment.voiceNote.duration}
              transcript={moment.voiceNote.transcript}
              compact
            />
          </div>
        )}

        {/* People */}
        {momentPeople.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            {momentPeople.map((person) => (
              <div
                key={person.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: `${person.color}20` }}
                title={person.name}
              >
                {person.avatar}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
