import MomentCard from './MomentCard';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function MemoryTimeline({ moments }) {
  const [ref, isVisible] = useScrollAnimation(0.1);

  if (!moments || moments.length === 0) return null;

  // Group moments by day
  const days = {};
  moments.forEach((m) => {
    const day = m.day || 1;
    if (!days[day]) days[day] = [];
    days[day].push(m);
  });

  return (
    <section ref={ref} className="py-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="font-display text-2xl sm:text-3xl font-semibold text-memory-ivory mb-8"
      >
        Timeline
      </motion.h2>

      {Object.entries(days).map(([day, dayMoments]) => (
        <div key={day} className="mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-4 pl-12 sm:pl-16"
          >
            <span className="text-xs uppercase tracking-widest text-memory-lavender font-medium glass rounded-full px-3 py-1">
              Day {day}
            </span>
          </motion.div>

          {dayMoments.map((moment, i) => (
            <MomentCard key={moment.id} moment={moment} index={i} />
          ))}
        </div>
      ))}
    </section>
  );
}
