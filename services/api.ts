import { User, Round, Pool, LogEntry } from '../types';

// Configuração da URL da API
const meta = import.meta as any;
const env = (meta && meta.env) || {};
const API_URL = env.VITE_API_URL || 'http://localhost:3001/api';

console.log('API Client configurado para:', API_URL);

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição (${response.status}): ${response.statusText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
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

  updateRound: (id: string, data: Partial<Round>): Promise<Round> => {
    return request<Round>(`/rounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  createLog: (data: Partial<LogEntry>): Promise<void> => {
    return request<void>('/logs', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }),
    });
  },

  // --- PAYMENTS ---
  processPayment: (data: { userId: string, packageType: string, priceCents: number, fichasAdded: number }): Promise<User> => {
    return request<User>('/payments/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};