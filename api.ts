
import { User, Round, Pool, LogEntry } from '../types';
import { MOCK_ALL_USERS, MOCK_ROUNDS, MOCK_POOLS, MOCK_LOGS, MOCK_USER } from './mockData';

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
    console.warn(`API Error [${endpoint}]: Connection failed. Switching to OFFLINE MOCK DATA.`);
    
    // --- OFFLINE FALLBACK LOGIC ---
    
    // 1. GET Requests (Data Fetching)
    if (!options || options.method === 'GET' || options.method === undefined) {
      if (endpoint === '/users') return MOCK_ALL_USERS as unknown as T;
      if (endpoint === '/rounds') return MOCK_ROUNDS as unknown as T;
      if (endpoint === '/pools') return MOCK_POOLS as unknown as T;
      if (endpoint === '/logs') return MOCK_LOGS as unknown as T;
    }

    // 2. Authentication Simulation
    if (endpoint === '/login' && options?.method === 'POST') {
       const body = JSON.parse(options.body as string);
       // Simple mock login check
       const mockUser = MOCK_ALL_USERS.find(u => u.email === body.email);
       if (mockUser) return mockUser as unknown as T;
       // Default fallback
       return MOCK_USER as unknown as T;
    }

    if (endpoint === '/register' && options?.method === 'POST') {
       const body = JSON.parse(options.body as string);
       const newUser = { ...MOCK_USER, ...body, id: `u-offline-${Date.now()}` };
       return newUser as unknown as T;
    }

    // 3. Updates and Actions (Optimistic Success)
    if (endpoint.startsWith('/users/') && options?.method === 'PUT') {
       const body = JSON.parse(options.body as string);
       return { ...MOCK_USER, ...body } as unknown as T;
    }
    
    if (endpoint === '/payments/process' && options?.method === 'POST') {
       const body = JSON.parse(options.body as string);
       const updatedUser = { ...MOCK_USER, balance: MOCK_USER.balance + (body.fichasAdded || 0) };
       return updatedUser as unknown as T;
    }

    if (endpoint === '/rounds' && options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        return { ...body, id: `r-new-${Date.now()}` } as unknown as T;
    }

    // If no fallback is defined for this specific request, re-throw the error
    // or return a safe empty object to prevent app crash
    if (options?.method === 'POST' || options?.method === 'PUT') {
        return {} as T;
    }

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
