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

    // Can't revisit a cell
    if (path.some(p => p.row === pos.row && p.col === pos.col)) {
      return false;
    }

    // Can't cross over an existing line segment
    for (let i = 0; i < path.length - 1; i++) {
      const segStart = path[i];
      const segEnd = path[i + 1];
      
      // Check if new segment (lastPos -> pos) crosses existing segment (segStart -> segEnd)
      if (segmentsIntersect(lastPos, pos, segStart, segEnd)) {
        return false;
      }
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

  // Check if two line segments intersect (share an edge)
  const segmentsIntersect = (a1: Position, a2: Position, b1: Position, b2: Position): boolean => {
    // Same segment, skip
    if ((a1.row === b1.row && a1.col === b1.col && a2.row === b2.row && a2.col === b2.col) ||
        (a1.row === b2.row && a1.col === b2.col && a2.row === b1.row && a2.col === b1.col)) {
      return false;
    }
    
    // Check if segments share the same edge (same two cells)
    const sameEdge = 
      (a1.row === b1.row && a1.col === b1.col && a2.row === b2.row && a2.col === b2.col) ||
      (a1.row === b2.row && a1.col === b2.col && a2.row === b1.row && a2.col === b1.col);
    
    return sameEdge;
  };

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
        className="grid gap-2 bg-gray-900 p-4 rounded-xl shadow-2xl touch-none select-none"
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
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        {path.slice(0, -1).map((pos, i) => {
          const next = path[i + 1];
          const cellSize = gridRef.current ? gridRef.current.offsetWidth / gridSize : 0;
          const offset = cellSize / 2 + 8; // Account for padding

          return (
            <g key={i}>
              {/* Shadow/outline */}
              <motion.line
                x1={pos.col * cellSize + offset}
                y1={pos.row * cellSize + offset}
                x2={next.col * cellSize + offset}
                y2={next.row * cellSize + offset}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.15 }}
              />
              {/* Main line */}
              <motion.line
                x1={pos.col * cellSize + offset}
                y1={pos.row * cellSize + offset}
                x2={next.col * cellSize + offset}
                y2={next.row * cellSize + offset}
                stroke="url(#pathGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.15 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Victory animation */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-8xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [- 180, 180, 360] 
              }}
              transition={{ 
                type: 'spring',
                duration: 1,
                bounce: 0.5
              }}
            >
              🎉
            </motion.div>
            <motion.div
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Puzzle Complete!
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
        aspect-square flex items-center justify-center rounded-lg
        text-xl font-bold cursor-pointer
        ${isInPath ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-500'}
        ${cell.isDot ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : ''}
        ${!isInPath && !cell.isDot ? 'hover:bg-gray-600 hover:ring-2 hover:ring-blue-400/50' : ''}
        transition-all duration-200
      `}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      whileHover={{ scale: cell.isDot || !isInPath ? 1.05 : 1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isInPath ? 1.05 : 1
      }}
      transition={{ duration: 0.15 }}
    >
      {cell.isDot && (
        <span className={isInPath ? 'text-white drop-shadow-lg' : 'text-yellow-400'}>
          {cell.dotNumber}
        </span>
      )}
      {isInPath && !cell.isDot && (
        <span className="text-xs text-blue-200 opacity-75">{pathIndex + 1}</span>
      )}
    </motion.div>
  );
}
