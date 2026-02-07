import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HandStrengthProps {
    hand: string[];
    communityCards: string[];
}

const RANK_VALUES: { [key: string]: number } = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const RANK_NAMES: { [key: string]: string } = {
    '2': 'Twos', '3': 'Threes', '4': 'Fours', '5': 'Fives', '6': 'Sixes',
    '7': 'Sevens', '8': 'Eights', '9': 'Nines', '10': 'Tens',
    'J': 'Jacks', 'Q': 'Queens', 'K': 'Kings', 'A': 'Aces',
};

interface HandResult {
    rank: number;
    name: string;
    description: string;
    color: string;
}

function parseCard(card: string): { rank: string; suit: string } | null {
    if (!card || card === 'BACK') return null;
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    return { rank, suit };
}

function evaluateHand(hand: string[], community: string[]): HandResult {
    const allCards = [...hand, ...community]
        .map(parseCard)
        .filter((c): c is { rank: string; suit: string } => c !== null);

    if (allCards.length < 2) {
        return { rank: 0, name: 'Waiting...', description: '', color: 'text-gray-400' };
    }

    const rankCounts: { [key: string]: number } = {};
    const suitCounts: { [key: string]: number } = {};
    const rankValues: number[] = [];

    for (const card of allCards) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        rankValues.push(RANK_VALUES[card.rank] || 0);
    }

    const pairs = Object.entries(rankCounts).filter(([, count]) => count === 2);
    const trips = Object.entries(rankCounts).filter(([, count]) => count === 3);
    const quads = Object.entries(rankCounts).filter(([, count]) => count === 4);
    const hasFlush = Object.values(suitCounts).some((count) => count >= 5);

    const uniqueRanks = [...new Set(rankValues)].sort((a, b) => b - a);
    let hasStraight = false;
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
            hasStraight = true;
            break;
        }
    }
    if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) &&
        uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
        hasStraight = true;
    }

    if (hasStraight && hasFlush) {
        return { rank: 9, name: 'Straight Flush!', description: 'Incredible!', color: 'text-fuchsia-400' };
    }
    if (quads.length > 0) {
        return { rank: 8, name: 'Four of a Kind!', description: `Quad ${RANK_NAMES[quads[0][0]]}`, color: 'text-purple-400' };
    }
    if (trips.length > 0 && pairs.length > 0) {
        return { rank: 7, name: 'Full House!', description: `${RANK_NAMES[trips[0][0]]} full`, color: 'text-pink-400' };
    }
    if (hasFlush) {
        return { rank: 6, name: 'Flush', description: 'Five of same suit', color: 'text-blue-400' };
    }
    if (hasStraight) {
        return { rank: 5, name: 'Straight', description: 'Five in a row', color: 'text-cyan-400' };
    }
    if (trips.length > 0) {
        return { rank: 4, name: 'Three of a Kind', description: `Trip ${RANK_NAMES[trips[0][0]]}`, color: 'text-green-400' };
    }
    if (pairs.length >= 2) {
        const sortedPairs = pairs.sort((a, b) => RANK_VALUES[b[0]] - RANK_VALUES[a[0]]);
        return { rank: 3, name: 'Two Pair', description: `${RANK_NAMES[sortedPairs[0][0]]} & ${RANK_NAMES[sortedPairs[1][0]]}`, color: 'text-yellow-400' };
    }
    if (pairs.length === 1) {
        return { rank: 2, name: 'Pair', description: `Pair of ${RANK_NAMES[pairs[0][0]]}`, color: 'text-orange-400' };
    }

    const highCard = allCards.reduce((max, card) =>
        (RANK_VALUES[card.rank] || 0) > (RANK_VALUES[max.rank] || 0) ? card : max
    );
    return { rank: 1, name: 'High Card', description: `${highCard.rank} high`, color: 'text-gray-300' };
}

export const HandStrength: React.FC<HandStrengthProps> = ({ hand, communityCards }) => {
    const result = useMemo(() => evaluateHand(hand, communityCards), [hand, communityCards]);

    const strengthPercent = Math.min(100, (result.rank / 9) * 100);

    const getGradient = () => {
        if (result.rank >= 7) return 'from-fuchsia-500 to-purple-600';
        if (result.rank >= 5) return 'from-blue-500 to-cyan-500';
        if (result.rank >= 3) return 'from-green-500 to-emerald-500';
        if (result.rank >= 2) return 'from-yellow-500 to-orange-500';
        return 'from-gray-500 to-gray-600';
    };

    if (hand.length === 0 || hand[0] === 'BACK') {
        return null;
    }

    return (
        <motion.div
            className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700/50 min-w-[140px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between mb-1.5">
                <span className={`font-bold text-sm ${result.color}`}>{result.name}</span>
            </div>

            {result.description && (
                <div className="text-xs text-gray-400 mb-1.5">{result.description}</div>
            )}

            {/* Strength bar */}
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full bg-gradient-to-r ${getGradient()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${strengthPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </motion.div>
    );
};
