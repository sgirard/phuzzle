import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { PuzzlePiece as PuzzlePieceType, PuzzleConfig } from '@/types/puzzle';

interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  image: HTMLImageElement;
  config: PuzzleConfig;
  isDragging: boolean;
  onDragStart: (id: number) => void;
  onDrag: (id: number, x: number, y: number) => void;
  onDragEnd: (id: number) => void;
}

function PuzzlePiece({
  piece,
  image,
  config,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
}: PuzzlePieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wasJustPlaced, setWasJustPlaced] = useState(false);

  // Draw piece on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tabSize = Math.min(piece.width, piece.height) * 0.2;
    const margin = tabSize;
    
    canvas.width = piece.width + margin * 2;
    canvas.height = piece.height + margin * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create clipping path for puzzle piece shape
    ctx.save();
    ctx.beginPath();
    
    const x = margin;
    const y = margin;
    const w = piece.width;
    const h = piece.height;

    // Generate consistent tab pattern based on position
    const hasTopTab = piece.row > 0;
    const hasBottomTab = piece.row < config.rows - 1;
    const hasLeftTab = piece.col > 0;
    const hasRightTab = piece.col < config.cols - 1;

    // Tab direction (alternating pattern)
    const topTabOut = (piece.row + piece.col) % 2 === 0;
    const leftTabOut = (piece.row + piece.col + 1) % 2 === 0;

    // Draw piece shape
    ctx.moveTo(x, y);

    // Top edge
    if (hasTopTab) {
      ctx.lineTo(x + w * 0.35, y);
      if (topTabOut) {
        ctx.bezierCurveTo(
          x + w * 0.35, y - tabSize,
          x + w * 0.65, y - tabSize,
          x + w * 0.65, y
        );
      } else {
        ctx.bezierCurveTo(
          x + w * 0.35, y + tabSize,
          x + w * 0.65, y + tabSize,
          x + w * 0.65, y
        );
      }
    }
    ctx.lineTo(x + w, y);

    // Right edge
    if (hasRightTab) {
      ctx.lineTo(x + w, y + h * 0.35);
      if (!topTabOut) {
        ctx.bezierCurveTo(
          x + w + tabSize, y + h * 0.35,
          x + w + tabSize, y + h * 0.65,
          x + w, y + h * 0.65
        );
      } else {
        ctx.bezierCurveTo(
          x + w - tabSize, y + h * 0.35,
          x + w - tabSize, y + h * 0.65,
          x + w, y + h * 0.65
        );
      }
    }
    ctx.lineTo(x + w, y + h);

    // Bottom edge
    if (hasBottomTab) {
      ctx.lineTo(x + w * 0.65, y + h);
      if (!topTabOut) {
        ctx.bezierCurveTo(
          x + w * 0.65, y + h + tabSize,
          x + w * 0.35, y + h + tabSize,
          x + w * 0.35, y + h
        );
      } else {
        ctx.bezierCurveTo(
          x + w * 0.65, y + h - tabSize,
          x + w * 0.35, y + h - tabSize,
          x + w * 0.35, y + h
        );
      }
    }
    ctx.lineTo(x, y + h);

    // Left edge
    if (hasLeftTab) {
      ctx.lineTo(x, y + h * 0.65);
      if (leftTabOut) {
        ctx.bezierCurveTo(
          x - tabSize, y + h * 0.65,
          x - tabSize, y + h * 0.35,
          x, y + h * 0.35
        );
      } else {
        ctx.bezierCurveTo(
          x + tabSize, y + h * 0.65,
          x + tabSize, y + h * 0.35,
          x, y + h * 0.35
        );
      }
    }
    ctx.lineTo(x, y);

    ctx.closePath();
    ctx.clip();

    // Draw image portion
    const scaleX = (config.cols * piece.width) / image.width;
    const scaleY = (config.rows * piece.height) / image.height;

    ctx.drawImage(
      image,
      piece.imageX / scaleX,
      piece.imageY / scaleY,
      piece.width / scaleX,
      piece.height / scaleY,
      x,
      y,
      piece.width,
      piece.height
    );

    ctx.restore();

    // Draw piece border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [piece, image, config]);

  // Handle placement animation
  useEffect(() => {
    if (piece.isPlaced) {
      setWasJustPlaced(true);
      const timer = setTimeout(() => setWasJustPlaced(false), 300);
      return () => clearTimeout(timer);
    }
  }, [piece.isPlaced]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (piece.isPlaced) return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    onDragStart(piece.id);
  }, [piece.id, piece.isPlaced, onDragStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (piece.isPlaced) return;
    
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    onDragStart(piece.id);
  }, [piece.id, piece.isPlaced, onDragStart]);

  // Global mouse/touch move handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const container = document.querySelector('.puzzle-table');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - dragOffset.x;
      const y = clientY - rect.top - dragOffset.y;
      onDrag(piece.id, x, y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      onDragEnd(piece.id);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, piece.id, onDrag, onDragEnd]);

  const tabSize = Math.min(piece.width, piece.height) * 0.2;
  const margin = tabSize;

  return (
    <motion.div
      className={`
        puzzle-piece absolute select-none
        ${isDragging ? 'puzzle-piece-dragging' : ''}
        ${wasJustPlaced ? 'puzzle-piece-placed' : ''}
        ${piece.isPlaced ? 'pointer-events-none' : ''}
      `}
      style={{
        left: piece.currentX - margin,
        top: piece.currentY - margin,
        width: piece.width + margin * 2,
        height: piece.height + margin * 2,
        zIndex: isDragging ? 1000 : piece.isPlaced ? 1 : 10,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        filter: isDragging 
          ? 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))' 
          : piece.isPlaced 
            ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
            : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
      }}
      transition={{ duration: 0.2 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </motion.div>
  );
}

export default memo(PuzzlePiece);
