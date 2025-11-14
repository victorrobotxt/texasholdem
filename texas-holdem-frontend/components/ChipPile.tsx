import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChipPileProps {
  amount: number;
  size?: 'small' | 'large';
}
interface ChipProps {
  value: number;
  bodyColor: string;
  stripeColor: string;
  textColor: string;
}

const CHIP_DENOMINATIONS: ChipProps[] = [
    { value: 100, bodyColor: '#1f2937', stripeColor: '#ffffff', textColor: '#ffffff' }, // Black
    { value: 25, bodyColor: '#059669', stripeColor: '#ffffff', textColor: '#ffffff' }, // Green
    { value: 10, bodyColor: '#2563eb', stripeColor: '#ffffff', textColor: '#ffffff' }, // Blue
    { value: 5, bodyColor: '#ef4444', stripeColor: '#ffffff', textColor: '#ffffff' }, // Red
    { value: 1, bodyColor: '#f3f4f6', stripeColor: '#4b5563', textColor: '#111827' }, // White
];

const SingleChip: React.FC<ChipProps & { isTop: boolean; sizeScale?: number }> = ({ bodyColor, stripeColor, textColor, value, isTop, sizeScale = 1 }) => {
    const gradientId = `grad-${value}-${bodyColor.replace('#','')}`;
    const size = Math.round(48 * sizeScale);
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
            <defs>
                <radialGradient id={gradientId} cx="45%" cy="35%" r="55%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.45)' }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(0,0,0,0.25)' }} />
                </radialGradient>
            </defs>

            <circle cx="50" cy="55" r="48" fill="#000" opacity="0.45" />
            <circle cx="50" cy="50" r="48" fill={bodyColor} stroke="#111827" strokeWidth="1" />
            <g>
                {Array.from({ length: 4 }).map((_, i) => (
                    <rect key={i} x="44" y="0" width="12" height="100" fill={stripeColor} opacity="0.9" transform={`rotate(${i * 45 + 22.5} 50 50)`} />
                ))}
            </g>
            <circle cx="50" cy="50" r="36" fill={bodyColor} />
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx="50" cy="50" r="36" fill="none" stroke={stripeColor} strokeWidth="1.6" opacity="0.9" />
            <circle cx="50" cy="50" r="48" fill={`url(#${gradientId})`} style={{ mixBlendMode: 'soft-light', opacity: 0.9 }} />
            {isTop && (
                <text
                    x="50"
                    y="50"
                    dy="0.35em"
                    fontSize="24"
                    fontWeight="700"
                    fill={textColor}
                    textAnchor="middle"
                    fontFamily="Inter, Arial, sans-serif"
                    stroke="#000"
                    strokeWidth="0.6"
                    strokeOpacity="0.3"
                >
                    {value}
                </text>
            )}
        </svg>
    );
};

const getChipStack = (amount: number): ChipProps[] => {
  if (amount <= 0) return [];
  const MAX_CHIPS_IN_STACK = 10;
  let remaining = amount;
  const chips: ChipProps[] = [];
  for (const denom of CHIP_DENOMINATIONS) {
    const count = Math.floor(remaining / denom.value);
    for (let i = 0; i < count; i++) {
      chips.push(denom);
    }
    remaining %= denom.value;
  }
  if (remaining > 0) {
    chips.push(CHIP_DENOMINATIONS[CHIP_DENOMINATIONS.length - 1]);
  }
  return chips.slice(0, MAX_CHIPS_IN_STACK).reverse();
};

export const ChipPile: React.FC<ChipPileProps> = ({ amount, size = 'large' }) => {
  const chipStack = getChipStack(amount);
  if (chipStack.length === 0) return null;
  const scale = size === 'small' ? 0.62 : 1;  // Scale down for stacks
  return (
    <div className="chip-stack-wrap relative flex items-center justify-center" style={{ width: 60 * scale, height: 60 * scale }}>
      <AnimatePresence>
        <motion.div
          className="absolute"
          style={{ transform: `scale(${scale})` }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
        >
          {chipStack.map((chip, i) => {
            const isTop = i === chipStack.length - 1;
            return (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  transform: `translateY(-${i * 6}px)`,
                  zIndex: i,
                  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.45))',
                }}
              >
                <SingleChip {...chip} isTop={isTop} />
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
