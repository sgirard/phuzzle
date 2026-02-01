import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RotateCcw } from 'lucide-react';

interface CelebrationOverlayProps {
  onNewPuzzle: () => void;
}

export default function CelebrationOverlay({ onNewPuzzle }: CelebrationOverlayProps) {
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
    <>
      {/* Title at top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="absolute top-20 left-0 right-0 flex justify-center z-20 pointer-events-none"
      >
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground bg-card/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
          Fuzzle Complete!
        </h2>
      </motion.div>

      {/* Button at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className="absolute bottom-24 sm:bottom-20 left-0 right-0 flex justify-center z-20"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewPuzzle}
          className="btn-gold px-8 py-4 rounded-xl font-display font-semibold text-lg inline-flex items-center gap-3 shadow-lg"
        >
          <RotateCcw className="w-5 h-5" />
          Start New Fuzzle
        </motion.button>
      </motion.div>
    </>
  );
}
