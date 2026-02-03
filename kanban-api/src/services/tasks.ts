import { randomUUID } from 'crypto';
import { knex } from '../db/index.js';
import type { Task, CreateTask, UpdateTask, TaskQuery, UsageData } from '../models/task.js';
import { logActivity } from './activities.js';

// Pure function to build a task object
export const buildTask = (input: CreateTask): Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id: string; created_at: string; updated_at: string } => {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status ?? 'backlog',
    priority: input.priority ?? 3,
    skills_required: input.skills_required ?? [],
    claimed_by: null,
    claimed_at: null,
    timeout_minutes: input.timeout_minutes ?? 30,
    parent_task_id: input.parent_task_id ?? null,
    output: null,
    blocked_reason: null,
    due_date: input.due_date ?? null,
    usage_input_tokens: null,
    usage_output_tokens: null,
    usage_model: null,
    usage_cost_usd: null,
    created_by: input.created_by,
    created_at: now,
    updated_at: now,
  };
};

// Serialize task for DB storage
const serializeForDb = (task: any) => ({
  ...task,
  skills_required: JSON.stringify(task.skills_required),
  output: task.output ? JSON.stringify(task.output) : null,
});

// Deserialize task from DB
const deserializeFromDb = (row: any): Task | null => {
  if (!row) return null;
  return {
    ...row,
    skills_required: JSON.parse(row.skills_required || '[]'),
    output: row.output ? JSON.parse(row.output) : null,
  };
};

// Create a new task
export const createTask = async (input: CreateTask): Promise<Task> => {
  const task = buildTask(input);
  await knex('tasks').insert(serializeForDb(task));
  
  // Log activity
  await logActivity('task_created', input.created_by, task.id, task.title, {
    status: task.status,
    priority: task.priority,
    skills_required: task.skills_required,
  });
  
  return task as Task;
};

// Get task by ID
export const getTaskById = async (id: string): Promise<Task | null> => {
  const row = await knex('tasks').where({ id }).first();
  return deserializeFromDb(row);
};

// Update a task
export const updateTask = async (id: string, updates: UpdateTask, agentId?: string): Promise<{ success: boolean; task?: Task; error?: string }> => {
  const existing = await getTaskById(id);
  if (!existing) {
    return { success: false, error: 'Task not found' };
  }

  const now = new Date().toISOString();
  const updateData: any = { updated_at: now };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    // Clear claimed_by when moving back to ready/backlog
    if (updates.status === 'ready' || updates.status === 'backlog') {
      updateData.claimed_by = null;
      updateData.claimed_at = null;
    }
  }
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.skills_required !== undefined) updateData.skills_required = JSON.stringify(updates.skills_required);
  if (updates.timeout_minutes !== undefined) updateData.timeout_minutes = updates.timeout_minutes;
  if (updates.blocked_reason !== undefined) updateData.blocked_reason = updates.blocked_reason;
  if (updates.due_date !== undefined) updateData.due_date = updates.due_date;

  await knex('tasks').where({ id }).update(updateData);
  const task = await getTaskById(id);
  
  // Log activity
  await logActivity('task_updated', agentId || 'system', id, task!.title, {
    changes: updates,
    from_status: existing.status,
    to_status: task!.status,
  });
  
  return { success: true, task: task! };
};

// Delete a task
export const deleteTask = async (id: string, agentId?: string): Promise<{ success: boolean; error?: string }> => {
  const existing = await getTaskById(id);
  if (!existing) {
    return { success: false, error: 'Task not found' };
  }
  
  await knex('tasks').where({ id }).delete();
  
  // Log activity
  await logActivity('task_deleted', agentId || 'system', id, existing.title);
  
  return { success: true };
};

// List tasks with filters
export const listTasks = async (query: TaskQuery): Promise<Task[]> => {
  let q = knex('tasks');
  
  if (query.status) {
    q = q.where('status', query.status);
  }
  
  if (query.skills) {
    // Filter by required skills (task must require at least one of the provided skills)
    const skills = query.skills.split(',').map(s => s.trim());
    q = q.where((builder) => {
      skills.forEach(skill => {
        builder.orWhereRaw("json_extract(skills_required, '$') LIKE ?", [`%"${skill}"%`]);
      });
    });
  }
  
  if (query.claimed_by) {
    q = q.where('claimed_by', query.claimed_by);
  }
  
  const rows = await q
    .orderBy('priority', 'desc')
    .orderBy('created_at', 'asc')
    .limit(query.limit ?? 50)
    .offset(query.offset ?? 0);
  
  return rows.map(deserializeFromDb).filter((t): t is Task => t !== null);
};

// Claim a task (atomic operation)
export const claimTask = async (taskId: string, agentId: string): Promise<{ success: boolean; task?: Task; error?: string }> => {
  const now = new Date().toISOString();
  
  // Atomic update: only claim if status is 'ready' and not already claimed
  const updated = await knex('tasks')
    .where({ id: taskId, status: 'ready', claimed_by: null })
    .update({
      status: 'in_progress',
      claimed_by: agentId,
      claimed_at: now,
      updated_at: now,
    });
  
  if (updated === 0) {
    const existing = await getTaskById(taskId);
    if (!existing) {
      return { success: false, error: 'Task not found' };
    }
    if (existing.status !== 'ready') {
      return { success: false, error: `Task is not ready (status: ${existing.status})` };
    }
    if (existing.claimed_by) {
      return { success: false, error: `Task already claimed by ${existing.claimed_by}` };
    }
    return { success: false, error: 'Failed to claim task' };
  }
  
  const task = await getTaskById(taskId);
  
  // Log activity
  await logActivity('task_claimed', agentId, taskId, task!.title);
  
  return { success: true, task: task! };
};

// Complete a task
export const completeTask = async (taskId: string, agentId: string, output?: unknown, usage?: UsageData): Promise<{ success: boolean; task?: Task; error?: string }> => {
  const now = new Date().toISOString();
  
  // Build update data
  const updateData: Record<string, unknown> = {
    status: 'done',
    output: output ? JSON.stringify(output) : null,
    updated_at: now,
  };
  
  // Add usage data if provided
  if (usage) {
    updateData.usage_input_tokens = usage.input_tokens;
    updateData.usage_output_tokens = usage.output_tokens;
    updateData.usage_model = usage.model;
    updateData.usage_cost_usd = usage.cost_usd ?? null;
  }
  
  // Only the claiming agent can complete
  const updated = await knex('tasks')
    .where({ id: taskId, status: 'in_progress', claimed_by: agentId })
    .update(updateData);
  
  if (updated === 0) {
    const existing = await getTaskById(taskId);
    if (!existing) {
      return { success: false, error: 'Task not found' };
    }
    if (existing.claimed_by !== agentId) {
      return { success: false, error: 'You are not the claiming agent' };
    }
    if (existing.status !== 'in_progress') {
      return { success: false, error: `Task is not in progress (status: ${existing.status})` };
    }
    return { success: false, error: 'Failed to complete task' };
  }
  
  const task = await getTaskById(taskId);
  
  // Log activity
  await logActivity('task_completed', agentId, taskId, task!.title, {
    has_output: !!output,
  });
  
  return { success: true, task: task! };
};

// Block a task
export const blockTask = async (taskId: string, agentId: string, reason: string): Promise<{ success: boolean; task?: Task; error?: string }> => {
  const now = new Date().toISOString();
  
  const updated = await knex('tasks')
    .where({ id: taskId, status: 'in_progress', claimed_by: agentId })
    .update({
      status: 'blocked',
      blocked_reason: reason,
      updated_at: now,
    });
  
  if (updated === 0) {
    const existing = await getTaskById(taskId);
    if (!existing) {
      return { success: false, error: 'Task not found' };
    }
    if (existing.claimed_by !== agentId) {
      return { success: false, error: 'You are not the claiming agent' };
    }
    return { success: false, error: 'Failed to block task' };
  }
  
  const task = await getTaskById(taskId);
  
  // Log activity
  await logActivity('task_blocked', agentId, taskId, task!.title, { reason });
  
  return { success: true, task: task! };
};

// Handoff: complete current task and create next task in chain
export const handoffTask = async (
  taskId: string, 
  agentId: string, 
  output: unknown | undefined,
  nextTaskInput: Omit<CreateTask, 'created_by'>
): Promise<{ success: boolean; completedTask?: Task; nextTask?: Task; error?: string }> => {
  const completeResult = await completeTask(taskId, agentId, output);
  
  if (!completeResult.success) {
    return { success: false, error: completeResult.error };
  }
  
  const nextTask = await createTask({
    ...nextTaskInput,
    parent_task_id: taskId,
    created_by: agentId,
    status: nextTaskInput.status ?? 'ready', // Default to ready for next agent
  });
  
  return { 
    success: true, 
    completedTask: completeResult.task, 
    nextTask 
  };
};

// Release timed-out tasks back to ready
export const releaseTimedOutTasks = async (): Promise<number> => {
  const now = new Date();
  
  // Find tasks that are in_progress and past their timeout
  const timedOut = await knex('tasks')
    .where('status', 'in_progress')
    .whereNotNull('claimed_at')
    .select('id', 'claimed_at', 'timeout_minutes', 'title', 'claimed_by');
  
  let released = 0;
  for (const task of timedOut) {
    const claimedAt = new Date(task.claimed_at);
    const timeoutMs = task.timeout_minutes * 60 * 1000;
    
    if (now.getTime() - claimedAt.getTime() > timeoutMs) {
      await knex('tasks')
        .where({ id: task.id })
        .update({
          status: 'ready',
          claimed_by: null,
          claimed_at: null,
          updated_at: now.toISOString(),
        });
      
      // Log activity for timeout release
      await logActivity('task_released', 'system', task.id, task.title, {
        reason: 'timeout',
        previous_agent: task.claimed_by,
      });
      
      released++;
    }
  }
  
  return released;
};

// Archive all tasks in a column (move to 'archived' status)
export const archiveColumn = async (status: string): Promise<{ count: number }> => {
  const now = new Date().toISOString();
  
  const result = await knex('tasks')
    .where('status', status)
    .update({
      status: 'archived',
      updated_at: now,
    });
  
  return { count: result };
};
