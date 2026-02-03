import { z } from 'zod';

// Task status enum
export const TaskStatus = {
  BACKLOG: 'backlog',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  BLOCKED: 'blocked',
  ARCHIVED: 'archived',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

// Zod schemas for validation
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['backlog', 'ready', 'in_progress', 'review', 'done', 'blocked', 'archived']),
  priority: z.number().int().min(1).max(5).default(3),
  skills_required: z.array(z.string()).default([]),
  claimed_by: z.string().nullable().default(null),
  claimed_at: z.string().datetime().nullable().default(null),
  timeout_minutes: z.number().int().positive().default(30),
  parent_task_id: z.string().uuid().nullable().default(null),
  output: z.unknown().nullable().default(null),
  blocked_reason: z.string().nullable().default(null),
  due_date: z.string().nullable().default(null),  // YYYY-MM-DD format
  // Usage tracking fields
  usage_input_tokens: z.number().int().nullable().default(null),
  usage_output_tokens: z.number().int().nullable().default(null),
  usage_model: z.string().nullable().default(null),
  usage_cost_usd: z.number().nullable().default(null),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

// Schema for creating a new task
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['backlog', 'ready', 'in_progress', 'review', 'done', 'blocked']).default('backlog'),
  priority: z.number().int().min(1).max(5).default(3),
  skills_required: z.array(z.string()).default([]),
  timeout_minutes: z.number().int().positive().default(30),
  parent_task_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),  // YYYY-MM-DD format
  created_by: z.string(),
});

export type CreateTask = z.infer<typeof CreateTaskSchema>;

// Schema for updating a task
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'ready', 'in_progress', 'review', 'done', 'blocked']).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  skills_required: z.array(z.string()).optional(),
  timeout_minutes: z.number().int().positive().optional(),
  blocked_reason: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),  // YYYY-MM-DD format, null to clear
});

export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

// Schema for claiming a task
export const ClaimTaskSchema = z.object({
  agent_id: z.string().min(1),
});

export type ClaimTask = z.infer<typeof ClaimTaskSchema>;

// Usage data schema
export const UsageDataSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  model: z.string(),
  cost_usd: z.number().nonnegative().optional(),
});

export type UsageData = z.infer<typeof UsageDataSchema>;

// Schema for completing a task
export const CompleteTaskSchema = z.object({
  output: z.unknown().optional(),
  usage: UsageDataSchema.optional(),
});

export type CompleteTask = z.infer<typeof CompleteTaskSchema>;

// Schema for blocking a task
export const BlockTaskSchema = z.object({
  reason: z.string().min(1),
});

export type BlockTask = z.infer<typeof BlockTaskSchema>;

// Schema for handing off a task (complete + spawn next)
export const HandoffTaskSchema = z.object({
  output: z.unknown().optional(),
  next_task: CreateTaskSchema.omit({ created_by: true }),
});

export type HandoffTask = z.infer<typeof HandoffTaskSchema>;

// Schema for filtering/querying tasks
export const TaskQuerySchema = z.object({
  status: z.enum(['backlog', 'ready', 'in_progress', 'review', 'done', 'blocked', 'archived']).optional(),
  skills: z.string().optional(), // comma-separated skills
  claimed_by: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type TaskQuery = z.infer<typeof TaskQuerySchema>;
