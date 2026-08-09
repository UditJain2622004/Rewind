import { motion } from 'framer-motion';

export default function StoryPreview({ memory, format, style }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-semibold text-memory-ivory">Preview</h3>

      {/* Mobile frame */}
      <div className="flex justify-center">
        <div className="relative w-64 sm:w-72">
          {/* Phone frame */}
          <div className="relative bg-memory-surface rounded-[2.5rem] p-3 shadow-2xl border border-white/8">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-memory-surface rounded-b-xl z-10" />

            {/* Screen */}
            <div className="rounded-[2rem] overflow-hidden aspect-[9/16] relative bg-memory-base">
              {/* Cover */}
              <img
                src={memory?.cover || '/images/goa-cover.png'}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Top */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-memory-violet to-memory-lavender flex items-center justify-center text-xs text-white font-bold">
                    R
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium">REWIND</p>
                    <p className="text-[10px] text-white/60">{memory?.title || 'Goa Trip'}</p>
                  </div>
                </div>

                {/* Bottom text */}
                <div className="space-y-2 mb-2">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="font-display text-lg text-white font-semibold leading-tight"
                  >
                    {memory?.fullTitle || 'Goa — July 2026'}
                  </motion.p>
                  <p className="text-xs text-white/70">
                    {memory?.description || '5 friends • 3 days • 47 moments'}
                  </p>

                  {/* Progress bars */}
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-white rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: i <= 2 ? '100%' : '0%' }}
                          transition={{ delay: 0.8 + i * 0.2, duration: 0.5 }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Format & style info */}
      <div className="text-center text-sm text-memory-ivory-muted space-y-1">
        {format && <p>Format: <span className="text-memory-ivory">{format}</span></p>}
        {style && <p>Style: <span className="text-memory-ivory">{style}</span></p>}
      </div>
    </div>
  );
}
