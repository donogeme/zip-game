import { useState, useEffect, useCallback } from 'react';
import { GameState, Position, PuzzleConfig } from '@/types/game';
import { generatePuzzle, validatePath } from '@/lib/puzzleGenerator';

export function useGameState(config: PuzzleConfig) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize game
  const initGame = useCallback(() => {
    const { dots, solution, grid } = generatePuzzle(config);
    
    setGameState({
      gridSize: config.gridSize,
      dotCount: config.dotCount,
      dots,
      path: [],
      grid,
      isComplete: false,
      timer: 0,
      hintsUsed: 0
    });
    setTimer(0);
    setIsRunning(false);
  }, [config]);

  // Start timer on first move
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !gameState?.isComplete) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameState?.isComplete]);

  // Add position to path
  const addToPath = useCallback((pos: Position) => {
    if (!gameState || gameState.isComplete) return;

    setGameState(prev => {
      if (!prev) return prev;

      const newPath = [...prev.path, pos];
      const newGrid = prev.grid.map(row =>
        row.map(cell => ({
          ...cell,
          visited: newPath.some(p => p.row === cell.position.row && p.col === cell.position.col)
        }))
      );

      // Check if puzzle is complete
      const isComplete = validatePath(newPath, prev.dots, prev.gridSize);

      if (isComplete) {
        setIsRunning(false);
      } else if (!isRunning) {
        setIsRunning(true);
      }

      return {
        ...prev,
        path: newPath,
        grid: newGrid,
        isComplete,
        timer
      };
    });
  }, [gameState, timer, isRunning]);

  // Remove last position from path
  const removeFromPath = useCallback(() => {
    if (!gameState || gameState.path.length === 0) return;

    setGameState(prev => {
      if (!prev) return prev;

      const newPath = prev.path.slice(0, -1);
      const newGrid = prev.grid.map(row =>
        row.map(cell => ({
          ...cell,
          visited: newPath.some(p => p.row === cell.position.row && p.col === cell.position.col)
        }))
      );

      return {
        ...prev,
        path: newPath,
        grid: newGrid,
        isComplete: false
      };
    });
  }, [gameState]);

  // Reset game (clear path, keep same puzzle)
  const resetGame = useCallback(() => {
    if (!gameState) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        path: [],
        grid: prev.grid.map(row =>
          row.map(cell => ({
            ...cell,
            visited: false
          }))
        ),
        isComplete: false
      };
    });
    setTimer(0);
    setIsRunning(false);
  }, [gameState]);
  
  // New game (generate new puzzle)
  const newGame = useCallback(() => {
    initGame();
  }, [initGame]);
  
  // Undo last move
  const undoMove = useCallback(() => {
    if (!gameState || gameState.path.length === 0) return;
    
    setGameState(prev => {
      if (!prev || prev.path.length === 0) return prev;
      
      const newPath = prev.path.slice(0, -1);
      const newGrid = prev.grid.map(row =>
        row.map(cell => ({
          ...cell,
          visited: newPath.some(p => p.row === cell.position.row && p.col === cell.position.col)
        }))
      );
      
      return {
        ...prev,
        path: newPath,
        grid: newGrid,
        isComplete: false
      };
    });
  }, [gameState]);

  // Use hint (show next valid move)
  const useHint = useCallback(() => {
    if (!gameState) return null;

    // For now, just show the next dot
    const nextDotNumber = gameState.path.filter(pos =>
      gameState.dots.some(d => d.position.row === pos.row && d.position.col === pos.col)
    ).length + 1;

    const nextDot = gameState.dots.find(d => d.number === nextDotNumber);
    
    setGameState(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : prev);
    
    return nextDot?.position || null;
  }, [gameState]);

  // Initialize on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  return {
    gameState,
    addToPath,
    removeFromPath,
    resetGame,
    newGame,
    undoMove,
    useHint,
    timer
  };
}
