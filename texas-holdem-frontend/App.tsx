import React from 'react';
import { ActionControls } from './components/ActionControls';
import { useGameEngine } from './hooks/useGameEngine';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  const { gameState, handlePlayerAction, newGame, nextHand, isLoading, error } = useGameEngine();

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="app-title text-4xl sm:text-5xl mb-6">Texas Hold'em</h1>
        <p className="text-gray-300 mb-8">The ultimate AI Poker experience</p>
        <button
          onClick={newGame}
          disabled={isLoading}
          className="pill-btn btn-raise"
          style={{ padding: '14px 28px' }}
        >
          {isLoading ? 'Starting...' : 'Start New Game'}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    );
  }

  const humanPlayer = gameState.players.find(p => p.isHuman);

  return (
    <main className="flex flex-col items-center justify-start h-screen overflow-hidden p-2 md:p-4">
      <header className="w-full p-2 md:p-6 flex justify-center z-50">
        <h1 className="app-title text-2xl md:text-4xl">Texas Hold'em</h1> 
      </header>
      <div className="flex-grow w-full flex items-center justify-center overflow-hidden">
        <GameBoard gameState={gameState} />
      </div>
      <footer className="w-full flex justify-center p-2 md:p-4">
        <div className="w-full max-w-4xl">
          {gameState.stage !== 'HAND_OVER' && humanPlayer && (
              <ActionControls
                  player={humanPlayer}
                  pot={gameState.pot}
                  onAction={handlePlayerAction}
                  currentBet={gameState.betToCall}
                  isActive={gameState.activePlayerId === humanPlayer.id}
              />
          )}
          {gameState.stage === 'HAND_OVER' && (
             <div className="flex flex-col items-center justify-center h-40 w-full">
                  <button onClick={nextHand} disabled={isLoading} className="pill-btn btn-raise">
                      {isLoading ? '...' : 'Next Hand'}
                  </button>
              </div>
          )}
        </div>
      </footer>
    </main>
  );
};

export default App;
