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

// Generate a seeded random value for consistent tab directions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Draw a jigsaw tab (knob that sticks out or indents in)
function drawTab(
  ctx: CanvasPath,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tabOut: boolean,
  tabSize: number
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction
  const nx = dx / length;
  const ny = dy / length;
  
  // Perpendicular direction (for tab protrusion)
  const px = -ny;
  const py = nx;
  
  // Tab parameters
  const neckWidth = length * 0.1;
  const neckStart = length * 0.35;
  const neckEnd = length * 0.65;
  const headWidth = length * 0.15;
  const tabHeight = tabSize * (tabOut ? 1 : -1);
  
  // Points along the edge
  const p1x = fromX + nx * neckStart;
  const p1y = fromY + ny * neckStart;
  
  const p2x = fromX + nx * neckStart + px * tabHeight * 0.15;
  const p2y = fromY + ny * neckStart + py * tabHeight * 0.15;
  
  // Neck narrowing
  const n1x = fromX + nx * (neckStart + neckWidth) + px * tabHeight * 0.25;
  const n1y = fromY + ny * (neckStart + neckWidth) + py * tabHeight * 0.25;
  
  // Head of the tab (the round part)
  const midX = fromX + nx * (length * 0.5);
  const midY = fromY + ny * (length * 0.5);
  
  const headCenterX = midX + px * tabHeight * 0.7;
  const headCenterY = midY + py * tabHeight * 0.7;
  
  const n2x = fromX + nx * (neckEnd - neckWidth) + px * tabHeight * 0.25;
  const n2y = fromY + ny * (neckEnd - neckWidth) + py * tabHeight * 0.25;
  
  const p3x = fromX + nx * neckEnd + px * tabHeight * 0.15;
  const p3y = fromY + ny * neckEnd + py * tabHeight * 0.15;
  
  const p4x = fromX + nx * neckEnd;
  const p4y = fromY + ny * neckEnd;
  
  // Draw the tab shape with curves
  ctx.lineTo(p1x, p1y);
  
  // Curve into the neck
  ctx.bezierCurveTo(
    p1x + px * tabHeight * 0.05, p1y + py * tabHeight * 0.05,
    p2x, p2y,
    n1x, n1y
  );
  
  // Curve around the head
  ctx.bezierCurveTo(
    n1x + px * tabHeight * 0.3, n1y + py * tabHeight * 0.3,
    headCenterX - nx * headWidth, headCenterY - ny * headWidth,
    headCenterX, headCenterY
  );
  
  ctx.bezierCurveTo(
    headCenterX + nx * headWidth, headCenterY + ny * headWidth,
    n2x + px * tabHeight * 0.3, n2y + py * tabHeight * 0.3,
    n2x, n2y
  );
  
  // Curve out of the neck
  ctx.bezierCurveTo(
    p3x, p3y,
    p4x + px * tabHeight * 0.05, p4y + py * tabHeight * 0.05,
    p4x, p4y
  );
  
  ctx.lineTo(toX, toY);
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

    const tabSize = Math.min(piece.width, piece.height) * 0.22;
    const margin = tabSize + 4;
    
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

    // Determine which edges have tabs and their directions
    const hasTop = piece.row > 0;
    const hasBottom = piece.row < config.rows - 1;
    const hasLeft = piece.col > 0;
    const hasRight = piece.col < config.cols - 1;

    // Use seeded random for consistent tab directions based on edge position
    const topTabOut = seededRandom(piece.row * 100 + piece.col) > 0.5;
    const leftTabOut = seededRandom(piece.row + piece.col * 100 + 50) > 0.5;
    // Adjacent pieces need opposite tab direction
    const bottomTabOut = !(seededRandom((piece.row + 1) * 100 + piece.col) > 0.5);
    const rightTabOut = !(seededRandom(piece.row + (piece.col + 1) * 100 + 50) > 0.5);

    // Start drawing the piece shape
    ctx.moveTo(x, y);

    // Top edge
    if (hasTop) {
      drawTab(ctx, x, y, x + w, y, topTabOut, tabSize);
    } else {
      ctx.lineTo(x + w, y);
    }

    // Right edge
    if (hasRight) {
      drawTab(ctx, x + w, y, x + w, y + h, rightTabOut, tabSize);
    } else {
      ctx.lineTo(x + w, y + h);
    }

    // Bottom edge (drawn right to left)
    if (hasBottom) {
      drawTab(ctx, x + w, y + h, x, y + h, bottomTabOut, tabSize);
    } else {
      ctx.lineTo(x, y + h);
    }

    // Left edge (drawn bottom to top)
    if (hasLeft) {
      drawTab(ctx, x, y + h, x, y, leftTabOut, tabSize);
    } else {
      ctx.lineTo(x, y);
    }

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

    // Draw piece border/outline for definition
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add subtle inner highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
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

  const tabSize = Math.min(piece.width, piece.height) * 0.22;
  const margin = tabSize + 4;

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
          ? 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.5))' 
          : piece.isPlaced 
            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
            : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35))'
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
