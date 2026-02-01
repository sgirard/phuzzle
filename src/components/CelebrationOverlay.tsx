import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, X } from 'lucide-react';

interface CelebrationOverlayProps {
  onNewPuzzle: () => void;
  onClose: () => void;
}

export default function CelebrationOverlay({ onNewPuzzle, onClose }: CelebrationOverlayProps) {
  useEffect(() => {
    // Fire confetti from both sides
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#D4A373', '#E9C46A', '#588157', '#FEFAE0', '#BC6C25'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst in the center
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
    });
  }, []);

  return (
    <div className="absolute top-16 left-0 right-0 flex justify-center z-20 landscape-mobile:top-2 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 20,
        }}
        drag
        dragMomentum={false}
        className="relative bg-card/95 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl border border-accent/30 flex items-center gap-4 landscape-mobile:px-4 landscape-mobile:py-2 landscape-mobile:gap-3 cursor-move pointer-events-auto select-none"
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity, 
            repeatDelay: 2 
          }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 landscape-mobile:w-8 landscape-mobile:h-8"
        >
          <Sparkles className="w-6 h-6 text-accent landscape-mobile:w-4 landscape-mobile:h-4" />
        </motion.div>

        <div>
          <h2 className="text-xl font-display font-bold text-foreground landscape-mobile:text-lg">
            Fuzzle Complete!
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block landscape-mobile:hidden">
            Great job! Ready for another?
          </p>
        </div>

        {/* New Fuzzle button - desktop only */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewPuzzle}
          className="btn-gold px-4 py-2 rounded-xl font-display font-semibold text-sm items-center gap-2 hidden sm:inline-flex landscape-mobile:hidden"
        >
          <RotateCcw className="w-4 h-4" />
          New Fuzzle
        </motion.button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-muted hover:bg-muted-foreground/20 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>
    </div>
  );
}
