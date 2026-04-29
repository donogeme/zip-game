'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cell, Position } from '@/types/game';

interface GameGridProps {
  grid: Cell[][];
  path: Position[];
  onPathChange: (pos: Position) => void;
  onPathRetrace: (newLength: number) => void;
  isComplete: boolean;
  pathColor: { name: string; base: string; light: string; dark: string };
  hintPosition: Position | null;
}

export function GameGrid({ grid, path, onPathChange, onPathRetrace, isComplete, pathColor, hintPosition }: GameGridProps) {
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
    
    // Check if tapping on existing path - retrace to that point
    const existingIndex = path.findIndex(p => p.row === pos.row && p.col === pos.col);
    if (existingIndex >= 0) {
      // Retrace: keep path up to and including this cell
      onPathRetrace(existingIndex + 1);
      return;
    }
    
    // Otherwise, check if this is a valid next move
    if (isValidNextMove(pos)) {
      onPathChange(pos);
    }
  }, [isComplete, path, isValidNextMove, onPathChange, onPathRetrace]);

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
        className="grid gap-0 p-3 rounded-2xl shadow-lg touch-none select-none relative"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          backgroundColor: '#FFF5E6',
          border: '2px solid #E5E5E5'
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
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              isHint={hintPosition !== null && hintPosition.row === rowIndex && hintPosition.col === colIndex}
            />
          ))
        )}

        {/* SVG path overlay - the colored ribbon with gradient */}
        {path.length > 0 && gridRef.current && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%'
            }}
            viewBox={`0 0 ${gridSize} ${gridSize}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`pathGradient-${pathColor.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={pathColor.light} />
                <stop offset="50%" stopColor={pathColor.base} />
                <stop offset="100%" stopColor={pathColor.dark} />
              </linearGradient>
            </defs>
            <PathRibbon path={path} gridSize={gridSize} pathColor={pathColor} />
          </svg>
        )}
      </div>

      {/* Victory animation */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl backdrop-blur-sm z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: 0,
                  scale: 1,
                  rotate: Math.random() * 720
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.03,
                  ease: "easeOut"
                }}
              >
                {['🎉', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
            
            {/* Success message - reorganized so emoji doesn't cover text */}
            <motion.div
              className="flex flex-col items-center gap-2 z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring',
                duration: 0.6,
                delay: 0.2
              }}
            >
              <motion.div
                className="text-6xl"
                animate={{ 
                  rotate: [0, 10, -10, 10, 0]
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                🎊
              </motion.div>
              <motion.div
                className="text-4xl font-bold text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Perfect!
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GridCellProps {
  cell: Cell;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  isHint: boolean;
}

function GridCell({ cell, onMouseDown, onMouseEnter, isHint }: GridCellProps) {
  return (
    <div
      className="aspect-square flex items-center justify-center cursor-pointer relative bg-white"
      style={{
        border: '1px solid #E8E8E8'
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {/* Hint arrow - pulsing animation */}
      {isHint && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-5xl" style={{ 
            filter: 'drop-shadow(0 2px 8px rgba(255, 107, 26, 0.6))'
          }}>
            ⬇️
          </div>
        </motion.div>
      )}

      {/* Numbered dot - BLACK circle with WHITE text */}
      {/* Must be on top of path - render with high z-index */}
      {cell.isDot && (
        <div 
          className="absolute w-[70%] h-[70%] rounded-full flex items-center justify-center z-20"
          style={{
            backgroundColor: '#000000',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
          }}
        >
          <span className="font-bold" style={{ color: '#FFFFFF', fontSize: '1rem' }}>
            {cell.dotNumber}
          </span>
        </div>
      )}
    </div>
  );}
}

// Component to render the smooth rounded ribbon path
interface PathRibbonProps {
  path: Position[];
  gridSize: number;
  pathColor: { name: string; base: string; light: string; dark: string };
}

function PathRibbon({ path, gridSize, pathColor }: PathRibbonProps) {
  if (path.length === 0) return null;

  const ribbonWidth = 0.65; // 65% of cell width

  // Get center of cell in grid coordinates (0-gridSize range)
  const getCenter = (pos: Position) => ({
    x: pos.col + 0.5,
    y: pos.row + 0.5
  });

  // Build polyline points
  const buildPolyline = () => {
    return path.map(pos => {
      const center = getCenter(pos);
      return `${center.x},${center.y}`;
    }).join(' ');
  };

  return (
    <polyline
      points={buildPolyline()}
      fill="none"
      stroke={`url(#pathGradient-${pathColor.name})`}
      strokeWidth={ribbonWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={1}
      style={{
        filter: `drop-shadow(0 2px 4px ${pathColor.base}30)`
      }}
    />
  );
}
