import { motion } from 'framer-motion';
import { Puzzle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  showPreview?: boolean;
  onTogglePreview?: () => void;
  onNewPuzzle?: () => void;
  showControls?: boolean;
}

export default function Header({ showPreview, onTogglePreview, onNewPuzzle, showControls = false }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-10 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/20">
            <Puzzle className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground">
            Photo Puzzle Studio
          </h1>
        </div>
        
        {showControls && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePreview}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewPuzzle}
              className="btn-primary px-4 py-2 rounded-xl text-primary-foreground font-medium"
            >
              New Puzzle
            </motion.button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
