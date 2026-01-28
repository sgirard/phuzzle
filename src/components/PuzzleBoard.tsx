import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePiece as PuzzlePieceType, PuzzleConfig } from '@/types/puzzle';
import { generatePuzzlePieces, checkSnap, isPuzzleComplete, SNAP_THRESHOLD } from '@/utils/puzzleGenerator';
import PuzzlePieceComponent from './PuzzlePiece';
import CelebrationOverlay from './CelebrationOverlay';

interface PuzzleBoardProps {
  image: HTMLImageElement;
  onNewPuzzle: () => void;
}

const ROWS = 4;
const COLS = 4;

export default function PuzzleBoard({ image, onNewPuzzle }: PuzzleBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<PuzzlePieceType[]>([]);
  const [config, setConfig] = useState<PuzzleConfig | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  // Initialize puzzle
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const boardWidth = container.clientWidth;
      const boardHeight = container.clientHeight;
      setBoardSize({ width: boardWidth, height: boardHeight });

      // Calculate piece size based on image aspect ratio
      const imageAspect = image.width / image.height;
      const maxPuzzleWidth = boardWidth * 0.6;
      const maxPuzzleHeight = boardHeight * 0.7;

      let puzzleWidth: number, puzzleHeight: number;

      if (maxPuzzleWidth / imageAspect <= maxPuzzleHeight) {
        puzzleWidth = maxPuzzleWidth;
        puzzleHeight = puzzleWidth / imageAspect;
      } else {
        puzzleHeight = maxPuzzleHeight;
        puzzleWidth = puzzleHeight * imageAspect;
      }

      const pieceWidth = puzzleWidth / COLS;
      const pieceHeight = puzzleHeight / ROWS;

      const newConfig: PuzzleConfig = {
        rows: ROWS,
        cols: COLS,
        pieceWidth,
        pieceHeight,
        image,
        boardWidth,
        boardHeight,
      };

      setConfig(newConfig);
      setPieces(generatePuzzlePieces(newConfig));
      setIsComplete(false);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [image]);

  const handleDragStart = useCallback((id: number) => {
    setDraggingId(id);
    // Bring piece to front
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      if (!piece || piece.isPlaced) return prev;
      return [...prev.filter(p => p.id !== id), piece];
    });
  }, []);

  const handleDrag = useCallback((id: number, x: number, y: number) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id !== id || piece.isPlaced) return piece;
      
      // Constrain to board
      const newX = Math.max(0, Math.min(x, boardSize.width - piece.width));
      const newY = Math.max(0, Math.min(y, boardSize.height - piece.height));
      
      return { ...piece, currentX: newX, currentY: newY };
    }));
  }, [boardSize]);

  const handleDragEnd = useCallback((id: number) => {
    setDraggingId(null);
    
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      if (!piece || piece.isPlaced) return prev;

      const shouldSnap = checkSnap(piece, prev, ROWS, COLS);
      
      if (shouldSnap) {
        const newPieces = prev.map(p => {
          if (p.id !== id) return p;
          return {
            ...p,
            currentX: p.correctX,
            currentY: p.correctY,
            isPlaced: true,
          };
        });

        // Check completion
        if (isPuzzleComplete(newPieces)) {
          setTimeout(() => setIsComplete(true), 300);
        }

        return newPieces;
      }

      return prev;
    });
  }, []);

  if (!config) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full puzzle-table wood-texture overflow-hidden"
    >
      {/* Puzzle frame/guide */}
      <div
        className="absolute border-2 border-dashed border-muted-foreground/30 rounded-lg pointer-events-none"
        style={{
          left: (boardSize.width - config.cols * config.pieceWidth) / 2,
          top: (boardSize.height - config.rows * config.pieceHeight) / 2,
          width: config.cols * config.pieceWidth,
          height: config.rows * config.pieceHeight,
        }}
      />

      {/* Puzzle pieces */}
      <AnimatePresence>
        {pieces.map(piece => (
          <PuzzlePieceComponent
            key={piece.id}
            piece={piece}
            image={image}
            config={config}
            isDragging={draggingId === piece.id}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          />
        ))}
      </AnimatePresence>

      {/* Completion overlay */}
      {isComplete && (
        <CelebrationOverlay onNewPuzzle={onNewPuzzle} />
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-xl">
        <span className="text-sm text-muted-foreground">
          Pieces placed: {pieces.filter(p => p.isPlaced).length} / {pieces.length}
        </span>
      </div>

      {/* New puzzle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewPuzzle}
        className="absolute top-4 right-4 btn-primary px-4 py-2 rounded-xl text-primary-foreground font-medium"
      >
        New Puzzle
      </motion.button>
    </div>
  );
}
