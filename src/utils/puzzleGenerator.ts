import { PuzzlePiece, PuzzleConfig } from '@/types/puzzle';

export const SNAP_THRESHOLD = 30;

export function generatePuzzlePieces(config: PuzzleConfig): PuzzlePiece[] {
  const { rows, cols, pieceWidth, pieceHeight, boardWidth, boardHeight } = config;
  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = row * cols + col;
      const correctX = col * pieceWidth;
      const correctY = row * pieceHeight;
      
      // Random initial position around the board edges
      const side = Math.floor(Math.random() * 4);
      let currentX: number, currentY: number;
      
      const margin = 50;
      const puzzleAreaWidth = cols * pieceWidth;
      const puzzleAreaHeight = rows * pieceHeight;
      const puzzleOffsetX = (boardWidth - puzzleAreaWidth) / 2;
      const puzzleOffsetY = (boardHeight - puzzleAreaHeight) / 2;
      
      switch (side) {
        case 0: // Left
          currentX = margin + Math.random() * (puzzleOffsetX - pieceWidth - margin * 2);
          currentY = margin + Math.random() * (boardHeight - pieceHeight - margin * 2);
          break;
        case 1: // Right
          currentX = puzzleOffsetX + puzzleAreaWidth + margin + Math.random() * (puzzleOffsetX - pieceWidth - margin * 2);
          currentY = margin + Math.random() * (boardHeight - pieceHeight - margin * 2);
          break;
        case 2: // Top
          currentX = margin + Math.random() * (boardWidth - pieceWidth - margin * 2);
          currentY = margin + Math.random() * (puzzleOffsetY - pieceHeight - margin * 2);
          break;
        default: // Bottom
          currentX = margin + Math.random() * (boardWidth - pieceWidth - margin * 2);
          currentY = puzzleOffsetY + puzzleAreaHeight + margin + Math.random() * (puzzleOffsetY - pieceHeight - margin * 2);
      }

      // Ensure pieces are within bounds
      currentX = Math.max(margin, Math.min(currentX, boardWidth - pieceWidth - margin));
      currentY = Math.max(margin, Math.min(currentY, boardHeight - pieceHeight - margin));

      pieces.push({
        id,
        row,
        col,
        currentX,
        currentY,
        correctX: puzzleOffsetX + correctX,
        correctY: puzzleOffsetY + correctY,
        isPlaced: false,
        width: pieceWidth,
        height: pieceHeight,
        imageX: col * pieceWidth,
        imageY: row * pieceHeight,
        groupId: id, // Each piece starts in its own group
      });
    }
  }

  // Shuffle pieces array for random z-order
  return pieces.sort(() => Math.random() - 0.5);
}

export function getAdjacentPieceIds(piece: PuzzlePiece, rows: number, cols: number): number[] {
  const { row, col } = piece;
  const adjacentIds: number[] = [];

  if (row > 0) adjacentIds.push((row - 1) * cols + col); // Top
  if (row < rows - 1) adjacentIds.push((row + 1) * cols + col); // Bottom
  if (col > 0) adjacentIds.push(row * cols + (col - 1)); // Left
  if (col < cols - 1) adjacentIds.push(row * cols + (col + 1)); // Right

  return adjacentIds;
}

// Get all pieces in the same group
export function getGroupPieces(pieces: PuzzlePiece[], groupId: number): PuzzlePiece[] {
  return pieces.filter(p => p.groupId === groupId);
}

// Check if two pieces are adjacent in the puzzle grid
export function areAdjacent(piece1: PuzzlePiece, piece2: PuzzlePiece): boolean {
  const rowDiff = Math.abs(piece1.row - piece2.row);
  const colDiff = Math.abs(piece1.col - piece2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Calculate where a piece should be relative to another piece
export function getExpectedPosition(
  referencePiece: PuzzlePiece,
  targetPiece: PuzzlePiece
): { x: number; y: number } {
  const colDiff = targetPiece.col - referencePiece.col;
  const rowDiff = targetPiece.row - referencePiece.row;
  
  return {
    x: referencePiece.currentX + colDiff * referencePiece.width,
    y: referencePiece.currentY + rowDiff * referencePiece.height,
  };
}

// Check if a piece can snap to another piece (they are adjacent and edges align)
export function checkPieceToGroupSnap(
  draggedPiece: PuzzlePiece,
  pieces: PuzzlePiece[],
  rows: number,
  cols: number
): { targetGroupId: number; snapOffset: { x: number; y: number } } | null {
  const adjacentIds = getAdjacentPieceIds(draggedPiece, rows, cols);
  
  for (const adjacentId of adjacentIds) {
    const adjacentPiece = pieces.find(p => p.id === adjacentId);
    if (!adjacentPiece || adjacentPiece.groupId === draggedPiece.groupId) continue;
    
    // Calculate expected position if snapped to this adjacent piece
    const expectedPos = getExpectedPosition(adjacentPiece, draggedPiece);
    
    const distance = Math.sqrt(
      Math.pow(draggedPiece.currentX - expectedPos.x, 2) +
      Math.pow(draggedPiece.currentY - expectedPos.y, 2)
    );
    
    if (distance <= SNAP_THRESHOLD) {
      return {
        targetGroupId: adjacentPiece.groupId,
        snapOffset: {
          x: expectedPos.x - draggedPiece.currentX,
          y: expectedPos.y - draggedPiece.currentY,
        },
      };
    }
  }
  
  return null;
}

// Check if piece/group should snap to final position
export function checkFinalSnap(
  piece: PuzzlePiece,
  pieces: PuzzlePiece[],
  rows: number,
  cols: number
): boolean {
  const distance = Math.sqrt(
    Math.pow(piece.currentX - piece.correctX, 2) +
    Math.pow(piece.currentY - piece.correctY, 2)
  );

  if (distance > SNAP_THRESHOLD) {
    return false;
  }

  // Edge pieces can always snap into place when close enough
  const isEdgePiece = piece.row === 0 || piece.row === rows - 1 || 
                      piece.col === 0 || piece.col === cols - 1;
  
  if (isEdgePiece) {
    return true;
  }

  // Non-edge pieces need at least one adjacent piece placed
  const adjacentIds = getAdjacentPieceIds(piece, rows, cols);
  const hasAdjacentPlaced = adjacentIds.some(id => {
    const adjacentPiece = pieces.find(p => p.id === id);
    return adjacentPiece?.isPlaced;
  });

  return hasAdjacentPlaced;
}

// Merge two groups - updates all pieces from oldGroupId to newGroupId
export function mergeGroups(
  pieces: PuzzlePiece[],
  oldGroupId: number,
  newGroupId: number
): PuzzlePiece[] {
  return pieces.map(p => 
    p.groupId === oldGroupId ? { ...p, groupId: newGroupId } : p
  );
}

export function isPuzzleComplete(pieces: PuzzlePiece[]): boolean {
  return pieces.every(piece => piece.isPlaced);
}
