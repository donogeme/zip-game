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
            />
          ))
        )}

        {/* SVG path overlay - the orange ribbon */}
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
            <PathRibbon path={path} gridSize={gridSize} />
          </svg>
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
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

function GridCell({ cell, onMouseDown, onMouseEnter }: GridCellProps) {
  return (
    <div
      className="aspect-square flex items-center justify-center cursor-pointer relative bg-white"
      style={{
        border: '1px solid #E8E8E8'
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {/* Numbered dot */}
      {cell.isDot && (
        <div className="w-3/5 h-3/5 rounded-full bg-black flex items-center justify-center z-10 shadow-lg">
          <span className="text-white font-bold text-sm md:text-base">
            {cell.dotNumber}
          </span>
        </div>
      )}
    </div>
  );
}

// Component to render the smooth rounded ribbon path
interface PathRibbonProps {
  path: Position[];
  gridSize: number;
}

function PathRibbon({ path, gridSize }: PathRibbonProps) {
  if (path.length === 0) return null;

  const ribbonWidth = 0.65; // 65% of cell width

  // Get center of cell in grid coordinates (0-gridSize range)
  const getCenter = (pos: Position) => ({
    x: pos.col + 0.5,
    y: pos.row + 0.5
  });

  // Build SVG path for the ribbon
  const buildPathString = () => {
    if (path.length === 1) {
      // Single cell - just a circle
      const center = getCenter(path[0]);
      const r = ribbonWidth / 2;
      return `M ${center.x - r} ${center.y} 
              A ${r} ${r} 0 1 1 ${center.x + r} ${center.y}
              A ${r} ${r} 0 1 1 ${center.x - r} ${center.y}`;
    }

    const points = path.map(getCenter);
    const r = ribbonWidth / 2; // radius
    
    // Calculate perpendicular offset points for each segment
    const getOffset = (p1: {x: number, y: number}, p2: {x: number, y: number}, side: number) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len * r * side;
      const ny = dx / len * r * side;
      return { x: p1.x + nx, y: p1.y + ny };
    };

    let pathData = '';
    
    // Start point
    const start = points[0];
    const next = points[1];
    const startOffset = getOffset(start, next, 1);
    
    pathData = `M ${startOffset.x} ${startOffset.y}`;
    
    // Rounded start cap
    const startOffsetOther = getOffset(start, next, -1);
    pathData += ` A ${r} ${r} 0 0 1 ${startOffsetOther.x} ${startOffsetOther.y}`;
    
    // Draw one side
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const offset = getOffset(curr, next, -1);
      const nextOffset = getOffset(curr, next, -1);
      pathData += ` L ${next.x + (nextOffset.x - curr.x - (next.x - curr.x))} ${next.y + (nextOffset.y - curr.y - (next.y - curr.y))}`;
    }
    
    // Rounded end cap
    const end = points[points.length - 1];
    const prev = points[points.length - 2];
    const endOffset1 = getOffset(prev, end, -1);
    const endOffset2 = getOffset(prev, end, 1);
    pathData += ` A ${r} ${r} 0 0 1 ${end.x + (endOffset2.x - prev.x - (end.x - prev.x))} ${end.y + (endOffset2.y - prev.y - (end.y - prev.y))}`;
    
    // Draw back along other side
    for (let i = points.length - 1; i > 0; i--) {
      const curr = points[i];
      const prev = points[i - 1];
      const offset = getOffset(prev, curr, 1);
      pathData += ` L ${prev.x + (offset.x - curr.x + (curr.x - prev.x))} ${prev.y + (offset.y - curr.y + (curr.y - prev.y))}`;
    }
    
    pathData += ' Z';
    return pathData;
  };

  // Simpler approach: use polyline with thick stroke and round joins
  const buildPolyline = () => {
    return path.map(pos => {
      const center = getCenter(pos);
      return `${center.x},${center.y}`;
    }).join(' ');
  };

  return (
    <motion.polyline
      points={buildPolyline()}
      fill="none"
      stroke="#FF6B1A"
      strokeWidth={ribbonWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        filter: 'drop-shadow(0 2px 4px rgba(255, 107, 26, 0.3))'
      }}
    />
  );
}
