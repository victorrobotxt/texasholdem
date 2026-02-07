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
      if(player.isHuman) return 'bottom-[9rem] left-1/2 -translate-x-1/2'; 
      if(player.id === 2) return 'top-[9rem] left-1/2 -translate-x-1/2';    
      if(player.id === 1) return 'top-1/2 -translate-y-1/2 left-[10rem]';    
      if(player.id === 3) return 'top-1/2 -translate-y-1/2 right-[10rem]';   
      return '';
  }

  const getStackPositionClass = () => {
    if (player.isHuman) return 'top-1/2 -translate-y-1/2 left-[-3.5rem]';      
    if (player.id === 2) return 'top-1/2 -translate-y-1/2 right-[-3.5rem]';     
    if (player.id === 1) return 'bottom-[-2.5rem] left-1/2 -translate-x-1/2';     
    if (player.id === 3) return 'bottom-[-2.5rem] left-1/2 -translate-x-1/2';      
    return '';
  }

  const getStatusText = () => {
    if (isActive) return <span className="font-bold text-yellow-400 animate-pulse">Thinking...</span>;
    if (player.isFolded) return <span className="text-gray-500">Folded</span>;
    let status = player.lastAction || '';
    if (player.isAllIn) return status ? `${status} (ALL IN)` : 'ALL IN';
    if (status) return <span className="text-cyan-300">{status}</span>;
    return 'Waiting';
  };

  const avatarIcons: { [key: string]: string } = {
      'Viper': '🐍',
      'Mountain': '🏔️',
      'Shark': '🦈',
  };

  const playerIcon = player.isHuman ? '😎' : (avatarIcons[player.name] || player.name.charAt(0));

  return (
    <motion.div
        className="relative flex flex-col items-center justify-center w-[120px]"
        animate={{
            opacity: player.isFolded ? 0.6 : 1,
            scale: isActive ? 1.1 : 1,
            filter: player.isFolded ? 'grayscale(100%) brightness(0.7)' : 'grayscale(0%) brightness(1)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
        <div className={`absolute z-40 ${getBetPositionClass()}`}>
            <AnimatePresence>
            {player.currentBet > 0 && (
                <motion.div
                    layoutId={`bet-${player.id}`}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0 }}
                >
                    <ChipPile amount={player.currentBet} />
                    <div className="bg-black/60 text-white text-[10px] px-2 rounded-full text-center mt-1 backdrop-blur-sm border border-white/10">
                        ${player.currentBet}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        <div className="relative z-30 w-full">
            <motion.div
                className={`player-pod relative text-white w-full ${isActive ? 'active-ring' : 'border-gray-600'}`}
            >
                 <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-gray-500 shadow-lg z-20 bg-gray-800`} 
                      style={{ backgroundColor: player.isHuman ? '#0f766e' : '#1f2937' }}>
                    <span>{playerIcon}</span>
                </div>
                
                <div className="pt-6 pb-2 px-2 text-center">
                    <p className="font-bold text-xs tracking-wide text-gray-100 truncate shadow-black drop-shadow-md">{player.name}</p>
                    <div className="text-[10px] uppercase font-bold mt-0.5 h-3 flex items-center justify-center tracking-wider text-gray-300">
                        {getStatusText()}
                    </div>
                 </div>

                 <div className="absolute top-[-4px] right-[-4px] flex -space-x-1 z-30">
                    {isDealer && <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold bg-white text-black text-[10px] border border-gray-400 shadow-sm">D</div>}
                    {(isSmallBlind && !isDealer) && <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold bg-blue-500 text-white text-[10px] border border-blue-300 shadow-sm">S</div>}
                    {(isBigBlind && !isDealer) && <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold bg-purple-600 text-white text-[10px] border border-purple-300 shadow-sm">B</div>}
                </div>
            </motion.div>

            <div className={`absolute z-20 ${getStackPositionClass()}`}>
                {player.chips > 0 && (
                    <div className="flex flex-col items-center">
                         <ChipPile amount={player.chips} size="small" />
                         <span className="text-[10px] font-mono text-green-400 bg-black/50 px-1 rounded mt-[-5px] z-10">${player.chips}</span>
                    </div>
                )}
            </div>
        </div>

        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 flex justify-center w-full pointer-events-none`}
          style={{
              top: player.isHuman ? '-5rem' : '4.5rem',
              zIndex: player.isHuman ? 50 : 10 
          }}
        >
            {(player.hand.length > 0 ? player.hand : ['BACK', 'BACK']).map((card, index) => (
                <motion.div 
                    key={index} 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: index * 0.1 }}
                    className="origin-bottom shadow-2xl"
                    style={{ 
                        marginLeft: index > 0 ? '-30px' : '0',
                        transform: `rotate(${index === 0 ? '-6deg' : '6deg'}) translateY(${index === 0 ? '2px' : '0'})` 
                    }}
                >
                    <Card card={showCards ? card : 'BACK'} small={!player.isHuman} />
                </motion.div>
            ))}
        </motion.div>
    </motion.div>
  );
};
