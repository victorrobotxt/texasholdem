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

const avatarColors = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'
];

export const Player: React.FC<PlayerProps> = ({ player, isActive, isDealer, isSmallBlind, isBigBlind, showCards }) => {
  const getBetPositionClass = () => {
      if(player.isHuman) return 'bottom-[150%] left-1/2 -translate-x-1/2';
      if(player.id === 2) return 'top-[150%] left-1/2 -translate-x-1/2';
      if(player.id === 1) return 'top-1/2 -translate-y-1/2 left-[105%]';
      if(player.id === 3) return 'top-1/2 -translate-y-1/2 right-[105%]';
      return 'bottom-full';
  }

  const getStackPositionClass = () => {
    if (player.isHuman) return 'top-1/2 -translate-y-1/2 left-[-80%] top-[-50%]';
    if (player.id === 2) return 'left-1/2 -translate-x-1/2 left-[110%] bottom-[10%]';
    if (player.id === 1) return 'top-1/2 -translate-y-1/2 right-[0%] top-[-20%]';
    if (player.id === 3) return 'top-1/2 -translate-y-1/2 right-[100%] top-[-20%]';
    return '';
  }

  const getStatusText = () => {
    if (isActive) {
      return <span className="font-bold text-yellow-300">Acting...</span>;
    }
    if (player.isFolded) {
      return 'Folded';
    }
    let status = player.lastAction || '';
    if (player.isAllIn) {
      const allInText = 'All In';
      return status ? `${status} (${allInText})` : allInText;
    }
    if (status) {
      return status;
    }
    return 'Waiting';
  };

  const avatarIcons: { [key: string]: string } = {
      'Viper': '🐍',
      'Goliath': '🦍',
      'The Shark': '🦈',
  };

  const playerIcon = player.isHuman ? '👑' : (avatarIcons[player.name] || player.name.charAt(0));
  const cardSpacing = player.isHuman ? 'space-x-[-45px] md:space-x-[-50px]' : 'space-x-[-35px] md:space-x-[-45px]';
  const cardSize = player.isHuman ? false : true;

  return (
    <motion.div
        className="relative flex flex-col items-center"
        animate={{
            opacity: player.isFolded ? 0.45 : 1,
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
                className={`player-pod relative text-white ${isActive ? 'active-ring' : ''}`}
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                 <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-slate-700`} style={{ backgroundColor: player.isHuman ? '#f59e0b' : undefined }}>
                    <span>{playerIcon}</span>
                </div>
                <div className="pt-6 text-center">
                    <p className="font-semibold truncate text-sm md:text-base">{player.name}</p>
                    <div className="text-xs uppercase font-medium mt-1 text-cyan-300 h-4">
                        {getStatusText()}
                    </div>
                 </div>
                 <div className="absolute top-[-12px] left-[-12px] flex space-x-2 z-30">
                    {isDealer && <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-yellow-300/80 bg-yellow-500/90 text-black text-sm">D</div>}
                    {isSmallBlind && <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold border-2 border-white/40 bg-blue-500/90 text-white text-xs">SB</div>}
                    {isBigBlind && <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold border-2 border-white/40 bg-purple-600/90 text-white text-xs">BB</div>}
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
              bottom: player.isHuman ? '50%' : 'auto',  // Reduced from 100% to shove cards down, strangling overlap
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
