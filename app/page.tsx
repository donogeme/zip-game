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

  const { gameState, addToPath, resetGame, newGame, undoMove, useHint, timer } = useGameState(config);

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-gray-800 text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-2">
            <span className="inline-flex items-center gap-2">
              <span className="bg-[#0A66C2] text-white px-3 py-1 rounded text-3xl">in</span>
              Zip
            </span>
          </h1>
          <p className="text-gray-600 text-lg mt-3">
            Connect all dots in order while filling the entire grid!
          </p>
        </div>

        {/* Game grid */}
        <div>
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
          onNewGame={newGame}
          onUndo={undoMove}
          onHint={handleHint}
          onConfigChange={handleConfigChange}
        />

        {/* Instructions */}
        <div className="bg-white/80 backdrop-blur p-5 rounded-2xl shadow-md text-sm text-gray-700">
          <h3 className="font-bold text-gray-800 mb-3 text-base">How to Play:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Create a single path that visits every cell in the grid</li>
            <li>The numbered cells must be visited in order</li>
            <li>Use the hint button if you are stuck</li>
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
