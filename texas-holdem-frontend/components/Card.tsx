import React from 'react';

interface CardProps {
  card: string;
  small?: boolean;
}

const SUIT_STYLES: { [key: string]: { color: string; symbol: string; shadow: string } } = {
  H: { color: 'text-red-500', symbol: '♥', shadow: 'drop-shadow(0 2px 8px rgba(239,68,68,0.18))' },
  D: { color: 'text-red-500', symbol: '♦', shadow: 'drop-shadow(0 2px 6px rgba(239,68,68,0.12))' },
  S: { color: 'text-gray-900', symbol: '♠', shadow: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' },
  C: { color: 'text-gray-900', symbol: '♣', shadow: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' },
};

export const Card: React.FC<CardProps> = ({ card, small = false }) => {
  if (card === 'BACK') {
    const sizeClasses = small ? 'w-12 h-16' : 'w-20 h-28';
    return (
      <div className={`${sizeClasses} card card-small flex items-center justify-center`} style={{ background: 'linear-gradient(180deg,#0b2b2a,#0b2b2a)', borderRadius: small ? 8 : 10 }}>
          <div style={{ width: '70%', height: '70%', borderRadius: 6, border: '2px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg,#082927,#063b3a)' }} />
      </div>
    );
  }

  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  const styles = SUIT_STYLES[suit];

  if (small) {
    return (
      <div className={`w-12 h-16 card card-small p-1 flex flex-col justify-between relative`} >
        <div style={{ color: styles.color === 'text-red-500' ? '#dc2626' : '#111827', fontWeight: 700 }}>
          <div className="absolute top-1 left-1 text-sm">{rank}</div>
          <div className="absolute top-5 left-1 text-xs">{styles.symbol}</div>
        </div>
        <div className={`self-end font-bold text-2xl`} style={{ color: styles.color === 'text-red-500' ? '#dc2626' : '#111827', filter: styles.shadow }}>
          {styles.symbol}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-16 h-24 sm:w-20 sm:h-28 card p-2 flex flex-col justify-between relative`}>
      <div style={{ color: styles.color === 'text-red-500' ? '#dc2626' : '#111827', fontWeight: 800 }}>
        <div className="absolute top-2 left-3 text-lg sm:text-xl">{rank}</div>
        <div className="absolute top-8 left-3 text-lg sm:text-xl">{styles.symbol}</div>
      </div>
      <div className={`self-center font-extrabold text-4xl sm:text-5xl`} style={{ color: styles.color === 'text-red-500' ? '#dc2626' : '#111827' }}>
        {styles.symbol}
      </div>
      <div style={{ color: styles.color === 'text-red-500' ? '#dc2626' : '#111827', fontWeight: 800 }}>
        <div className="absolute bottom-2 right-3 transform rotate-180 text-lg sm:text-xl">{rank}</div>
        <div className="absolute bottom-8 right-3 transform rotate-180 text-lg sm:text-xl">{styles.symbol}</div>
      </div>
    </div>
  );
};
