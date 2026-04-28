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
        className="grid gap-[2px] bg-white p-1 rounded-2xl shadow-lg touch-none select-none relative"
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
        {path.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
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
      className="aspect-square flex items-center justify-center cursor-pointer relative bg-white rounded-sm"
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

  // Calculate cell size and center offset
  const cellSize = 100 / gridSize; // percentage
  const ribbonWidth = cellSize * 0.65; // 65% of cell width
  const halfRibbon = ribbonWidth / 2;

  // Convert grid position to SVG percentage coordinates (center of cell)
  const getCenter = (pos: Position) => ({
    x: (pos.col + 0.5) * cellSize,
    y: (pos.row + 0.5) * cellSize
  });

  // Build the path string with rounded corners
  const buildPathString = () => {
    if (path.length === 1) {
      // Just a circle for single cell
      const center = getCenter(path[0]);
      return `M ${center.x - halfRibbon} ${center.y} 
              A ${halfRibbon} ${halfRibbon} 0 1 1 ${center.x + halfRibbon} ${center.y}
              A ${halfRibbon} ${halfRibbon} 0 1 1 ${center.x - halfRibbon} ${center.y}`;
    }

    const points = path.map(getCenter);
    let pathData = '';

    // Start with rounded cap
    const start = points[0];
    const next = points[1];
    const startAngle = Math.atan2(next.y - start.y, next.x - start.x);
    const perpAngle = startAngle + Math.PI / 2;
    
    const startX1 = start.x + Math.cos(perpAngle) * halfRibbon;
    const startY1 = start.y + Math.sin(perpAngle) * halfRibbon;
    const startX2 = start.x - Math.cos(perpAngle) * halfRibbon;
    const startY2 = start.y - Math.sin(perpAngle) * halfRibbon;

    pathData = `M ${startX1} ${startY1}`;

    // Add rounded start cap
    pathData += ` A ${halfRibbon} ${halfRibbon} 0 0 0 ${startX2} ${startY2}`;

    // Draw along one side
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const angle = Math.atan2(next.y - current.y, next.x - current.x);
      const perpAngle = angle + Math.PI / 2;
      
      const x = next.x - Math.cos(perpAngle) * halfRibbon;
      const y = next.y - Math.sin(perpAngle) * halfRibbon;
      
      pathData += ` L ${x} ${y}`;
    }

    // Rounded end cap
    const end = points[points.length - 1];
    const prev = points[points.length - 2];
    const endAngle = Math.atan2(end.y - prev.y, end.x - prev.x);
    const endPerpAngle = endAngle + Math.PI / 2;
    
    const endX1 = end.x - Math.cos(endPerpAngle) * halfRibbon;
    const endY1 = end.y - Math.sin(endPerpAngle) * halfRibbon;
    const endX2 = end.x + Math.cos(endPerpAngle) * halfRibbon;
    const endY2 = end.y + Math.sin(endPerpAngle) * halfRibbon;

    pathData += ` A ${halfRibbon} ${halfRibbon} 0 0 0 ${endX2} ${endY2}`;

    // Draw back along other side
    for (let i = points.length - 1; i > 0; i--) {
      const current = points[i];
      const prev = points[i - 1];
      const angle = Math.atan2(prev.y - current.y, prev.x - current.x);
      const perpAngle = angle + Math.PI / 2;
      
      const x = prev.x - Math.cos(perpAngle) * halfRibbon;
      const y = prev.y - Math.sin(perpAngle) * halfRibbon;
      
      pathData += ` L ${x} ${y}`;
    }

    pathData += ' Z'; // Close path

    return pathData;
  };

  return (
    <motion.path
      d={buildPathString()}
      fill="#FF6B1A"
      stroke="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }}
    />
  );
}
