import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import FormatSelector from './FormatSelector';
import StyleSelector from './StyleSelector';
import StoryPreview from './StoryPreview';
import MagneticButton from '../shared/MagneticButton';
import { storyFormats, storyStyles } from '../../data/mockData';

export default function StoryGenerator({ memory }) {
  const [format, setFormat] = useState(null);
  const [style, setStyle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2500);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Controls */}
      <div className="space-y-8">
        <FormatSelector
          formats={storyFormats}
          selected={format}
          onSelect={setFormat}
        />

        <StyleSelector
          styles={storyStyles}
          selected={style}
          onSelect={setStyle}
        />

        {/* Generate button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <MagneticButton
            onClick={handleGenerate}
            disabled={!format || !style}
            className={`w-full px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
              format && style
                ? 'bg-gradient-to-r from-memory-violet to-memory-lavender text-white shadow-lg shadow-memory-violet/30'
                : 'bg-memory-surface text-memory-ivory-muted cursor-not-allowed'
            }`}
          >
            {generating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <Sparkles size={20} />
            )}
            {generating ? 'Generating...' : 'Generate Story'}
          </MagneticButton>
        </motion.div>

        {generated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <button className="flex-1 py-3 rounded-xl glass text-memory-ivory text-sm font-medium hover:bg-white/10 transition-colors">
              Download
            </button>
            <button className="flex-1 py-3 rounded-xl glass text-memory-ivory text-sm font-medium hover:bg-white/10 transition-colors">
              Share
            </button>
          </motion.div>
        )}
      </div>

      {/* Right: Preview */}
      <div>
        <StoryPreview
          memory={memory}
          format={format}
          style={style}
        />
      </div>
    </div>
  );
}
