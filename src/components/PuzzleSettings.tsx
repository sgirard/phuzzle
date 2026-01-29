import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface PuzzleGridConfig {
  rows: number;
  cols: number;
  label: string;
  description: string;
}

const PUZZLE_OPTIONS: PuzzleGridConfig[] = [
  { rows: 6, cols: 6, label: '6×6', description: '36 pieces - Easy' },
  { rows: 8, cols: 8, label: '8×8', description: '64 pieces - Medium' },
  { rows: 9, cols: 9, label: '9×9', description: '81 pieces - Standard' },
  { rows: 10, cols: 10, label: '10×10', description: '100 pieces - Challenging' },
  { rows: 12, cols: 12, label: '12×12', description: '144 pieces - Hard' },
  { rows: 14, cols: 14, label: '14×14', description: '196 pieces - Expert' },
];

interface PuzzleSettingsProps {
  currentConfig: PuzzleGridConfig;
  onConfigChange: (config: PuzzleGridConfig) => void;
}

export default function PuzzleSettings({ currentConfig, onConfigChange }: PuzzleSettingsProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (config: PuzzleGridConfig) => {
    onConfigChange(config);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl bg-card/80 backdrop-blur-sm border-muted hover:bg-card"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-muted">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">
            Puzzle Settings
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Choose the number of pieces for your next puzzle
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PUZZLE_OPTIONS.map((option) => {
              const isSelected = 
                option.rows === currentConfig.rows && 
                option.cols === currentConfig.cols;
              
              return (
                <motion.button
                  key={option.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option)}
                  className={`
                    p-4 rounded-xl border-2 transition-colors text-left
                    ${isSelected 
                      ? 'border-accent bg-accent/10' 
                      : 'border-muted hover:border-accent/50 bg-background/50'
                    }
                  `}
                >
                  <div className="font-display text-xl font-bold text-foreground">
                    {option.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PUZZLE_OPTIONS };
