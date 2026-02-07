import React, { useState, useEffect, useMemo } from 'react';
import { Player, PlayerAction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionControlsProps {
  player: Player;
  pot: number;
  onAction: (action: PlayerAction, amount?: number) => void;
  currentBet: number;
  isActive: boolean;
}

export const ActionControls: React.FC<ActionControlsProps> = ({ player, pot, onAction, currentBet, isActive }) => {
    const minRaise = useMemo(() => Math.max(currentBet > 0 ? currentBet * 2 : 20, 20), [currentBet]);
    const [betAmount, setBetAmount] = useState(minRaise);

    const callAmount = currentBet - player.currentBet;
    const canCheck = callAmount <= 0;

    const quickBets = useMemo(() => [
        { label: '½ Pot', value: Math.max(minRaise, Math.floor((pot + currentBet) / 2)) },
        { label: 'Pot', value: Math.max(minRaise, pot + currentBet) },
        { label: 'All In', value: player.chips + player.currentBet },
    ], [pot, player, minRaise, currentBet]);

    useEffect(() => {
        setBetAmount(minRaise);
    }, [minRaise]);
    
    const handleActionWithVibration = (actionFn: () => void) => {
        if (navigator.vibrate) navigator.vibrate(50);
        actionFn();
    };

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBetAmount(parseInt(e.target.value, 10) || 0);
    };
    
    const handleFold = () => handleActionWithVibration(() => onAction('fold'));
    const handleCheckOrCall = () => handleActionWithVibration(() => onAction(canCheck ? 'check' : 'call', callAmount));
    const handleBetOrRaise = () => {
        const finalAmount = Math.max(minRaise, Math.min(betAmount, player.chips + player.currentBet));
        const actionType = (currentBet > 0 && callAmount < player.chips) ? 'raise' : 'bet';
        handleActionWithVibration(() => onAction(actionType, finalAmount));
    };
   
    const sanitizedBetAmount = Math.min(betAmount, player.chips + player.currentBet);

    return (
        <fieldset 
            disabled={!isActive} 
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 transition-all duration-300 disabled:opacity-50 disabled:translate-y-4 disabled:pointer-events-none"
        >
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 ring-1 ring-black/50">
            
            <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mb-4">
                <AnimatePresence>
                    {isActive && (
                        <motion.div className="h-full bg-gradient-to-r from-amber-400 to-red-500 origin-left"
                            key={`timer-${player.id}`}
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 30, ease: 'linear' }}
                        />
                    )}
                </AnimatePresence>
            </div>
    
            <div className="flex items-stretch justify-between gap-3 mb-4">
                
                <button onClick={handleFold} 
                    className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg
                    bg-gradient-to-b from-gray-700 to-gray-800 text-red-400 border border-white/5 hover:brightness-110 active:scale-95 transition-all">
                    Fold
                </button>
                
                <button onClick={handleCheckOrCall} 
                    className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg
                    bg-gradient-to-b from-blue-600 to-blue-700 text-white border-t border-blue-400 hover:brightness-110 active:scale-95 transition-all">
                    {canCheck ? 'Check' : `Call $${callAmount}`}
                </button>
                
                <button onClick={handleBetOrRaise} disabled={sanitizedBetAmount < minRaise} 
                    className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg
                    bg-gradient-to-b from-amber-400 to-amber-600 text-black border-t border-amber-300 hover:brightness-110 active:scale-95 transition-all">
                    {currentBet > 0 ? `Raise $${sanitizedBetAmount}` : `Bet $${sanitizedBetAmount}`}
                </button>
            </div>
    
            <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg">
                <div className="flex gap-2">
                    {quickBets.map(({label, value}) => (
                        <button key={label} onClick={() => setBetAmount(value)} 
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-xs font-bold rounded-md text-gray-200 transition-colors">
                            {label}
                        </button>
                    ))}
                </div>
                
                <input type="range" 
                    min={minRaise} 
                    max={player.chips + player.currentBet} 
                    step="10" 
                    value={betAmount} 
                    onChange={handleBetChange} 
                    className="flex-grow accent-amber-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                
                <div className="w-16 text-right font-mono font-bold text-amber-400">
                    ${sanitizedBetAmount}
                </div>
            </div>
          </div>
        </fieldset>
    );
};
