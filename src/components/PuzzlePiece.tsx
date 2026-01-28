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

interface TabInfo {
  hasTab: boolean;
  tabOut: boolean;
}

function getTabInfo(row: number, col: number, rows: number, cols: number): {
  top: TabInfo;
  right: TabInfo;
  bottom: TabInfo;
  left: TabInfo;
} {
  // Top edge tab
  const topHasTab = row > 0;
  const topTabOut = topHasTab ? seededRandom(row * 1000 + col * 10 + 1) > 0.5 : false;
  
  // Right edge tab
  const rightHasTab = col < cols - 1;
  const rightTabOut = rightHasTab ? seededRandom(row * 1000 + (col + 1) * 10 + 2) > 0.5 : false;
  
  // Bottom edge tab (opposite of the piece below's top tab)
  const bottomHasTab = row < rows - 1;
  const bottomTabOut = bottomHasTab ? !(seededRandom((row + 1) * 1000 + col * 10 + 1) > 0.5) : false;
  
  // Left edge tab (opposite of the piece to the left's right tab)
  const leftHasTab = col > 0;
  const leftTabOut = leftHasTab ? !(seededRandom(row * 1000 + col * 10 + 2) > 0.5) : false;

  return {
    top: { hasTab: topHasTab, tabOut: topTabOut },
    right: { hasTab: rightHasTab, tabOut: rightTabOut },
    bottom: { hasTab: bottomHasTab, tabOut: bottomTabOut },
    left: { hasTab: leftHasTab, tabOut: leftTabOut },
  };
}

// Draw a classic jigsaw tab shape
function drawJigsawEdge(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  hasTab: boolean,
  tabOut: boolean,
  tabSize: number
) {
  if (!hasTab) {
    ctx.lineTo(endX, endY);
    return;
  }

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Unit vectors along and perpendicular to the edge
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  
  // Tab direction multiplier
  const dir = tabOut ? 1 : -1;
  
  // Key points along the edge (as fractions of length)
  const neckStart = 0.38;
  const neckEnd = 0.62;
  const neckInset = tabSize * 0.12 * dir;
  const headRadius = tabSize * 0.5;
  
  // Move to neck start
  const ns_x = startX + ux * length * neckStart;
  const ns_y = startY + uy * length * neckStart;
  ctx.lineTo(ns_x, ns_y);
  
  // Curve into the neck (slight inward curve)
  const neckIn1_x = ns_x + px * neckInset;
  const neckIn1_y = ns_y + py * neckInset;
  
  // Control point for smooth entry
  ctx.quadraticCurveTo(
    ns_x + px * neckInset * 0.5,
    ns_y + py * neckInset * 0.5,
    neckIn1_x,
    neckIn1_y
  );
  
  // Head center point
  const midX = startX + ux * length * 0.5;
  const midY = startY + uy * length * 0.5;
  const headCenter_x = midX + px * tabSize * 0.85 * dir;
  const headCenter_y = midY + py * tabSize * 0.85 * dir;
  
  // Draw the rounded head of the tab using bezier curves
  // Left side of head
  const headLeft_x = headCenter_x - ux * headRadius * 0.9;
  const headLeft_y = headCenter_y - uy * headRadius * 0.9;
  
  // Top of head (furthest point)
  const headTop_x = headCenter_x + px * headRadius * 0.4 * dir;
  const headTop_y = headCenter_y + py * headRadius * 0.4 * dir;
  
  // Right side of head
  const headRight_x = headCenter_x + ux * headRadius * 0.9;
  const headRight_y = headCenter_y + uy * headRadius * 0.9;
  
  // Neck end inset
  const ne_x = startX + ux * length * neckEnd;
  const ne_y = startY + uy * length * neckEnd;
  const neckIn2_x = ne_x + px * neckInset;
  const neckIn2_y = ne_y + py * neckInset;
  
  // Curve from neck to head left
  ctx.bezierCurveTo(
    neckIn1_x + ux * tabSize * 0.1,
    neckIn1_y + uy * tabSize * 0.1,
    headLeft_x - px * headRadius * 0.3 * dir,
    headLeft_y - py * headRadius * 0.3 * dir,
    headLeft_x,
    headLeft_y
  );
  
  // Curve around the head
  ctx.bezierCurveTo(
    headLeft_x + px * headRadius * 0.6 * dir,
    headLeft_y + py * headRadius * 0.6 * dir,
    headTop_x - ux * headRadius * 0.5,
    headTop_y - uy * headRadius * 0.5,
    headTop_x,
    headTop_y
  );
  
  ctx.bezierCurveTo(
    headTop_x + ux * headRadius * 0.5,
    headTop_y + uy * headRadius * 0.5,
    headRight_x + px * headRadius * 0.6 * dir,
    headRight_y + py * headRadius * 0.6 * dir,
    headRight_x,
    headRight_y
  );
  
  // Curve from head right back to neck
  ctx.bezierCurveTo(
    headRight_x - px * headRadius * 0.3 * dir,
    headRight_y - py * headRadius * 0.3 * dir,
    neckIn2_x - ux * tabSize * 0.1,
    neckIn2_y - uy * tabSize * 0.1,
    neckIn2_x,
    neckIn2_y
  );
  
  // Curve out of neck
  ctx.quadraticCurveTo(
    ne_x + px * neckInset * 0.5,
    ne_y + py * neckInset * 0.5,
    ne_x,
    ne_y
  );
  
  // Line to end
  ctx.lineTo(endX, endY);
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

    const tabSize = Math.min(piece.width, piece.height) * 0.25;
    const margin = tabSize + 2;
    
    canvas.width = piece.width + margin * 2;
    canvas.height = piece.height + margin * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tabs = getTabInfo(piece.row, piece.col, config.rows, config.cols);
    
    // Piece drawing coordinates (with margin offset)
    const x = margin;
    const y = margin;
    const w = piece.width;
    const h = piece.height;

    // Create the jigsaw piece path
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Top edge (left to right)
    drawJigsawEdge(ctx, x, y, x + w, y, tabs.top.hasTab, tabs.top.tabOut, tabSize);
    
    // Right edge (top to bottom)
    drawJigsawEdge(ctx, x + w, y, x + w, y + h, tabs.right.hasTab, tabs.right.tabOut, tabSize);
    
    // Bottom edge (right to left)
    drawJigsawEdge(ctx, x + w, y + h, x, y + h, tabs.bottom.hasTab, tabs.bottom.tabOut, tabSize);
    
    // Left edge (bottom to top)
    drawJigsawEdge(ctx, x, y + h, x, y, tabs.left.hasTab, tabs.left.tabOut, tabSize);
    
    ctx.closePath();

    // Save context and clip to piece shape
    ctx.save();
    ctx.clip();

    // Calculate source rectangle in the original image
    // We need to draw extra image area to cover the tabs
    const scaleX = image.width / (config.cols * piece.width);
    const scaleY = image.height / (config.rows * piece.height);
    
    // Source coordinates in the original image
    const srcX = piece.imageX * scaleX;
    const srcY = piece.imageY * scaleY;
    const srcW = piece.width * scaleX;
    const srcH = piece.height * scaleY;
    
    // Extra margin in source image coordinates for tabs
    const srcMargin = tabSize * Math.max(scaleX, scaleY);
    
    // Calculate how much extra we need on each side based on tab direction
    const extraTop = tabs.top.hasTab && tabs.top.tabOut ? srcMargin : 0;
    const extraBottom = tabs.bottom.hasTab && tabs.bottom.tabOut ? srcMargin : 0;
    const extraLeft = tabs.left.hasTab && tabs.left.tabOut ? srcMargin : 0;
    const extraRight = tabs.right.hasTab && tabs.right.tabOut ? srcMargin : 0;
    
    // Clamp source rectangle to image bounds
    const actualSrcX = Math.max(0, srcX - extraLeft);
    const actualSrcY = Math.max(0, srcY - extraTop);
    const actualSrcW = Math.min(image.width - actualSrcX, srcW + extraLeft + extraRight);
    const actualSrcH = Math.min(image.height - actualSrcY, srcH + extraTop + extraBottom);
    
    // Destination coordinates adjusted for the extra source area
    const dstX = x - (srcX - actualSrcX) / scaleX;
    const dstY = y - (srcY - actualSrcY) / scaleY;
    const dstW = actualSrcW / scaleX;
    const dstH = actualSrcH / scaleY;

    ctx.drawImage(
      image,
      actualSrcX,
      actualSrcY,
      actualSrcW,
      actualSrcH,
      dstX,
      dstY,
      dstW,
      dstH
    );

    ctx.restore();

    // Draw piece outline for definition
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Subtle inner glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
    e.preventDefault();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    onDragStart(piece.id);
  }, [piece.id, piece.isPlaced, onDragStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (piece.isPlaced) return;
    
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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
      const x = clientX - rect.left - dragOffset.x + (Math.min(piece.width, piece.height) * 0.25 + 2);
      const y = clientY - rect.top - dragOffset.y + (Math.min(piece.width, piece.height) * 0.25 + 2);
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
  }, [isDragging, dragOffset, piece.id, piece.width, piece.height, onDrag, onDragEnd]);

  const tabSize = Math.min(piece.width, piece.height) * 0.25;
  const margin = tabSize + 2;

  return (
    <motion.div
      className={`
        puzzle-piece absolute select-none touch-none
        ${isDragging ? 'puzzle-piece-dragging' : ''}
        ${wasJustPlaced ? 'puzzle-piece-placed' : ''}
        ${piece.isPlaced ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'}
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
        scale: wasJustPlaced ? [1, 1.08, 1] : 1,
        filter: isDragging 
          ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5))' 
          : piece.isPlaced 
            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))'
            : 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))'
      }}
      transition={{ duration: wasJustPlaced ? 0.3 : 0.15 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
}

export default memo(PuzzlePiece);
