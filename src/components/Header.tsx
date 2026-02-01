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
      className="absolute top-0 left-0 right-0 z-20 p-4 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent/20">
            <Puzzle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <h1 className="text-lg sm:text-xl font-display font-semibold text-foreground">
            Fuzzle
          </h1>
        </div>
        
        {showControls && (
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePreview}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
            >
              {showPreview ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden xs:inline">{showPreview ? 'Hide' : 'Show'}</span>
              <span className="xs:hidden">{showPreview ? <EyeOff className="w-0 h-0" /> : null}</span>
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewPuzzle}
              className="btn-primary px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-primary-foreground font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              New Fuzzle
            </motion.button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
