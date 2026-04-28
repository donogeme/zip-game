export interface Position {
  row: number;
  col: number;
}

export interface Dot {
  number: number;
  position: Position;
}

export interface Cell {
  position: Position;
  visited: boolean;
  isDot: boolean;
  dotNumber?: number;
}

export interface GameState {
  gridSize: number;
  dotCount: number;
  dots: Dot[];
  path: Position[];
  grid: Cell[][];
  isComplete: boolean;
  timer: number;
  hintsUsed: number;
}

export interface PuzzleConfig {
  gridSize: number;
  dotCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyPuzzle {
  date: string;
  config: PuzzleConfig;
  solution: Position[];
  completed: boolean;
  time?: number;
}
