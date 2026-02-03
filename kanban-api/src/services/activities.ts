import { randomUUID } from 'crypto';
import { knex } from '../db/index.js';
import { Activity, ActivityQuery, ActivityType } from '../models/activity.js';

// Log a new activity
export const logActivity = async (
  type: ActivityType,
  agentId: string,
  taskId?: string,
  taskTitle?: string,
  details?: Record<string, unknown>
): Promise<Activity> => {
  const now = new Date().toISOString();
  const activity: Activity = {
    id: randomUUID(),
    type,
    agent_id: agentId,
    task_id: taskId,
    task_title: taskTitle,
    details,
    created_at: now,
  };

  await knex('activities').insert({
    ...activity,
    details: details ? JSON.stringify(details) : null,
  });

  return activity;
};

// List activities with filters
export const listActivities = async (query: ActivityQuery = {}): Promise<Activity[]> => {
  const { limit = 50, offset = 0, agent_id, task_id, type, since } = query;

  let q = knex('activities')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  if (agent_id) {
    q = q.where('agent_id', agent_id);
  }
  if (task_id) {
    q = q.where('task_id', task_id);
  }
  if (type) {
    q = q.where('type', type);
  }
  if (since) {
    q = q.where('created_at', '>', since);
  }

  const rows = await q;

  return rows.map((row: any) => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : undefined,
  }));
};

// Get activity count (for pagination)
export const countActivities = async (query: Omit<ActivityQuery, 'limit' | 'offset'> = {}): Promise<number> => {
  const { agent_id, task_id, type, since } = query;

  let q = knex('activities').count('* as count');

  if (agent_id) {
    q = q.where('agent_id', agent_id);
  }
  if (task_id) {
    q = q.where('task_id', task_id);
  }
  if (type) {
    q = q.where('type', type);
  }
  if (since) {
    q = q.where('created_at', '>', since);
  }

  const result = await q.first();
  return (result as any)?.count || 0;
};
