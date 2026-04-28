import { Position, Dot, Cell, PuzzleConfig } from '@/types/game';

// Helper to check if positions are adjacent (including diagonal)
function areAdjacent(p1: Position, p2: Position): boolean {
  const rowDiff = Math.abs(p1.row - p2.row);
  const colDiff = Math.abs(p1.col - p2.col);
  return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
}

// Helper to check if positions are orthogonally adjacent (no diagonal)
function areOrthogonallyAdjacent(p1: Position, p2: Position): boolean {
  const rowDiff = Math.abs(p1.row - p2.row);
  const colDiff = Math.abs(p1.col - p2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Generate a Hamiltonian path using backtracking
function generateHamiltonianPath(gridSize: number): Position[] | null {
  const totalCells = gridSize * gridSize;
  const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
  const path: Position[] = [];

  // Start from a random position
  const startRow = Math.floor(Math.random() * gridSize);
  const startCol = Math.floor(Math.random() * gridSize);
  
  function backtrack(row: number, col: number): boolean {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize || visited[row][col]) {
      return false;
    }

    visited[row][col] = true;
    path.push({ row, col });

    if (path.length === totalCells) {
      return true;
    }

    // Try all 4 orthogonal directions in random order
    const directions = [
      { dr: -1, dc: 0 },  // up
      { dr: 1, dc: 0 },   // down
      { dr: 0, dc: -1 },  // left
      { dr: 0, dc: 1 }    // right
    ].sort(() => Math.random() - 0.5);

    for (const { dr, dc } of directions) {
      if (backtrack(row + dr, col + dc)) {
        return true;
      }
    }

    // Backtrack
    visited[row][col] = false;
    path.pop();
    return false;
  }

  if (backtrack(startRow, startCol)) {
    return path;
  }

  return null;
}

// Generate puzzle with dots placed along a Hamiltonian path
export function generatePuzzle(config: PuzzleConfig): {
  dots: Dot[];
  solution: Position[];
  grid: Cell[][];
} {
  const { gridSize, dotCount } = config;
  
  // Generate a Hamiltonian path (may take a few tries)
  let solution: Position[] | null = null;
  let attempts = 0;
  const maxAttempts = 100;

  while (!solution && attempts < maxAttempts) {
    solution = generateHamiltonianPath(gridSize);
    attempts++;
  }

  if (!solution) {
    // Fallback: generate a simpler path if Hamiltonian fails
    solution = generateSimplePath(gridSize);
  }

  // Place dots at regular intervals along the path
  const dots: Dot[] = [];
  const step = Math.floor(solution.length / dotCount);
  
  for (let i = 0; i < dotCount; i++) {
    const index = Math.min(i * step, solution.length - 1);
    dots.push({
      number: i + 1,
      position: solution[index]
    });
  }

  // Create grid
  const grid: Cell[][] = Array(gridSize).fill(null).map((_, row) =>
    Array(gridSize).fill(null).map((_, col) => {
      const dot = dots.find(d => d.position.row === row && d.position.col === col);
      return {
        position: { row, col },
        visited: false,
        isDot: !!dot,
        dotNumber: dot?.number
      };
    })
  );

  return { dots, solution, grid };
}

// Fallback: generate a simpler snake-like path
function generateSimplePath(gridSize: number): Position[] {
  const path: Position[] = [];
  
  for (let row = 0; row < gridSize; row++) {
    if (row % 2 === 0) {
      // Left to right
      for (let col = 0; col < gridSize; col++) {
        path.push({ row, col });
      }
    } else {
      // Right to left
      for (let col = gridSize - 1; col >= 0; col--) {
        path.push({ row, col });
      }
    }
  }
  
  return path;
}

// Validate if a path is valid (visits all cells, connects dots in order)
export function validatePath(
  path: Position[],
  dots: Dot[],
  gridSize: number
): boolean {
  if (path.length !== gridSize * gridSize) return false;

  // Check all cells are visited exactly once
  const visited = new Set(path.map(p => `${p.row},${p.col}`));
  if (visited.size !== path.length) return false;

  // Check all cells in grid are visited
  if (visited.size !== gridSize * gridSize) return false;

  // Check path is continuous (each step is adjacent)
  for (let i = 0; i < path.length - 1; i++) {
    if (!areOrthogonallyAdjacent(path[i], path[i + 1])) {
      return false;
    }
  }

  // Check dots are visited in order
  let currentDot = 1;
  for (const pos of path) {
    const dot = dots.find(d => d.position.row === pos.row && d.position.col === pos.col);
    if (dot) {
      if (dot.number !== currentDot) return false;
      currentDot++;
    }
  }

  return currentDot > dots.length;
}

// Generate daily puzzle seed based on date
export function getDailySeed(date: Date): number {
  const dateStr = date.toISOString().split('T')[0];
  return dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}
