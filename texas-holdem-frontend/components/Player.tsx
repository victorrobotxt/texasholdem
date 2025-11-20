import React from 'react';
import { Player as PlayerType } from '../types';
import { Card } from './Card';
import { ChipPile } from './ChipPile';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerProps {
  player: PlayerType;
  isActive: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  showCards: boolean;
}

export const Player: React.FC<PlayerProps> = ({ player, isActive, isDealer, isSmallBlind, isBigBlind, showCards }) => {
  const getBetPositionClass = () => {
      // Adjusted slightly to match new 140px width
      if(player.isHuman) return 'bottom-[120%] left-1/2 -translate-x-1/2';
      if(player.id === 2) return 'top-[120%] left-1/2 -translate-x-1/2';
      if(player.id === 1) return 'top-1/2 -translate-y-1/2 left-[100%]';
      if(player.id === 3) return 'top-1/2 -translate-y-1/2 right-[100%]';
      return 'bottom-full';
  }

  const getStackPositionClass = () => {
    // Adjusted slightly
    if (player.isHuman) return 'top-1/2 -translate-y-1/2 left-[-60%] top-[-50%]';
    if (player.id === 2) return 'left-1/2 -translate-x-1/2 left-[100%] bottom-[10%]';
    if (player.id === 1) return 'top-1/2 -translate-y-1/2 right-[0%] top-[-20%]';
    if (player.id === 3) return 'top-1/2 -translate-y-1/2 right-[80%] top-[-20%]';
    return '';
  }

  const getStatusText = () => {
    if (isActive) {
      return <span className="font-bold text-yellow-400 animate-pulse">Thinking...</span>;
    }
    if (player.isFolded) {
      return <span className="text-gray-500">Folded</span>;
    }
    let status = player.lastAction || '';
    if (player.isAllIn) {
      const allInText = 'ALL IN';
      return status ? `${status} (${allInText})` : allInText;
    }
    if (status) {
      return <span className="text-cyan-300">{status}</span>;
    }
    return 'Waiting';
  };

  const avatarIcons: { [key: string]: string } = {
      'Viper': '🐍',
      'Mountain': '🏔️',
      'Shark': '🦈',
  };

  const playerIcon = player.isHuman ? '👑' : (avatarIcons[player.name] || player.name.charAt(0));
  const cardSpacing = player.isHuman ? 'space-x-[-45px] md:space-x-[-50px]' : 'space-x-[-35px] md:space-x-[-45px]';
  const cardSize = player.isHuman ? false : true;

  return (
    <motion.div
        className="relative flex flex-col items-center"
        animate={{
            opacity: player.isFolded ? 0.4 : 1,
            scale: isActive ? 1.02 : 1,
            filter: player.isFolded ? 'grayscale(80%) blur(0.6px)' : 'grayscale(0%) blur(0px)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        layout
    >
        <div className={`absolute z-20 ${getBetPositionClass()}`}>
            <AnimatePresence>
            {player.currentBet > 0 && (
                <motion.div
                    layoutId={`bet-${player.id}`}
                    initial={{ opacity: 0, scale: 0.6}}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: 'spring' }}
                >
                    <ChipPile amount={player.currentBet} />
                </motion.div>
            )}
            </AnimatePresence>
        </div>
        <div className="flex flex-col items-center gap-2">
            <motion.div
                className={`player-pod relative text-white ${isActive ? 'active-ring' : 'border-gray-700'}`}
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                 {/* Improved Avatar Circle */}
                 <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-gray-800 shadow-lg z-20`} 
                     style={{ backgroundColor: player.isHuman ? '#d97706' : '#374151' }}>
                    <span className="drop-shadow-md">{playerIcon}</span>
                </div>
                
                <div className="pt-7 pb-2 px-4 text-center min-w-[100px]">
                    <p className="font-bold text-sm tracking-wide text-gray-100 shadow-black drop-shadow-sm">{player.name}</p>
                    <div className="text-xs uppercase font-semibold mt-1 h-4 flex items-center justify-center">
                        {getStatusText()}
                    </div>
                 </div>

                 {/* Updated Buttons (D, SB, BB) */}
                 <div className="absolute top-[-10px] left-[-10px] flex space-x-1 z-30">
                    {isDealer && <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-white text-black text-[10px] border border-gray-400 shadow-sm">D</div>}
                    {(isSmallBlind && !isDealer) && <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-blue-500 text-white text-[10px] border border-blue-300 shadow-sm">SB</div>}
                    {(isBigBlind && !isDealer) && <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-purple-600 text-white text-[10px] border border-purple-300 shadow-sm">BB</div>}
                </div>
            </motion.div>
            <div className={`absolute z-20 ${getStackPositionClass()}`}>
                <AnimatePresence>
                    {player.chips > 0 && (
                        <motion.div
                            layoutId={`stack-${player.id}`}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ type: 'spring' }}
                        >
                            <ChipPile amount={player.chips} size="small" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 flex justify-center ${cardSpacing} w-full md:w-auto`}
          style={{
              bottom: player.isHuman ? '40%' : 'auto',  
              top: !player.isHuman ? 'calc(100% + 0.5rem)' : 'auto'
          }}
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.06 }}
        >
            {(player.hand.length > 0 ? player.hand : ['BACK', 'BACK']).map((card, index) => (
                <motion.div key={index} variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                    <Card card={showCards ? card : 'BACK'} small={cardSize} />
                </motion.div>
            ))}
        </motion.div>
    </motion.div>
  );
};
