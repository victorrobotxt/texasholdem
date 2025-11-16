import React from 'react';
import { Player } from './Player';
import { Card } from './Card';
import { ChipPile } from './ChipPile';
import { motion } from 'framer-motion';
import { GameState } from '../types'; // Import the correct type

import "../styles/GameBoard.css";

// The component receives a single 'gameState' object.
interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  // Destructure the necessary properties from the gameState object.
  const { players, communityCards, pot, activePlayerId, dealerId, smallBlindPlayerId, bigBlindPlayerId, stage } = gameState;

  // This check handles the initial state before players are populated.
  if (!players) {
    return null; 
  }

  const showCards = stage === 'SHOWDOWN' || stage === 'HAND_OVER';

  return (
    <div className="game-board w-full h-full flex items-center justify-center">
      <div className="table-wrapper">
        <motion.div
          className="poker-table"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="table-surface relative">
            {/* Community cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2">
              <div className="flex gap-1.5 md:gap-2.5" style={{ minHeight: '112px'}}>
                {communityCards.map((card, i) => (
                   <motion.div key={i} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: i * 0.1}}>
                     <Card card={card} />
                   </motion.div>
                ))}
              </div>
            </div>

            {/* Pot display */}
            <div className="absolute top-[calc(50%+65px)] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="text-white font-bold text-lg drop-shadow-lg">Pot: ${pot}</span>
              <ChipPile amount={pot} />
            </div>

            {/* Players around table */}
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameBoard;
