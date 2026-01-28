export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  currentX: number;
  currentY: number;
  correctX: number;
  correctY: number;
  isPlaced: boolean;
  width: number;
  height: number;
  imageX: number;
  imageY: number;
}

export interface PuzzleConfig {
  rows: number;
  cols: number;
  pieceWidth: number;
  pieceHeight: number;
  image: HTMLImageElement;
  boardWidth: number;
  boardHeight: number;
}

export interface Position {
  x: number;
  y: number;
}
