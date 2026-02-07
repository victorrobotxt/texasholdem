import React from 'react';
import { ActionControls } from './components/ActionControls';
import { useGameEngine } from './hooks/useGameEngine';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  const { gameState, handlePlayerAction, newGame, nextHand, isConnected, isLoading, error } = useGameEngine();

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600 mb-8" 
            style={{ filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.4))' }}>
            Texas Hold'em
        </h1>
        
        <div className={`mb-6 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${isConnected ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'Server Connected' : 'Disconnected - Check Backend'}
        </div>

        <button
          onClick={newGame}
          disabled={isLoading || !isConnected}
          className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold text-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Shuffling...' : 'Deal Cards'}
        </button>
        {error && <p className="text-red-400 mt-6 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">{error}</p>}
      </div>
    );
  }

  const humanPlayer = gameState.players.find(p => p.isHuman);

  return (
    <main className="w-full h-screen overflow-hidden bg-gray-900 relative">
        {!isConnected && (
            <div className="absolute top-0 left-0 w-full z-50 bg-red-600/90 text-white text-center py-1 font-bold text-xs">
                ⚠️ Connection Lost. Attempting to reconnect...
            </div>
        )}

      <GameBoard gameState={gameState} />
      
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
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
             <button onClick={nextHand} disabled={isLoading} 
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-full shadow-2xl transition-all hover:scale-105 hover:shadow-blue-500/50">
                 {isLoading ? 'Dealing...' : 'Next Hand'}
             </button>
         </div>
      )}
    </main>
  );
};

export default App;
