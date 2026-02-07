import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../types';

interface WinnerOverlayProps {
    winners: Player[];
    pot: number;
    isHumanWinner: boolean;
    onClose: () => void;
}

const Confetti: React.FC = () => {
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-sm"
                    style={{
                        left: `${p.x}%`,
                        top: '-20px',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                    }}
                    initial={{ y: 0, opacity: 1, rotate: 0 }}
                    animate={{
                        y: '120vh',
                        opacity: [1, 1, 0],
                        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </div>
    );
};

export const WinnerOverlay: React.FC<WinnerOverlayProps> = ({
    winners,
    pot,
    isHumanWinner,
    onClose,
}) => {
    const winnerNames = winners.map((w) => w.name).join(' & ');
    const shareAmount = Math.floor(pot / winners.length);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                {isHumanWinner && <Confetti />}

                <motion.div
                    className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border border-yellow-500/30 max-w-md mx-4"
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 50 }}
                    transition={{ type: 'spring', damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Trophy icon */}
                    <motion.div
                        className="text-6xl text-center mb-4"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                    >
                        {isHumanWinner ? '🏆' : '🎲'}
                    </motion.div>

                    {/* Winner announcement */}
                    <motion.h2
                        className="text-2xl md:text-3xl font-bold text-center mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {isHumanWinner ? 'You Win!' : `${winnerNames} Wins!`}
                    </motion.h2>

                    {/* Pot amount */}
                    <motion.div
                        className="text-center mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <span className="text-gray-400 text-sm">Pot Won</span>
                        <div className="text-3xl font-bold text-green-400">${shareAmount}</div>
                        {winners.length > 1 && (
                            <span className="text-gray-500 text-xs">(Split {winners.length} ways)</span>
                        )}
                    </motion.div>

                    {/* Winner cards display */}
                    {winners[0]?.hand && winners[0].hand[0] !== 'BACK' && (
                        <motion.div
                            className="flex justify-center gap-2 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            {winners[0].hand.map((card, i) => (
                                <div
                                    key={i}
                                    className="w-12 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-lg font-bold"
                                    style={{
                                        color: card.endsWith('H') || card.endsWith('D') ? '#dc2626' : '#111827',
                                    }}
                                >
                                    {card.slice(0, -1)}
                                    {card.endsWith('H') && '♥'}
                                    {card.endsWith('D') && '♦'}
                                    {card.endsWith('S') && '♠'}
                                    {card.endsWith('C') && '♣'}
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Continue button */}
                    <motion.button
                        className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl shadow-lg transition-all"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        onClick={onClose}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Continue
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
