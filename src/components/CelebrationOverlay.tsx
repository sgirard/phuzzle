import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw } from 'lucide-react';

interface CelebrationOverlayProps {
  onNewPuzzle: () => void;
  onViewPuzzle: () => void;
}

export default function CelebrationOverlay({ onNewPuzzle, onViewPuzzle }: CelebrationOverlayProps) {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 pt-16"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 15,
          delay: 0.2 
        }}
        className="text-center p-8 bg-card rounded-3xl shadow-2xl max-w-md mx-4"
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
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-6"
        >
          <Sparkles className="w-10 h-10 text-accent" />
        </motion.div>

        <h2 className="text-3xl font-display font-bold text-foreground mb-3">
          Puzzle Complete!
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Congratulations! You've successfully assembled the puzzle. 
          Ready for another challenge?
        </p>

        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewPuzzle}
            className="btn-gold px-8 py-4 rounded-xl font-display font-semibold text-lg inline-flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Puzzle
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewPuzzle}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            View completed puzzle
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
