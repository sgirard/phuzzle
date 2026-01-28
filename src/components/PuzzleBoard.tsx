import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePiece as PuzzlePieceType, PuzzleConfig } from '@/types/puzzle';
import { 
  generatePuzzlePieces, 
  checkPieceToGroupSnap, 
  checkFinalSnap, 
  isPuzzleComplete,
  getGroupPieces,
  mergeGroups,
} from '@/utils/puzzleGenerator';
import PuzzlePieceComponent from './PuzzlePiece';
import CelebrationOverlay from './CelebrationOverlay';

interface PuzzleBoardProps {
  image: HTMLImageElement;
  onNewPuzzle: () => void;
}

const ROWS = 6;
const COLS = 6;

export default function PuzzleBoard({ image, onNewPuzzle }: PuzzleBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<PuzzlePieceType[]>([]);
  const [config, setConfig] = useState<PuzzleConfig | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // Wait for container to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Initialize puzzle once container is ready
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const boardWidth = container.clientWidth;
      const boardHeight = container.clientHeight;
      
      if (boardWidth === 0 || boardHeight === 0) {
        console.log('Container has no size yet, waiting...');
        return;
      }

      console.log('Initializing puzzle with board size:', boardWidth, boardHeight);
      setBoardSize({ width: boardWidth, height: boardHeight });

      const imageAspect = image.width / image.height;
      const maxPuzzleWidth = boardWidth * 0.75;
      const maxPuzzleHeight = boardHeight * 0.85;

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

      console.log('Puzzle config:', newConfig);
      setConfig(newConfig);
      setPieces(generatePuzzlePieces(newConfig));
      setIsComplete(false);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [image, isReady]);

  const handleDragStart = useCallback((id: number) => {
    setDraggingId(id);
    // Bring entire group to front
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      if (!piece || piece.isPlaced) return prev;
      
      const groupPieces = getGroupPieces(prev, piece.groupId);
      const groupIds = new Set(groupPieces.map(p => p.id));
      const otherPieces = prev.filter(p => !groupIds.has(p.id));
      
      return [...otherPieces, ...groupPieces];
    });
  }, []);

  const handleDrag = useCallback((id: number, x: number, y: number) => {
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      if (!piece || piece.isPlaced) return prev;
      
      // Calculate intended movement delta
      let deltaX = x - piece.currentX;
      let deltaY = y - piece.currentY;
      
      // Get all pieces in the same group
      const groupId = piece.groupId;
      const groupPieces = prev.filter(p => p.groupId === groupId && !p.isPlaced);
      
      if (groupPieces.length === 0) return prev;
      
      // Find the bounding box of the group
      const minX = Math.min(...groupPieces.map(p => p.currentX));
      const maxX = Math.max(...groupPieces.map(p => p.currentX + p.width));
      const minY = Math.min(...groupPieces.map(p => p.currentY));
      const maxY = Math.max(...groupPieces.map(p => p.currentY + p.height));
      
      // Constrain delta so entire group stays within bounds
      if (minX + deltaX < 0) deltaX = -minX;
      if (maxX + deltaX > boardSize.width) deltaX = boardSize.width - maxX;
      if (minY + deltaY < 0) deltaY = -minY;
      if (maxY + deltaY > boardSize.height) deltaY = boardSize.height - maxY;
      
      // Apply the same delta to all pieces in the group
      return prev.map(p => {
        if (p.groupId !== groupId || p.isPlaced) return p;
        return { 
          ...p, 
          currentX: p.currentX + deltaX, 
          currentY: p.currentY + deltaY 
        };
      });
    });
  }, [boardSize]);

  const handleDragEnd = useCallback((id: number) => {
    setDraggingId(null);
    
    setPieces(prev => {
      const piece = prev.find(p => p.id === id);
      if (!piece || piece.isPlaced) return prev;

      let updatedPieces = [...prev];
      const groupPieces = getGroupPieces(updatedPieces, piece.groupId);

      // First check if any piece in the group can snap to its final position
      for (const groupPiece of groupPieces) {
        if (checkFinalSnap(groupPiece, updatedPieces, ROWS, COLS)) {
          // Snap entire group to final position
          const offsetX = groupPiece.correctX - groupPiece.currentX;
          const offsetY = groupPiece.correctY - groupPiece.currentY;
          
          updatedPieces = updatedPieces.map(p => {
            if (p.groupId !== piece.groupId) return p;
            return {
              ...p,
              currentX: p.correctX,
              currentY: p.correctY,
              isPlaced: true,
            };
          });

          if (isPuzzleComplete(updatedPieces)) {
            setTimeout(() => setIsComplete(true), 300);
          }

          return updatedPieces;
        }
      }

      // Check if any piece in the group can snap to another group
      for (const groupPiece of groupPieces) {
        const snapResult = checkPieceToGroupSnap(groupPiece, updatedPieces, ROWS, COLS);
        
        if (snapResult) {
          // Move entire group by the snap offset
          updatedPieces = updatedPieces.map(p => {
            if (p.groupId !== piece.groupId) return p;
            return {
              ...p,
              currentX: p.currentX + snapResult.snapOffset.x,
              currentY: p.currentY + snapResult.snapOffset.y,
            };
          });
          
          // Merge the groups
          updatedPieces = mergeGroups(updatedPieces, piece.groupId, snapResult.targetGroupId);
          
          return updatedPieces;
        }
      }

      return prev;
    });
  }, []);

  if (!config || !isReady) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full puzzle-table wood-texture flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Creating your puzzle...</p>
        </div>
      </div>
    );
  }

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
            isDragging={draggingId === piece.id || 
              (draggingId !== null && pieces.find(p => p.id === draggingId)?.groupId === piece.groupId)}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          />
        ))}
      </AnimatePresence>

      {/* Completion overlay */}
      {isComplete && (
        <CelebrationOverlay 
          onNewPuzzle={onNewPuzzle} 
          onViewPuzzle={() => setIsComplete(false)} 
        />
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
