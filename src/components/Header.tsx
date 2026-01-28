import { motion } from 'framer-motion';
import { Puzzle } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-10 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/20">
          <Puzzle className="w-5 h-5 text-accent" />
        </div>
        <h1 className="text-xl font-display font-semibold text-foreground">
          Jigsaw Studio
        </h1>
      </div>
    </motion.header>
  );
}
