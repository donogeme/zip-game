'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cell, Position } from '@/types/game';

interface GameGridProps {
  grid: Cell[][];
  path: Position[];
  onPathChange: (pos: Position) => void;
  isComplete: boolean;
}

export function GameGrid({ grid, path, onPathChange, isComplete }: GameGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const gridSize = grid.length;

  // Get cell from touch/mouse position
  const getCellFromPoint = useCallback((x: number, y: number): Position | null => {
    if (!gridRef.current) return null;

    const rect = gridRef.current.getBoundingClientRect();
    const cellSize = rect.width / gridSize;
    
    const col = Math.floor((x - rect.left) / cellSize);
    const row = Math.floor((y - rect.top) / cellSize);

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return null;
  }, [gridSize]);

  // Check if position is valid next move
  const isValidNextMove = useCallback((pos: Position): boolean => {
    if (path.length === 0) {
      // First move must be dot #1
      const cell = grid[pos.row][pos.col];
      return cell.isDot && cell.dotNumber === 1;
    }

    const lastPos = path[path.length - 1];
    
    // Must be adjacent (orthogonal only)
    const rowDiff = Math.abs(pos.row - lastPos.row);
    const colDiff = Math.abs(pos.col - lastPos.col);
    if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
      return false;
    }

    // Can't revisit
    if (path.some(p => p.row === pos.row && p.col === pos.col)) {
      return false;
    }

    // If it's a dot, must be the next number
    const cell = grid[pos.row][pos.col];
    if (cell.isDot) {
      const dotsVisited = path.filter(p => {
        const c = grid[p.row][p.col];
        return c.isDot;
      }).length;
      return cell.dotNumber === dotsVisited + 1;
    }

    return true;
  }, [path, grid]);

  const handleCellInteraction = useCallback((pos: Position) => {
    if (isComplete) return;
    if (isValidNextMove(pos)) {
      onPathChange(pos);
    }
  }, [isComplete, isValidNextMove, onPathChange]);

  // Mouse handlers
  const handleMouseDown = (row: number, col: number) => {
    setIsDragging(true);
    handleCellInteraction({ row, col });
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging) {
      handleCellInteraction({ row, col });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCellFromPoint(touch.clientX, touch.clientY);
    if (pos) {
      handleCellInteraction(pos);
    }
  }, [getCellFromPoint, handleCellInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const pos = getCellFromPoint(touch.clientX, touch.clientY);
    if (pos) {
      setIsDragging(true);
      handleCellInteraction(pos);
    }
  }, [getCellFromPoint, handleCellInteraction]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global mouse up listener
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="relative">
      <div
        ref={gridRef}
        className="grid gap-1 bg-gray-800 p-2 rounded-lg touch-none select-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GridCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              isInPath={path.some(p => p.row === rowIndex && p.col === colIndex)}
              pathIndex={path.findIndex(p => p.row === rowIndex && p.col === colIndex)}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
            />
          ))
        )}
      </div>

      {/* Path lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        {path.slice(0, -1).map((pos, i) => {
          const next = path[i + 1];
          const cellSize = gridRef.current ? gridRef.current.offsetWidth / gridSize : 0;
          const offset = cellSize / 2 + 8; // Account for padding

          return (
            <motion.line
              key={i}
              x1={pos.col * cellSize + offset}
              y1={pos.row * cellSize + offset}
              x2={next.col * cellSize + offset}
              y2={next.row * cellSize + offset}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            />
          );
        })}
      </svg>

      {/* Victory animation */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-6xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: 'spring', duration: 0.8 }}
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GridCellProps {
  cell: Cell;
  isInPath: boolean;
  pathIndex: number;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

function GridCell({ cell, isInPath, pathIndex, onMouseDown, onMouseEnter }: GridCellProps) {
  return (
    <motion.div
      className={`
        aspect-square flex items-center justify-center rounded
        text-lg font-bold cursor-pointer transition-colors
        ${isInPath ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}
        ${cell.isDot ? 'ring-2 ring-yellow-400' : ''}
        hover:bg-gray-600
      `}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        backgroundColor: isInPath ? '#3b82f6' : '#374151',
        scale: isInPath ? 1.1 : 1
      }}
      transition={{ duration: 0.2 }}
    >
      {cell.isDot && cell.dotNumber}
    </motion.div>
  );
}
