import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { knex, initializeDb, closeDb } from '../db/index.js';
import { 
  createTask, 
  getTaskById, 
  listTasks, 
  claimTask, 
  completeTask, 
  blockTask,
  handoffTask,
  buildTask
} from '../services/tasks.js';
import type { CreateTask } from '../models/task.js';

// Use in-memory SQLite for tests
beforeAll(async () => {
  await initializeDb();
});

afterAll(async () => {
  await closeDb();
});

beforeEach(async () => {
  // Clear tasks table before each test
  await knex('tasks').delete();
});

describe('buildTask', () => {
  it('should create a task object with defaults', () => {
    const input: CreateTask = {
      title: 'Test Task',
      created_by: 'test-user',
    };
    
    const task = buildTask(input);
    
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('backlog');
    expect(task.priority).toBe(3);
    expect(task.skills_required).toEqual([]);
    expect(task.claimed_by).toBeNull();
    expect(task.created_by).toBe('test-user');
    expect(task.id).toBeDefined();
    expect(task.created_at).toBeDefined();
  });
});

describe('createTask', () => {
  it('should create and store a task', async () => {
    const input: CreateTask = {
      title: 'Research Task',
      description: 'Do some research',
      skills_required: ['research', 'web-scraping'],
      created_by: 'ken',
    };
    
    const task = await createTask(input);
    
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Research Task');
    expect(task.skills_required).toEqual(['research', 'web-scraping']);
    
    // Verify it's in the database
    const fetched = await getTaskById(task.id);
    expect(fetched).toEqual(task);
  });
});

describe('listTasks', () => {
  it('should filter by status', async () => {
    await createTask({ title: 'Task 1', status: 'ready', created_by: 'ken' });
    await createTask({ title: 'Task 2', status: 'backlog', created_by: 'ken' });
    await createTask({ title: 'Task 3', status: 'ready', created_by: 'ken' });
    
    const ready = await listTasks({ status: 'ready' });
    
    expect(ready).toHaveLength(2);
    expect(ready.every(t => t.status === 'ready')).toBe(true);
  });
  
  it('should filter by skills', async () => {
    await createTask({ title: 'Task 1', skills_required: ['research'], status: 'ready', created_by: 'ken' });
    await createTask({ title: 'Task 2', skills_required: ['coding'], status: 'ready', created_by: 'ken' });
    await createTask({ title: 'Task 3', skills_required: ['research', 'coding'], status: 'ready', created_by: 'ken' });
    
    const research = await listTasks({ status: 'ready', skills: 'research' });
    
    expect(research).toHaveLength(2);
  });
});

describe('claimTask', () => {
  it('should claim a ready task', async () => {
    const task = await createTask({ title: 'Claimable', status: 'ready', created_by: 'ken' });
    
    const result = await claimTask(task.id, 'nick');
    
    expect(result.success).toBe(true);
    expect(result.task?.status).toBe('in_progress');
    expect(result.task?.claimed_by).toBe('nick');
    expect(result.task?.claimed_at).toBeDefined();
  });
  
  it('should reject claiming non-ready task', async () => {
    const task = await createTask({ title: 'Not Ready', status: 'backlog', created_by: 'ken' });
    
    const result = await claimTask(task.id, 'nick');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not ready');
  });
  
  it('should reject claiming already-claimed task', async () => {
    const task = await createTask({ title: 'Claimable', status: 'ready', created_by: 'ken' });
    
    // First claim succeeds
    const first = await claimTask(task.id, 'nick');
    expect(first.success).toBe(true);
    
    // Second claim fails (task is now in_progress, not ready)
    const second = await claimTask(task.id, 'zen');
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/already claimed|not ready/);
  });
});

describe('completeTask', () => {
  it('should complete a claimed task with output', async () => {
    const task = await createTask({ title: 'Do Work', status: 'ready', created_by: 'ken' });
    await claimTask(task.id, 'nick');
    
    const result = await completeTask(task.id, 'nick', { findings: 'all good' });
    
    expect(result.success).toBe(true);
    expect(result.task?.status).toBe('done');
    expect(result.task?.output).toEqual({ findings: 'all good' });
  });
  
  it('should reject completion by non-claimer', async () => {
    const task = await createTask({ title: 'Do Work', status: 'ready', created_by: 'ken' });
    await claimTask(task.id, 'nick');
    
    const result = await completeTask(task.id, 'zen', {});
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not the claiming agent');
  });
});

describe('blockTask', () => {
  it('should block a task with reason', async () => {
    const task = await createTask({ title: 'Problematic', status: 'ready', created_by: 'ken' });
    await claimTask(task.id, 'nick');
    
    const result = await blockTask(task.id, 'nick', 'API is down');
    
    expect(result.success).toBe(true);
    expect(result.task?.status).toBe('blocked');
    expect(result.task?.blocked_reason).toBe('API is down');
  });
});

describe('handoffTask', () => {
  it('should complete current and create next task', async () => {
    const task = await createTask({ title: 'Step 1', status: 'ready', created_by: 'ken' });
    await claimTask(task.id, 'nick');
    
    const result = await handoffTask(task.id, 'nick', { step1: 'done' }, {
      title: 'Step 2',
      description: 'Continue the work',
      skills_required: ['analysis'],
    });
    
    expect(result.success).toBe(true);
    expect(result.completedTask?.status).toBe('done');
    expect(result.nextTask?.title).toBe('Step 2');
    expect(result.nextTask?.parent_task_id).toBe(task.id);
    expect(result.nextTask?.status).toBe('ready'); // Ready for next agent
  });
});
