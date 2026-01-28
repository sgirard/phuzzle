import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import PuzzleBoard from '@/components/PuzzleBoard';
import { StockImageInfo } from '@/utils/stockImages';

export default function Index() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [attribution, setAttribution] = useState<StockImageInfo | null>(null);

  const handleImageLoad = useCallback((img: HTMLImageElement, attr?: StockImageInfo) => {
    setImage(img);
    setAttribution(attr || null);
  }, []);

  const handleNewPuzzle = useCallback(() => {
    setImage(null);
    setAttribution(null);
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />
      
      <main className="h-screen pt-16">
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
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                  Create Your Puzzle
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Upload any image and transform it into a fun jigsaw puzzle you can solve right in your browser
                </p>
              </motion.div>
              
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
              <PuzzleBoard image={image} onNewPuzzle={handleNewPuzzle} attribution={attribution} />
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
