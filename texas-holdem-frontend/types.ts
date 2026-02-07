export interface Player {
  id: number;
  name: string;
  chips: number;
  hand: string[];
  currentBet: number;
  isFolded: boolean;
  isHuman: boolean;
  isAllIn: boolean;
  lastAction?: string | null;
}

export type GameStage = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'HAND_OVER';

export interface GameState {
  gameId: string;
  pot: number;
  communityCards: string[];
  activePlayerId: number | null;
  players: Player[];
  stage: GameStage;
  dealerId: number;
  smallBlindPlayerId: number;
  bigBlindPlayerId: number;
  betToCall: number;
  winners?: number[];
}

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';
