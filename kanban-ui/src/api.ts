import type { Task, Activity } from './types';

const API_BASE = '/api';

export const api = {
  // Export base URL for direct fetch calls
  baseUrl: API_BASE,
  
  // List tasks with optional filters
  async listTasks(params?: { status?: string; skills?: string }): Promise<{ tasks: Task[]; count: number }> {
    const url = new URL(`${API_BASE}/tasks`, window.location.origin);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.skills) url.searchParams.set('skills', params.skills);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  // Get single task
  async getTask(id: string): Promise<{ task: Task }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error('Task not found');
    return res.json();
  },

  // Create new task
  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    skills_required?: string[];
    created_by: string;
  }): Promise<{ task: Task }> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  // Update a task
  async updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    skills_required?: string[];
  }): Promise<{ task: Task }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  // Claim a task
  async claimTask(id: string, agentId: string): Promise<{ task: Task }> {
    const res = await fetch(`${API_BASE}/tasks/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to claim task');
    }
    return res.json();
  },

  // Complete a task
  async completeTask(id: string, agentId: string, output?: unknown): Promise<{ task: Task }> {
    const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-agent-id': agentId,
      },
      body: JSON.stringify({ output }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete task');
    }
    return res.json();
  },

  // Block a task
  async blockTask(id: string, agentId: string, reason: string): Promise<{ task: Task }> {
    const res = await fetch(`${API_BASE}/tasks/${id}/block`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-agent-id': agentId,
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to block task');
    }
    return res.json();
  },

  // List activities
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
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },
};
