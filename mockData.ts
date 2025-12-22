
import { Round, Game, User, LogEntry, Pool } from '../types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Demo User',
  email: 'user@fantasy12.com',
  role: 'user',
  balance: 150.00,
  inventory: {
    doubles: 0,
    superDoubles: 0
  },
  cpf: '123.456.789-00'
};

export const MOCK_PRO_USER: User = {
  id: 'u2',
  name: 'Pro Player',
  email: 'pro@fantasy12.com',
  role: 'pro',
  balance: 5000.00,
  inventory: {
    doubles: 5, // Example: started with some bought items
    superDoubles: 2
  },
  cpf: '987.654.321-99'
};

export const MOCK_ADMIN: User = {
  id: 'u3',
  name: 'Admin',
  email: 'admin@fantasy12.com',
  role: 'admin',
  balance: 0,
  inventory: {
    doubles: 999,
    superDoubles: 999
  },
  cpf: '000.000.000-00'
};

export const MOCK_ALL_USERS: User[] = [
  MOCK_USER,
  MOCK_PRO_USER,
  MOCK_ADMIN,
  {
    id: 'u4',
    name: 'Jorge Jesus',
    email: 'mister@fantasy12.com',
    role: 'pro',
    balance: 1200,
    inventory: { doubles: 10, superDoubles: 5 },
    cpf: '111.222.333-44'
  },
  {
    id: 'u5',
    name: 'Abel Ferreira',
    email: 'abel@fantasy12.com',
    role: 'user',
    balance: 50,
    inventory: { doubles: 0, superDoubles: 0 },
    cpf: '555.666.777-88'
  }
];

// Helper to generate games for a round
const generateGames = (roundId: string): Game[] => {
  const teams = [
    ['Flamengo', 'Vasco'], ['Palmeiras', 'Corinthians'], ['São Paulo', 'Santos'],
    ['Grêmio', 'Inter'], ['Cruzeiro', 'Atlético-MG'], ['Bahia', 'Vitória'],
    ['Fluminense', 'Botafogo'], ['Athletico-PR', 'Coritiba'], ['Fortaleza', 'Ceará'],
    ['Sport', 'Náutico'], ['Goiás', 'Vila Nova'], ['Paysandu', 'Remo']
  ];

  return teams.map((match, index) => ({
    id: `g-${roundId}-${index}`,
    roundId: roundId, // Updated from rodadaId
    teamA: match[0],
    teamB: match[1],
    date: new Date(Date.now() + 86400000 * (index % 3 + 1)).toISOString(), // Future dates
    status: 'scheduled',
    order: index + 1,
    scoreA: null,
    scoreB: null
  }));
};

export const MOCK_ROUNDS: Round[] = [
  {
    id: 'r-2025-10',
    title: 'Rodada #10 - Brasileirão',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'open',
    games: generateGames('r-2025-10')
  },
  {
    id: 'r-2025-11',
    title: 'Rodada #11 - Copa do Brasil',
    startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 12).toISOString(),
    status: 'draft',
    games: generateGames('r-2025-11')
  }
];

export const MOCK_POOLS: Pool[] = [
  {
    id: 'p1',
    title: 'Bolão da Firma',
    creatorName: 'Admin',
    entryFee: 10,
    participantsCount: 5,
    participants: ['u1', 'u2', 'u3'],
    prizePool: 50,
    status: 'open',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: 'p2',
    title: 'Liga dos Campeões',
    creatorName: 'Pro Player',
    entryFee: 20,
    participantsCount: 12,
    participants: ['u2'],
    prizePool: 240,
    status: 'open',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
  }
];

export const MOCK_LOGS: LogEntry[] = [
  { id: 'l1', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), userId: 'u1', userName: 'Demo User', action: 'Aposta Realizada', details: 'Rodada #10 - 12 Jogos', type: 'success' },
  { id: 'l2', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), userId: 'u2', userName: 'Pro Player', action: 'Compra Loja', details: 'Pacote 100 Fichas', type: 'info' },
  { id: 'l3', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), userId: 'u5', userName: 'Abel Ferreira', action: 'Login', details: 'Acesso via Mobile', type: 'info' },
  { id: 'l4', timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), userId: 'u3', userName: 'Admin', action: 'Edição Rodada', details: 'Atualizou placar Jogo 1', type: 'warning' },
  { id: 'l5', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), userId: 'u1', userName: 'Demo User', action: 'Erro Pagamento', details: 'Falha na transação Gateway', type: 'error' },
];

export const getActiveRound = (): Round => MOCK_ROUNDS[0];
