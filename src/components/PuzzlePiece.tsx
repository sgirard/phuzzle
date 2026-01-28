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

    canvas.width = piece.width;
    canvas.height = piece.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image portion
    const scaleX = (config.cols * piece.width) / image.width;
    const scaleY = (config.rows * piece.height) / image.height;

    ctx.drawImage(
      image,
      piece.imageX / scaleX,
      piece.imageY / scaleY,
      piece.width / scaleX,
      piece.height / scaleY,
      0,
      0,
      piece.width,
      piece.height
    );

    // Draw inner piece border (subtle)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, piece.width, piece.height);

    // Draw black border with glow on edge pieces
    const borderWidth = 3;
    const isEdgePiece = piece.row === 0 || piece.row === config.rows - 1 || 
                        piece.col === 0 || piece.col === config.cols - 1;

    if (isEdgePiece) {
      // Set up glow effect for edge borders - dark glow for contrast
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = borderWidth;

    // Top edge
    if (piece.row === 0) {
      ctx.beginPath();
      ctx.moveTo(0, borderWidth / 2);
      ctx.lineTo(piece.width, borderWidth / 2);
      ctx.stroke();
    }

    // Bottom edge
    if (piece.row === config.rows - 1) {
      ctx.beginPath();
      ctx.moveTo(0, piece.height - borderWidth / 2);
      ctx.lineTo(piece.width, piece.height - borderWidth / 2);
      ctx.stroke();
    }

    // Left edge
    if (piece.col === 0) {
      ctx.beginPath();
      ctx.moveTo(borderWidth / 2, 0);
      ctx.lineTo(borderWidth / 2, piece.height);
      ctx.stroke();
    }

    // Right edge
    if (piece.col === config.cols - 1) {
      ctx.beginPath();
      ctx.moveTo(piece.width - borderWidth / 2, 0);
      ctx.lineTo(piece.width - borderWidth / 2, piece.height);
      ctx.stroke();
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

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

  return (
    <motion.div
      className={`
        puzzle-piece absolute select-none
        ${isDragging ? 'puzzle-piece-dragging' : ''}
        ${wasJustPlaced ? 'puzzle-piece-placed' : ''}
        ${piece.isPlaced ? 'pointer-events-none' : ''}
      `}
      style={{
        left: piece.currentX,
        top: piece.currentY,
        width: piece.width,
        height: piece.height,
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
