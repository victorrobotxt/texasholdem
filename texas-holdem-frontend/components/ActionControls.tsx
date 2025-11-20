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
        { label: '1/2 Pot', value: Math.max(minRaise, Math.floor((pot + currentBet) / 2)) },
        { label: 'Pot', value: Math.max(minRaise, pot + currentBet) },
        { label: 'All In', value: player.chips + player.currentBet },
    ], [pot, player, minRaise, currentBet]);

    useEffect(() => {
        setBetAmount(minRaise);
    }, [minRaise]);
    
    const handleActionWithVibration = (actionFn: () => void) => {
        navigator.vibrate?.(50);
        actionFn();
    };

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBetAmount(parseInt(e.target.value, 10) || 0);
    };
    
    const handleFold = () => handleActionWithVibration(() => onAction('fold'));
    const handleCheckOrCall = () => handleActionWithVibration(() => onAction(canCheck ? 'check' : 'call'));
    const handleBetOrRaise = () => {
        // Use the sanitized amount (minRaise <= amount <= stack)
        const finalAmount = Math.max(minRaise, Math.min(betAmount, player.chips + player.currentBet));
        
        // Determine action: raise if calling is required AND player has chips remaining, otherwise bet.
        const actionType = (currentBet > 0 && callAmount < player.chips) ? 'raise' : 'bet';
        
        handleActionWithVibration(() => onAction(actionType, finalAmount));
    };
  
    const sanitizedBetAmount = Math.min(betAmount, player.chips + player.currentBet);

    return (
        <fieldset 
            disabled={!isActive} 
            className="w-full max-w-4xl transition-opacity duration-300 disabled:opacity-50"
        >
          <div className="flex flex-col items-center justify-center space-y-3 p-3 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-yellow-600/30">
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <AnimatePresence>
                    {isActive && (
                        <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-red-500 origin-left"
                            key={`timer-${player.id}`}
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 30, ease: 'linear' }}
                        />
                    )}
                </AnimatePresence>
            </div>
    
            <div className="flex flex-wrap items-stretch justify-center gap-3 w-full p-2">
                
                {/* 1. FOLD BUTTON */}
                <button onClick={handleFold} 
                    className="flex-grow sm:flex-grow-0 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all active:scale-95 shadow-lg
                    bg-gradient-to-b from-gray-700 to-gray-900 text-red-500 border-t border-gray-600 border-b-4 border-black hover:brightness-110">
                    Fold
                </button>
                
                {/* 2. CHECK / CALL BUTTON */}
                <button onClick={handleCheckOrCall} 
                    className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all active:scale-95 shadow-lg text-white border-t border-blue-400 border-b-4 border-blue-900 hover:brightness-110
                    ${canCheck 
                        ? 'bg-gradient-to-b from-blue-500 to-blue-700' 
                        : 'bg-gradient-to-b from-blue-600 to-blue-800'}`}>
                    {canCheck ? 'Check' : `Call $${callAmount}`}
                </button>
                
                {/* 3. BET / RAISE BUTTON */}
                <button onClick={handleBetOrRaise} disabled={sanitizedBetAmount < minRaise} 
                    className="flex-grow sm:flex-grow-0 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all active:scale-95 shadow-lg
                    bg-gradient-to-b from-amber-400 to-amber-600 text-black border-t border-amber-300 border-b-4 border-amber-800 hover:brightness-110 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed">
                    {currentBet > 0 ? `Raise $${sanitizedBetAmount}` : `Bet $${sanitizedBetAmount}`}
                </button>
            </div>
    
            <div className="w-full flex flex-col items-center space-y-2 pt-1">
                <input type="range" 
                    min={minRaise} 
                    max={player.chips + player.currentBet} 
                    step="10" 
                    value={betAmount} 
                    onChange={handleBetChange} 
                    className="w-full max-w-md accent-yellow-500 disabled:cursor-not-allowed" />
                
                <div className="flex items-center justify-center space-x-3">
                    {quickBets.map(({label, value}) => (
                        <button key={label} onClick={() => setBetAmount(value)} 
                            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-full shadow-md transition-all hover:scale-105 border border-amber-900 disabled:cursor-not-allowed disabled:hover:scale-100">
                            {label}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </fieldset>
    );
};
