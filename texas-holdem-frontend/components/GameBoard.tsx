import React, { useState, useEffect } from 'react';
import { Player } from './Player';
import { Card } from './Card';
import { ChipPile } from './ChipPile';
import { WinnerOverlay } from './WinnerOverlay';
import { HandStrength } from './HandStrength';
import { motion } from 'framer-motion';
import { GameState } from '../types';

import "../styles/GameBoard.css";

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [previousStage, setPreviousStage] = useState<string | null>(null);

  const { players, communityCards, pot, activePlayerId, dealerId, smallBlindPlayerId, bigBlindPlayerId, stage, winners } = gameState;

  useEffect(() => {
    if (stage === 'HAND_OVER' && previousStage !== 'HAND_OVER' && winners && winners.length > 0) {
      setShowWinnerOverlay(true);
    }
    setPreviousStage(stage);
  }, [stage, previousStage, winners]);

  if (!players) return null;

  const showCards = stage === 'SHOWDOWN' || stage === 'HAND_OVER';
  const humanPlayer = players.find(p => p.isHuman);
  const winnerPlayers = winners ? players.filter(p => winners.includes(p.id)) : [];
  const isHumanWinner = humanPlayer ? (winners?.includes(humanPlayer.id) ?? false) : false;

  return (
    <div className="game-board">
      
      <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
        {showWinnerOverlay && winnerPlayers.length > 0 && (
            <div className="pointer-events-auto">
                <WinnerOverlay
                winners={winnerPlayers}
                pot={pot}
                isHumanWinner={isHumanWinner}
                onClose={() => setShowWinnerOverlay(false)}
                />
            </div>
        )}
      </div>

      <div className="table-wrapper">
        <motion.div
          className="poker-table"
          initial={{ rotateX: 20, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="table-surface relative">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4">
               <div className="flex flex-col items-center mb-2">
                  <span className="text-emerald-400 font-bold text-sm tracking-wider uppercase mb-1 drop-shadow-md">Total Pot</span>
                  <div className="bg-black/40 px-4 py-1 rounded-full border border-white/10 backdrop-blur-sm mb-2">
                      <span className="text-white font-bold text-xl">${pot}</span>
                  </div>
                  <ChipPile amount={pot} />
               </div>

              <div className="flex gap-2 perspective-1000">
                {communityCards.map((card, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: -50, rotateX: 45 }} 
                    animate={{ opacity: 1, y: 0, rotateX: 0 }} 
                    transition={{ delay: i * 0.1, type: "spring" }}
                  >
                    <Card card={card} />
                  </motion.div>
                ))}
              </div>
            </div>

            {players.map((player) => (
              <div key={player.id} className={`player-position player-pos-${player.id}-${players.length}`}>
                <Player
                  player={player}
                  isActive={player.id === activePlayerId}
                  isDealer={player.id === dealerId}
                  isSmallBlind={player.id === smallBlindPlayerId}
                  isBigBlind={player.id === bigBlindPlayerId}
                  showCards={showCards || player.isHuman}
                />
              </div>
            ))}

            {humanPlayer && stage !== 'HAND_OVER' && (
              <div className="absolute bottom-[20%] right-[25%] z-20 opacity-90 transform rotate-[-5deg]">
                <HandStrength
                  hand={humanPlayer.hand}
                  communityCards={communityCards}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameBoard;
