import { PuzzlePiece } from '@/types/puzzle';
import { StockImageInfo } from './stockImages';
import { PuzzleGridConfig } from '@/components/PuzzleSettings';

interface SavedPuzzleState {
  imageSrc: string;
  pieces: PuzzlePiece[];
  gridConfig: PuzzleGridConfig;
  attribution: StockImageInfo | null;
  savedAt: number;
}

const STORAGE_KEY = 'jigsaw-puzzle-state';

export function savePuzzleState(
  imageSrc: string,
  pieces: PuzzlePiece[],
  gridConfig: PuzzleGridConfig,
  attribution: StockImageInfo | null
): void {
  try {
    const state: SavedPuzzleState = {
      imageSrc,
      pieces,
      gridConfig,
      attribution,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save puzzle state:', error);
  }
}

export function loadPuzzleState(): SavedPuzzleState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as SavedPuzzleState;
    
    // Validate the saved state has required fields
    if (!state.imageSrc || !state.pieces || !state.gridConfig) {
      clearPuzzleState();
      return null;
    }
    
    return state;
  } catch (error) {
    console.warn('Failed to load puzzle state:', error);
    clearPuzzleState();
    return null;
  }
}

export function clearPuzzleState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear puzzle state:', error);
  }
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
