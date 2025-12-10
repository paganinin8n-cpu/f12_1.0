import { User, Round, Pool, LogEntry, Game } from '../types';

const API_URL = 'http://localhost:3001/api';

// Helper genérico para requisições
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na requisição: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // --- AUTH ---
  login: (email: string, password: string): Promise<User> => {
    return request<User>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: (userData: Partial<User>): Promise<User> => {
    return request<User>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // --- USERS ---
  getUsers: (): Promise<User[]> => {
    return request<User[]>('/users');
  },

  updateUser: (id: string, data: Partial<User>): Promise<User> => {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- ROUNDS ---
  getRounds: (): Promise<Round[]> => {
    return request<Round[]>('/rounds');
  },

  createRound: (data: Partial<Round>): Promise<Round> => {
    return request<Round>('/rounds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Note: Backend server.ts needs a PUT /rounds/:id route for this to work fully.
  // Using POST for creation is defined, but editing needs backend support.
  // For now, Admin uses this to save edits if supported.
  updateRound: (id: string, data: Partial<Round>): Promise<Round> => {
     // Fallback: In a full implementation, you'd have PUT /rounds/:id
     // For now, we might reuse POST or assuming logic in backend.
     // We will stick to the provided server routes structure where possible.
     return request<Round>(`/rounds/${id}`, { // Requires backend update
        method: 'PUT', 
        body: JSON.stringify(data) 
     });
  },

  // --- POOLS ---
  getPools: (): Promise<Pool[]> => {
    return request<Pool[]>('/pools');
  },

  createPool: (data: Partial<Pool> & { creatorId: string }): Promise<Pool> => {
    return request<Pool>('/pools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  joinPool: (poolId: string, userId: string): Promise<Pool> => {
    return request<Pool>(`/pools/${poolId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // --- LOGS ---
  getLogs: (): Promise<LogEntry[]> => {
    return request<LogEntry[]>('/logs');
  },

  createLog: (log: Partial<LogEntry>): Promise<void> => {
    return request<void>('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }
};
