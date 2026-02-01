import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

interface CelebrationOverlayProps {}

export default function CelebrationOverlay({}: CelebrationOverlayProps) {
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      drag
      dragMomentum={false}
      className="absolute top-16 left-0 right-0 flex justify-center z-20 landscape-mobile:top-2 cursor-move"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 20,
        }}
        className="bg-card/95 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl border border-accent/30 flex items-center gap-4 landscape-mobile:px-4 landscape-mobile:py-2 landscape-mobile:gap-3"
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
      </motion.div>
    </motion.div>
  );
}
