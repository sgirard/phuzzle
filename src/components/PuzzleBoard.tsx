import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { PuzzlePiece as PuzzlePieceType, PuzzleConfig } from '@/types/puzzle';
import { 
  generatePuzzlePieces, 
  checkPieceToGroupSnap, 
  checkFinalSnap, 
  isPuzzleComplete,
  getGroupPieces,
  mergeGroups,
} from '@/utils/puzzleGenerator';
import { savePuzzleState } from '@/utils/puzzleStorage';
import PuzzlePieceComponent from './PuzzlePiece';
import CelebrationOverlay from './CelebrationOverlay';
import { StockImageInfo } from '@/utils/stockImages';
import { PuzzleGridConfig } from './PuzzleSettings';

interface PuzzleBoardProps {
  image: HTMLImageElement;
  onNewPuzzle: () => void;
  attribution?: StockImageInfo | null;
  gridConfig: PuzzleGridConfig;
  savedPieces?: PuzzlePieceType[] | null;
  showPreview: boolean;
}

export default function PuzzleBoard({ image, onNewPuzzle, attribution, gridConfig, savedPieces, showPreview }: PuzzleBoardProps) {
  const ROWS = gridConfig.rows;
  const COLS = gridConfig.cols;
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

    const container = containerRef.current;
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
    
    // Use saved pieces if available, otherwise generate new ones
    if (savedPieces && savedPieces.length > 0) {
      // Scale saved pieces to current board size
      const savedPieceWidth = savedPieces[0].width;
      const savedPieceHeight = savedPieces[0].height;
      const scaleX = pieceWidth / savedPieceWidth;
      const scaleY = pieceHeight / savedPieceHeight;
      
      const scaledPieces = savedPieces.map(piece => ({
        ...piece,
        width: pieceWidth,
        height: pieceHeight,
        imageX: piece.col * pieceWidth,
        imageY: piece.row * pieceHeight,
        correctX: ((boardWidth - COLS * pieceWidth) / 2) + piece.col * pieceWidth,
        correctY: ((boardHeight - ROWS * pieceHeight) / 2) + piece.row * pieceHeight,
        currentX: piece.isPlaced 
          ? ((boardWidth - COLS * pieceWidth) / 2) + piece.col * pieceWidth
          : piece.currentX * scaleX,
        currentY: piece.isPlaced
          ? ((boardHeight - ROWS * pieceHeight) / 2) + piece.row * pieceHeight
          : piece.currentY * scaleY,
      }));
      
      setPieces(scaledPieces);
    } else {
      setPieces(generatePuzzlePieces(newConfig));
    }
    setIsComplete(false);
  }, [image, isReady, savedPieces]);

  // Handle window resize - scale existing pieces instead of regenerating
  useEffect(() => {
    if (!isReady || !config || pieces.length === 0) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const newBoardWidth = container.clientWidth;
      const newBoardHeight = container.clientHeight;
      
      if (newBoardWidth === 0 || newBoardHeight === 0) return;
      if (newBoardWidth === boardSize.width && newBoardHeight === boardSize.height) return;

      const imageAspect = image.width / image.height;
      const maxPuzzleWidth = newBoardWidth * 0.75;
      const maxPuzzleHeight = newBoardHeight * 0.85;

      let puzzleWidth: number, puzzleHeight: number;

      if (maxPuzzleWidth / imageAspect <= maxPuzzleHeight) {
        puzzleWidth = maxPuzzleWidth;
        puzzleHeight = puzzleWidth / imageAspect;
      } else {
        puzzleHeight = maxPuzzleHeight;
        puzzleWidth = puzzleHeight * imageAspect;
      }

      const newPieceWidth = puzzleWidth / COLS;
      const newPieceHeight = puzzleHeight / ROWS;

      // Calculate scale factors
      const scaleX = newPieceWidth / config.pieceWidth;
      const scaleY = newPieceHeight / config.pieceHeight;
      const boardScaleX = newBoardWidth / boardSize.width;
      const boardScaleY = newBoardHeight / boardSize.height;

      // Update pieces with scaled positions
      setPieces(prev => prev.map(piece => ({
        ...piece,
        width: newPieceWidth,
        height: newPieceHeight,
        imageX: piece.col * newPieceWidth,
        imageY: piece.row * newPieceHeight,
        correctX: ((newBoardWidth - COLS * newPieceWidth) / 2) + piece.col * newPieceWidth,
        correctY: ((newBoardHeight - ROWS * newPieceHeight) / 2) + piece.row * newPieceHeight,
        // For placed pieces, move to new correct position; for unplaced, scale current position
        currentX: piece.isPlaced 
          ? ((newBoardWidth - COLS * newPieceWidth) / 2) + piece.col * newPieceWidth
          : piece.currentX * boardScaleX,
        currentY: piece.isPlaced
          ? ((newBoardHeight - ROWS * newPieceHeight) / 2) + piece.row * newPieceHeight
          : piece.currentY * boardScaleY,
      })));

      // Update config
      setConfig(prev => prev ? {
        ...prev,
        pieceWidth: newPieceWidth,
        pieceHeight: newPieceHeight,
        boardWidth: newBoardWidth,
        boardHeight: newBoardHeight,
      } : null);

      setBoardSize({ width: newBoardWidth, height: newBoardHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isReady, config, pieces.length, boardSize, image, ROWS, COLS]);

  // Save puzzle state to localStorage whenever pieces change
  useEffect(() => {
    if (pieces.length === 0 || isComplete) return;
    
    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(() => {
      savePuzzleState(image.src, pieces, gridConfig, attribution || null);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [pieces, image.src, gridConfig, attribution, isComplete]);

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
          const piecesToPlace: PuzzlePieceType[] = [];
          
          updatedPieces = updatedPieces.map(p => {
            if (p.groupId !== piece.groupId) return p;
            const placedPiece = {
              ...p,
              currentX: p.correctX,
              currentY: p.correctY,
              isPlaced: true,
            };
            piecesToPlace.push(placedPiece);
            return placedPiece;
          });

          // Trigger haptic feedback directly in gesture handler (required by Chrome)
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

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

  // Prevent scrolling on touch devices
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  if (!config || !isReady) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full puzzle-table wood-texture flex items-center justify-center touch-none select-none"
        onTouchMove={handleTouchMove}
        style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
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
      className="relative w-full h-full puzzle-table wood-texture overflow-hidden touch-none select-none"
      onTouchMove={handleTouchMove}
      style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
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

      {/* Completion banner */}
      {isComplete && (
        <CelebrationOverlay onNewPuzzle={onNewPuzzle} />
      )}


      {/* Progress indicator and attribution */}
      <div className="absolute left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:bottom-4 sm:right-auto bg-card/90 backdrop-blur-sm px-3 py-2 sm:px-4 rounded-xl z-10 pointer-events-none">
        <div className="flex flex-col xs:flex-row xs:items-center xs:gap-3 landscape-mobile:flex-row landscape-mobile:items-center landscape-mobile:gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Pieces: {pieces.filter(p => p.isPlaced).length} / {pieces.length}
          </span>
          {attribution && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
              <span>Photo by</span>
              <a 
                href={attribution.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5"
              >
                {attribution.author}
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="hidden xs:inline landscape-mobile:inline">via Lorem Picsum</span>
            </div>
          )}
        </div>
      </div>


      {/* Image preview overlay - draggable */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            className="absolute top-16 right-4 bg-card/95 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-border cursor-move select-none"
            style={{ zIndex: 2000 }}
          >
            <img
              src={image.src}
              alt="Puzzle preview"
              className="max-w-48 max-h-36 rounded-lg object-contain pointer-events-none"
            />
            <p className="text-xs text-muted-foreground text-center mt-1 pointer-events-none">Reference Image (drag to move)</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
