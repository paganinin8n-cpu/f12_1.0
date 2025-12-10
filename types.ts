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
}

export type GameStatus = 'scheduled' | 'live' | 'finished' | 'cancelled';

export interface Game {
  id: string;
  rodadaId: string;
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