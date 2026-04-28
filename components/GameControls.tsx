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
  onHint: () => void;
  onConfigChange: (config: PuzzleConfig) => void;
}

export function GameControls({
  config,
  timer,
  hintsUsed,
  isComplete,
  onReset,
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
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{formatTime(timer)}</div>
          <div className="text-xs text-gray-400">Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{hintsUsed}</div>
          <div className="text-xs text-gray-400">Hints</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {config.gridSize}×{config.gridSize}
          </div>
          <div className="text-xs text-gray-400">Grid</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{config.dotCount}</div>
          <div className="text-xs text-gray-400">Dots</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          onClick={onReset}
          className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Reset
        </motion.button>

        <motion.button
          onClick={onHint}
          disabled={isComplete}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold"
          whileHover={!isComplete ? { scale: 1.05 } : {}}
          whileTap={!isComplete ? { scale: 0.95 } : {}}
        >
          💡 Hint
        </motion.button>

        <motion.button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⚙️ Settings
        </motion.button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-4 rounded-lg space-y-4"
        >
          <h3 className="text-xl font-bold text-white">Game Settings</h3>

          {/* Grid size */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Grid Size: {newConfig.gridSize}×{newConfig.gridSize}
            </label>
            <input
              type="range"
              min="3"
              max="8"
              value={newConfig.gridSize}
              onChange={(e) => setNewConfig({ ...newConfig, gridSize: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>3×3</span>
              <span>8×8</span>
            </div>
          </div>

          {/* Dot count */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Number of Dots: {newConfig.dotCount}
            </label>
            <input
              type="range"
              min="2"
              max={Math.min(newConfig.gridSize * 2, 16)}
              value={newConfig.dotCount}
              onChange={(e) => setNewConfig({ ...newConfig, dotCount: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2</span>
              <span>{Math.min(newConfig.gridSize * 2, 16)}</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setNewConfig({ ...newConfig, difficulty: diff })}
                  className={`py-2 px-4 rounded font-semibold capitalize ${
                    newConfig.difficulty === diff
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <motion.button
            onClick={applySettings}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Apply & New Game
          </motion.button>
        </motion.div>
      )}

      {/* Completion message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-600 p-4 rounded-lg text-center"
        >
          <div className="text-2xl font-bold text-white mb-2">🎉 Puzzle Complete!</div>
          <div className="text-white">
            Time: {formatTime(timer)} | Hints: {hintsUsed}
          </div>
        </motion.div>
      )}
    </div>
  );
}
