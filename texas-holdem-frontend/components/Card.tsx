import React from 'react';

interface CardProps {
  card: string;
  small?: boolean;
}

const SUIT_STYLES: { [key: string]: { color: string; symbol: string } } = {
  H: { color: 'text-red-600', symbol: '♥' },
  D: { color: 'text-red-600', symbol: '♦' },
  S: { color: 'text-gray-900', symbol: '♠' },
  C: { color: 'text-gray-900', symbol: '♣' },
};

export const Card: React.FC<CardProps> = ({ card, small = false }) => {
  if (card === 'BACK') {
    const sizeClasses = small ? 'w-10 h-14' : 'w-16 h-24 sm:w-20 sm:h-28';
    return (
      <div 
        className={`${sizeClasses} relative rounded-md shadow-xl border-2 border-white bg-blue-900`}
        style={{
            backgroundImage: `repeating-linear-gradient(45deg, #1e3a8a 0, #1e3a8a 2px, #172554 2px, #172554 4px)`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="absolute inset-1 border border-blue-400/30 rounded-sm"></div>
      </div>
    );
  }

  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  const styles = SUIT_STYLES[suit];

  if (small) {
    return (
      <div className="w-10 h-14 bg-white rounded-md shadow-md flex flex-col items-center justify-center border border-gray-200">
        <span className={`text-sm font-bold ${styles.color}`}>{rank}</span>
        <span className={`text-base leading-none ${styles.color}`}>{styles.symbol}</span>
      </div>
    );
  }

  return (
    <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg shadow-2xl flex flex-col justify-between p-1.5 relative overflow-hidden transition-transform hover:-translate-y-1 border border-gray-200">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

      <div className={`flex flex-col items-center leading-none ${styles.color}`}>
        <span className="font-bold text-lg">{rank}</span>
        <span className="text-sm">{styles.symbol}</span>
      </div>

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl ${styles.color} opacity-90`}>
        {styles.symbol}
      </div>

      <div className={`flex flex-col items-center leading-none transform rotate-180 ${styles.color}`}>
        <span className="font-bold text-lg">{rank}</span>
        <span className="text-sm">{styles.symbol}</span>
      </div>
    </div>
  );
};
