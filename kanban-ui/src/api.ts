import type { Task, Activity, User, AuthTokens } from './types';

const API_BASE = '/api';

const ACCESS_TOKEN_KEY = 'kanban_access_token';
const REFRESH_TOKEN_KEY = 'kanban_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Track if a token refresh is in progress to prevent multiple simultaneous refreshes
let refreshPromise: Promise<AuthTokens | null> | null = null;

// Authenticated fetch wrapper with automatic token refresh
async function authFetch(url: string | URL, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  let res = await fetch(url, { ...options, headers });
  
  // If 401, try to refresh tokens
  if (res.status === 401 && getRefreshToken()) {
    const newTokens = await tryRefreshTokens();
    if (newTokens) {
      // Retry with new token
      headers.set('Authorization', `Bearer ${newTokens.accessToken}`);
      res = await fetch(url, { ...options, headers });
    }
  }
  
  return res;
}

// Try to refresh tokens, returns new tokens or null
async function tryRefreshTokens(): Promise<AuthTokens | null> {
  // If already refreshing, wait for that to complete
  if (refreshPromise) {
    return refreshPromise;
  }
  
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!res.ok) {
        clearTokens();
        return null;
      }
      
      const data = await res.json();
      setTokens(data.tokens);
      return data.tokens as AuthTokens;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

export const api = {
  baseUrl: API_BASE,
  
  async checkStatus(): Promise<{ setupRequired: boolean }> {
    const res = await fetch(`${API_BASE}/auth/status`);
    if (!res.ok) throw new Error('Failed to check auth status');
    return res.json();
  },

  async setup(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const res = await fetch(`${API_BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to setup admin');
    }
    const data = await res.json();
    setTokens(data.tokens);
    return data;
  },

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await res.json();
    setTokens(data.tokens);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authFetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    clearTokens();
  },

  async refreshTokens(): Promise<AuthTokens | null> {
    return tryRefreshTokens();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await authFetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  },

  async listUsers(): Promise<{ users: User[] }> {
    const res = await authFetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async createUser(data: { email: string; password: string; role: 'admin' | 'user' }): Promise<{ user: User }> {
    const res = await authFetch(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
  },

  async updateUser(id: string, data: { email?: string; password?: string; role?: 'admin' | 'user' }): Promise<{ user: User }> {
    const res = await authFetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
  },

  async deleteUser(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }
  },

  async listTasks(params?: { status?: string; skills?: string }): Promise<{ tasks: Task[]; count: number }> {
    const url = new URL(`${API_BASE}/tasks`, window.location.origin);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.skills) url.searchParams.set('skills', params.skills);
    
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTask(id: string): Promise<{ task: Task }> {
    const res = await authFetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error('Task not found');
    return res.json();
  },

  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    skills_required?: string[];
    created_by: string;
  }): Promise<{ task: Task }> {
    const res = await authFetch(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    skills_required?: string[];
  }): Promise<{ task: Task }> {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async claimTask(id: string, agentId: string): Promise<{ task: Task }> {
    const res = await authFetch(`${API_BASE}/tasks/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to claim task');
    }
    return res.json();
  },

  async completeTask(id: string, agentId: string, output?: unknown): Promise<{ task: Task }> {
    const res = await authFetch(`${API_BASE}/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'x-agent-id': agentId },
      body: JSON.stringify({ output }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete task');
    }
    return res.json();
  },

  async blockTask(id: string, agentId: string, reason: string): Promise<{ task: Task }> {
    const res = await authFetch(`${API_BASE}/tasks/${id}/block`, {
      method: 'POST',
      headers: { 'x-agent-id': agentId },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to block task');
    }
    return res.json();
  },

  async listActivities(params?: { 
    limit?: number; 
    agent_id?: string;
    task_id?: string;
    since?: string;
  }): Promise<{ activities: Activity[]; count: number; total: number }> {
    const url = new URL(`${API_BASE}/activities`, window.location.origin);
    if (params?.limit) url.searchParams.set('limit', String(params.limit));
    if (params?.agent_id) url.searchParams.set('agent_id', params.agent_id);
    if (params?.task_id) url.searchParams.set('task_id', params.task_id);
    if (params?.since) url.searchParams.set('since', params.since);
    
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },
};
