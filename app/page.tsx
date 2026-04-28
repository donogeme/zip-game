'use client';

import { useState } from 'react';
import { PuzzleConfig } from '@/types/game';
import { useGameState } from '@/hooks/useGameState';
import { GameGrid } from '@/components/GameGrid';
import { GameControls } from '@/components/GameControls';

export default function Home() {
  const [config, setConfig] = useState<PuzzleConfig>({
    gridSize: 5,
    dotCount: 5,
    difficulty: 'medium'
  });

  const { gameState, addToPath, resetGame, useHint, timer } = useGameState(config);

  const handleConfigChange = (newConfig: PuzzleConfig) => {
    setConfig(newConfig);
    // Game will auto-reset via useGameState dependency
  };

  const handleHint = () => {
    const hintPos = useHint();
    if (hintPos) {
      // Flash the hint position
      // TODO: Add visual feedback for hint
      alert(`Next dot is at row ${hintPos.row + 1}, column ${hintPos.col + 1}`);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Zip 🎯
          </h1>
          <p className="text-gray-400">
            Connect all dots in order while filling the entire grid!
          </p>
        </div>

        {/* Game grid */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <GameGrid
            grid={gameState.grid}
            path={gameState.path}
            onPathChange={addToPath}
            isComplete={gameState.isComplete}
          />
        </div>

        {/* Controls */}
        <GameControls
          config={config}
          timer={timer}
          hintsUsed={gameState.hintsUsed}
          isComplete={gameState.isComplete}
          onReset={resetGame}
          onHint={handleHint}
          onConfigChange={handleConfigChange}
        />

        {/* Instructions */}
        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-400">
          <h3 className="font-bold text-white mb-2">How to Play:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Start at dot #1</li>
            <li>Draw a continuous path through all dots in order</li>
            <li>The path must visit every cell on the grid exactly once</li>
            <li>You can only move up, down, left, or right (no diagonals)</li>
            <li>Complete the puzzle to win!</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          Made with 🦀 by Zoidberg
        </div>
      </div>
    </main>
  );
}
