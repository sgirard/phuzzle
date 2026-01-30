import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import PuzzleBoard from '@/components/PuzzleBoard';
import PuzzleSettings, { PuzzleGridConfig, PUZZLE_OPTIONS } from '@/components/PuzzleSettings';
import { StockImageInfo } from '@/utils/stockImages';
import { PuzzlePiece } from '@/types/puzzle';
import { loadPuzzleState, loadImageFromSrc, clearPuzzleState } from '@/utils/puzzleStorage';

export default function Index() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [attribution, setAttribution] = useState<StockImageInfo | null>(null);
  const [gridConfig, setGridConfig] = useState<PuzzleGridConfig>(PUZZLE_OPTIONS[0]);
  const [savedPieces, setSavedPieces] = useState<PuzzlePiece[] | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Load saved puzzle state on mount
  useEffect(() => {
    const loadSaved = async () => {
      const saved = loadPuzzleState();
      if (saved) {
        try {
          const img = await loadImageFromSrc(saved.imageSrc);
          setImage(img);
          setAttribution(saved.attribution);
          setGridConfig(saved.gridConfig);
          setSavedPieces(saved.pieces);
        } catch (error) {
          console.warn('Failed to restore saved puzzle:', error);
          clearPuzzleState();
        }
      }
      setIsLoadingSaved(false);
    };
    loadSaved();
  }, []);

  const handleImageLoad = useCallback((img: HTMLImageElement, attr?: StockImageInfo) => {
    setImage(img);
    setAttribution(attr || null);
    setSavedPieces(null); // Clear saved pieces for new image
  }, []);

  const handleNewPuzzle = useCallback(() => {
    setImage(null);
    setAttribution(null);
    setSavedPieces(null);
    setShowPreview(false);
    clearPuzzleState();
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header 
        showControls={!!image} 
        showPreview={showPreview} 
        onTogglePreview={() => setShowPreview(!showPreview)} 
        onNewPuzzle={handleNewPuzzle} 
      />
      
      <main className="h-[100dvh] sm:h-screen pt-16">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex flex-col items-center justify-center px-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6 sm:mb-12"
              >
                <h2 className="text-3xl md:text-5xl landscape-mobile:text-2xl font-display font-bold text-foreground mb-4">
                  Create Your Phuzzle
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Transform any image into a fun photo tile puzzle you can solve right in your browser
                </p>
              </motion.div>
              
              <div className="mb-6 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Difficulty:</span>
                <span className="font-medium text-foreground">{gridConfig.label} ({gridConfig.description})</span>
                <PuzzleSettings currentConfig={gridConfig} onConfigChange={setGridConfig} />
              </div>
              
              <ImageUploader onImageLoad={handleImageLoad} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-sm text-muted-foreground"
              >
                Supports JPG, PNG, WebP and more
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="puzzle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <PuzzleBoard image={image} onNewPuzzle={handleNewPuzzle} attribution={attribution} gridConfig={gridConfig} savedPieces={savedPieces} showPreview={showPreview} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
