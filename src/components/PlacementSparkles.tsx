import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  rotation: number;
}

interface PlacementSparklesProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onComplete?: () => void;
}

function PlacementSparkles({ x, y, width, height, onComplete }: PlacementSparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    // Generate sparkles at the corners and midpoints
    const positions = [
      { x: 0, y: 0 },           // top-left
      { x: width, y: 0 },       // top-right
      { x: 0, y: height },      // bottom-left
      { x: width, y: height },  // bottom-right
      { x: width / 2, y: 0 },   // top-center
      { x: width / 2, y: height }, // bottom-center
      { x: 0, y: height / 2 },  // left-center
      { x: width, y: height / 2 }, // right-center
    ];

    const newSparkles: Sparkle[] = positions.map((pos, i) => ({
      id: i,
      x: pos.x + (Math.random() - 0.5) * 10,
      y: pos.y + (Math.random() - 0.5) * 10,
      size: 6 + Math.random() * 6,
      delay: Math.random() * 0.1,
      rotation: Math.random() * 360,
    }));

    setSparkles(newSparkles);

    // Cleanup after animation
    const timer = setTimeout(() => {
      setSparkles([]);
      onComplete?.();
    }, 600);

    return () => clearTimeout(timer);
  }, [width, height, onComplete]);

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: x, top: y, width, height }}
    >
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
            }}
            initial={{ 
              opacity: 0, 
              scale: 0,
              rotate: sparkle.rotation,
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              rotate: sparkle.rotation + 180,
              x: (Math.random() - 0.5) * 20,
              y: (Math.random() - 0.5) * 20,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 0.5,
              delay: sparkle.delay,
              ease: "easeOut",
            }}
          >
            {/* Four-pointed star sparkle */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full"
            >
              <path
                d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                fill="url(#sparkleGradient)"
              />
              <defs>
                <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFF8DC" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default memo(PlacementSparkles);
