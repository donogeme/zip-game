'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PuzzleConfig } from '@/types/game';

interface GameControlsProps {
  config: PuzzleConfig;
  timer: number;
  hintsUsed: number;
  isComplete: boolean;
  onReset: () => void;
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  onConfigChange: (config: PuzzleConfig) => void;
}

export function GameControls({
  config,
  timer,
  hintsUsed,
  isComplete,
  onReset,
  onNewGame,
  onUndo,
  onHint,
  onConfigChange
}: GameControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [newConfig, setNewConfig] = useState(config);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const applySettings = () => {
    onConfigChange(newConfig);
    setShowSettings(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 bg-white/80 backdrop-blur p-4 rounded-2xl shadow-md">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{formatTime(timer)}</div>
          <div className="text-xs text-gray-500 font-medium">Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#FF6B1A]">{hintsUsed}</div>
          <div className="text-xs text-gray-500 font-medium">Hints</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {config.gridSize}×{config.gridSize}
          </div>
          <div className="text-xs text-gray-500 font-medium">Grid</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{config.dotCount}</div>
          <div className="text-xs text-gray-500 font-medium">Dots</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-2">
        <motion.button
          onClick={onUndo}
          className="bg-white hover:bg-gray-50 text-gray-700 py-3 px-2 rounded-xl font-semibold shadow-md border-2 border-gray-200 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ↶ Undo
        </motion.button>
        
        <motion.button
          onClick={onReset}
          className="bg-white hover:bg-gray-50 text-gray-700 py-3 px-2 rounded-xl font-semibold shadow-md border-2 border-gray-200 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🔄 Reset
        </motion.button>

        <motion.button
          onClick={onHint}
          disabled={isComplete}
          className="bg-[#FF6B1A] hover:bg-[#FF5500] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-2 rounded-xl font-semibold shadow-md text-sm"
          whileHover={!isComplete ? { scale: 1.02 } : {}}
          whileTap={!isComplete ? { scale: 0.98 } : {}}
        >
          💡 Hint
        </motion.button>

        <motion.button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white hover:bg-gray-50 text-gray-700 py-3 px-2 rounded-xl font-semibold shadow-md border-2 border-gray-200 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ⚙️
        </motion.button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-lg space-y-5"
        >
          <h3 className="text-xl font-bold text-gray-800">Game Settings</h3>

          {/* Grid size */}
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Grid Size: {newConfig.gridSize}×{newConfig.gridSize}
            </label>
            <input
              type="range"
              min="3"
              max="8"
              value={newConfig.gridSize}
              onChange={(e) => setNewConfig({ ...newConfig, gridSize: parseInt(e.target.value) })}
              className="w-full accent-[#FF6B1A]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3×3</span>
              <span>8×8</span>
            </div>
          </div>

          {/* Dot count */}
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Number of Dots: {newConfig.dotCount}
            </label>
            <input
              type="range"
              min="2"
              max={Math.min(newConfig.gridSize * 2, 16)}
              value={newConfig.dotCount}
              onChange={(e) => setNewConfig({ ...newConfig, dotCount: parseInt(e.target.value) })}
              className="w-full accent-[#FF6B1A]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2</span>
              <span>{Math.min(newConfig.gridSize * 2, 16)}</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setNewConfig({ ...newConfig, difficulty: diff })}
                  className={`py-2 px-4 rounded-lg font-semibold capitalize transition-colors ${
                    newConfig.difficulty === diff
                      ? 'bg-[#FF6B1A] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Apply buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => {
                setNewConfig(config);
                setShowSettings(false);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={applySettings}
              className="bg-[#FF6B1A] hover:bg-[#FF5500] text-white py-3 px-4 rounded-xl font-semibold shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              New Game
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Completion message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl text-center shadow-xl border-4 border-[#FF6B1A]"
        >
          <div className="text-3xl font-bold text-gray-800 mb-3">🎉 Puzzle Complete!</div>
          <div className="text-gray-600 text-lg">
            Time: <span className="font-bold text-[#FF6B1A]">{formatTime(timer)}</span> | 
            Hints: <span className="font-bold text-[#FF6B1A]">{hintsUsed}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
