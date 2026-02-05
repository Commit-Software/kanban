import { Router, Request, Response } from 'express';
import { 
  CreateTaskSchema, 
  UpdateTaskSchema,
  ClaimTaskSchema, 
  CompleteTaskSchema, 
  BlockTaskSchema, 
  HandoffTaskSchema,
  TaskQuerySchema 
} from '../models/task.js';
import { 
  createTask, 
  getTaskById, 
  listTasks, 
  updateTask,
  deleteTask,
  claimTask, 
  completeTask, 
  blockTask, 
  handoffTask 
} from '../services/tasks.js';
import { emitTaskEvent } from '../index.js';
import { ZodError } from 'zod';
import { requireAuth } from '../middleware/auth.js';

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

// Helper to handle Zod validation errors
const handleValidation = <T>(schema: { parse: (data: unknown) => T }, data: unknown): { data?: T; error?: string } => {
  try {
    return { data: schema.parse(data) };
  } catch (e) {
    if (e instanceof ZodError) {
      return { error: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ') };
    }
    throw e;
  }
};

// GET /tasks - List tasks with filters
taskRoutes.get('/', async (req: Request, res: Response) => {
  const { data: query, error } = handleValidation(TaskQuerySchema, req.query);
  if (error) {
    return res.status(400).json({ error });
  }
  
  let tasks = await listTasks(query!);
  
  if (req.user!.role !== 'admin') {
    tasks = tasks.filter(t => t.created_by === req.user!.id);
  }
  
  res.json({ tasks, count: tasks.length });
});

// GET /tasks/:id - Get single task
taskRoutes.get('/:id', async (req: Request, res: Response) => {
  const task = await getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (req.user!.role !== 'admin' && task.created_by !== req.user!.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json({ task });
});

// POST /tasks - Create new task
taskRoutes.post('/', async (req: Request, res: Response) => {
  const body = { ...req.body, created_by: req.user!.id };
  const { data: input, error } = handleValidation(CreateTaskSchema, body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const task = await createTask(input!);
  emitTaskEvent('task:created', { task });
  res.status(201).json({ task });
});

// PATCH /tasks/:id - Update a task
taskRoutes.patch('/:id', async (req: Request, res: Response) => {
  const existingTask = await getTaskById(req.params.id);
  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (req.user!.role !== 'admin' && existingTask.created_by !== req.user!.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { data: input, error } = handleValidation(UpdateTaskSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const result = await updateTask(req.params.id, input!, req.user!.id);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  emitTaskEvent('task:updated', { task: result.task });
  res.json({ task: result.task });
});

// DELETE /tasks/:id - Delete a task
taskRoutes.delete('/:id', async (req: Request, res: Response) => {
  const existingTask = await getTaskById(req.params.id);
  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (req.user!.role !== 'admin' && existingTask.created_by !== req.user!.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const taskId = req.params.id;
  const result = await deleteTask(taskId, req.user!.id);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  emitTaskEvent('task:deleted', { taskId });
  res.status(204).send();
});

// POST /tasks/:id/claim - Claim a task
taskRoutes.post('/:id/claim', async (req: Request, res: Response) => {
  const { data: input, error } = handleValidation(ClaimTaskSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const result = await claimTask(req.params.id, input!.agent_id);
  if (!result.success) {
    return res.status(409).json({ error: result.error });
  }
  emitTaskEvent('task:claimed', { task: result.task, agentId: input!.agent_id });
  res.json({ task: result.task });
});

// POST /tasks/:id/complete - Complete a task
taskRoutes.post('/:id/complete', async (req: Request, res: Response) => {
  const agentId = req.headers['x-agent-id'] as string;
  if (!agentId) {
    return res.status(401).json({ error: 'x-agent-id header required' });
  }
  
  const { data: input, error } = handleValidation(CompleteTaskSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const result = await completeTask(req.params.id, agentId, input!.output, input!.usage);
  if (!result.success) {
    return res.status(409).json({ error: result.error });
  }
  emitTaskEvent('task:completed', { task: result.task, agentId });
  res.json({ task: result.task });
});

// POST /tasks/:id/block - Block a task
taskRoutes.post('/:id/block', async (req: Request, res: Response) => {
  const agentId = req.headers['x-agent-id'] as string;
  if (!agentId) {
    return res.status(401).json({ error: 'x-agent-id header required' });
  }
  
  const { data: input, error } = handleValidation(BlockTaskSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const result = await blockTask(req.params.id, agentId, input!.reason);
  if (!result.success) {
    return res.status(409).json({ error: result.error });
  }
  emitTaskEvent('task:blocked', { task: result.task, agentId, reason: input!.reason });
  res.json({ task: result.task });
});

// POST /tasks/:id/handoff - Complete and create next task
taskRoutes.post('/:id/handoff', async (req: Request, res: Response) => {
  const agentId = req.headers['x-agent-id'] as string;
  if (!agentId) {
    return res.status(401).json({ error: 'x-agent-id header required' });
  }
  
  const { data: input, error } = handleValidation(HandoffTaskSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const result = await handoffTask(req.params.id, agentId, input!.output, input!.next_task);
  if (!result.success) {
    return res.status(409).json({ error: result.error });
  }
  emitTaskEvent('task:completed', { task: result.completedTask, agentId });
  emitTaskEvent('task:created', { task: result.nextTask });
  res.json({ 
    completed_task: result.completedTask, 
    next_task: result.nextTask 
  });
});

// POST /tasks/archive-column - Archive all tasks in a column (move to archived status)
taskRoutes.post('/archive-column', async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }
  
  const { archiveColumn } = await import('../services/tasks.js');
  const result = await archiveColumn(status);
  emitTaskEvent('tasks:archived', { status, count: result.count });
  res.json({ archived: result.count, status });
});
