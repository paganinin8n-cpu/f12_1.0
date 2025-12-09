import { Round, Game, User } from '../types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Demo User',
  email: 'user@fantasy12.com',
  role: 'user',
  balance: 150.00,
  inventory: {
    doubles: 0,
    superDoubles: 0
  }
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
  }
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
  }
};

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
    rodadaId: roundId,
    teamA: match[0],
    teamB: match[1],
    date: new Date(Date.now() + 86400000 * (index % 3 + 1)).toISOString(), // Future dates
    status: 'scheduled',
    order: index + 1
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

export const getActiveRound = (): Round => MOCK_ROUNDS[0];