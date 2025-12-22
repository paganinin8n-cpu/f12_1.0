
export type Role = 'user' | 'pro' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
  inventory: {
    doubles: number;
    superDoubles: number;
  };
  // New fields for User Creation
  cpf?: string;
  phone?: string;
  password?: string;
}

export type GameStatus = 'scheduled' | 'live' | 'finished' | 'cancelled';

export interface Game {
  id: string;
  roundId: string; // Changed from rodadaId
  teamA: string;
  teamB: string;
  date: string; // ISO UTC
  status: GameStatus;
  order: number;
  scoreA?: number | null;
  scoreB?: number | null;
}

export type RoundStatus = 'draft' | 'open' | 'closed' | 'settled';

export interface Round {
  id: string;
  title: string;
  startDate: string; // ISO UTC
  endDate: string; // ISO UTC
  status: RoundStatus;
  games: Game[];
}

export type Prediction = 'A' | 'Draw' | 'B';

export interface Selection {
  gameId: string;
  outcome: Prediction[]; // Array to support Doubles (2 selections) or Triples
  isDouble: boolean;
  isSuperDouble: boolean;
}

export interface Ticket {
  id: string;
  userId: string;
  roundId: string;
  selections: Selection[];
  baseStake: number;
  totalCost: number;
  status: 'pending' | 'paid' | 'won' | 'lost';
}

export interface Pool {
  id: string;
  title: string;
  creatorName: string;
  entryFee: number;
  participantsCount: number;
  participants: string[]; // Array of User IDs
  prizePool: number; // estimated
  status: 'open' | 'closed';
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  points: number;
  position: number;
  isPro: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Payment & Transaction Types
export interface Purchase {
  id: string;
  userId: string;
  packageType: string;
  priceCents: number;
  fichasAdded: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'PURCHASE' | 'BET_DEBIT' | 'BONUS_CONSUME' | 'REFUND' | 'BOLAO_ENTRY';
  fichasAmount: number;
  referenceId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
}

// System Visual Config
export interface SystemConfig {
    bannerTitle: string;
    bannerSubtitle: string;
    bannerButtonText: string;
}