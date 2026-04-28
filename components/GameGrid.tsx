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

  // Helper to get direction between two positions
  const getDirection = (from: Position, to: Position): 'up' | 'down' | 'left' | 'right' | null => {
    if (from.row > to.row) return 'up';
    if (from.row < to.row) return 'down';
    if (from.col > to.col) return 'left';
    if (from.col < to.col) return 'right';
    return null;
  };

  return (
    <div className="relative">
      <div
        ref={gridRef}
        className="grid gap-[2px] bg-white p-1 rounded-2xl shadow-lg touch-none select-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          backgroundColor: '#FFF5E6' // Light cream background
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const pathIndex = path.findIndex(p => p.row === rowIndex && p.col === colIndex);
            const isInPath = pathIndex >= 0;
            
            // Get directions for flow indicators
            let fromDirection: 'up' | 'down' | 'left' | 'right' | null = null;
            let toDirection: 'up' | 'down' | 'left' | 'right' | null = null;
            
            if (isInPath && pathIndex > 0) {
              fromDirection = getDirection(path[pathIndex - 1], { row: rowIndex, col: colIndex });
            }
            if (isInPath && pathIndex < path.length - 1) {
              toDirection = getDirection({ row: rowIndex, col: colIndex }, path[pathIndex + 1]);
            }
            
            return (
              <GridCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                isInPath={isInPath}
                pathIndex={pathIndex}
                fromDirection={fromDirection}
                toDirection={toDirection}
                isStart={pathIndex === 0}
                isEnd={pathIndex === path.length - 1}
                isComplete={isComplete}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>

      {/* Victory animation */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-8xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [-180, 180, 360] 
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
  fromDirection: 'up' | 'down' | 'left' | 'right' | null;
  toDirection: 'up' | 'down' | 'left' | 'right' | null;
  isStart: boolean;
  isEnd: boolean;
  isComplete: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

function GridCell({ 
  cell, 
  isInPath, 
  pathIndex, 
  fromDirection,
  toDirection,
  isStart,
  isEnd,
  isComplete,
  onMouseDown, 
  onMouseEnter 
}: GridCellProps) {
  // Create visual flow indicators
  const getFlowStyle = () => {
    if (!isInPath) return {};
    
    // Build gradient based on flow direction
    let gradient = '';
    
    if (fromDirection === 'left' && toDirection === 'right') {
      gradient = 'linear-gradient(90deg, #FF6B1A 0%, #FF8A3D 50%, #FF6B1A 100%)';
    } else if (fromDirection === 'right' && toDirection === 'left') {
      gradient = 'linear-gradient(270deg, #FF6B1A 0%, #FF8A3D 50%, #FF6B1A 100%)';
    } else if (fromDirection === 'up' && toDirection === 'down') {
      gradient = 'linear-gradient(180deg, #FF6B1A 0%, #FF8A3D 50%, #FF6B1A 100%)';
    } else if (fromDirection === 'down' && toDirection === 'up') {
      gradient = 'linear-gradient(0deg, #FF6B1A 0%, #FF8A3D 50%, #FF6B1A 100%)';
    } else {
      gradient = '#FF6B1A';
    }
    
    return { background: gradient };
  };

  return (
    <motion.div
      className={`
        aspect-square flex items-center justify-center cursor-pointer relative
        rounded-md overflow-hidden
        ${isInPath ? '' : 'bg-white'}
        transition-all duration-150
      `}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      style={isInPath ? getFlowStyle() : { backgroundColor: '#FFFFFF' }}
      animate={{
        scale: isEnd ? [1, 1.05, 1] : 1
      }}
      transition={{
        scale: {
          repeat: isEnd ? Infinity : 0,
          duration: 0.8
        }
      }}
    >
      {/* Path order indicator (small number) */}
      {isInPath && !cell.isDot && (
        <span className="absolute top-0.5 right-0.5 text-[10px] font-bold text-white/60">
          {pathIndex + 1}
        </span>
      )}
      
      {/* Flow arrow indicators */}
      {isInPath && !isStart && fromDirection && (
        <div className={`absolute ${
          fromDirection === 'up' ? 'top-0 left-1/2 -translate-x-1/2' :
          fromDirection === 'down' ? 'bottom-0 left-1/2 -translate-x-1/2' :
          fromDirection === 'left' ? 'left-0 top-1/2 -translate-y-1/2' :
          'right-0 top-1/2 -translate-y-1/2'
        } text-white/30 text-xs`}>
          {fromDirection === 'up' ? '▼' :
           fromDirection === 'down' ? '▲' :
           fromDirection === 'left' ? '▶' : '◀'}
        </div>
      )}
      
      {/* Numbered dot */}
      {cell.isDot && (
        <div className="w-3/5 h-3/5 rounded-full bg-black flex items-center justify-center z-10 shadow-lg">
          <span className="text-white font-bold text-sm md:text-base">
            {cell.dotNumber}
          </span>
        </div>
      )}
      
      {/* Pulse effect on current end of path */}
      {isEnd && !isComplete && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-md"
          animate={{
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5
          }}
        />
      )}
    </motion.div>
  );
}
