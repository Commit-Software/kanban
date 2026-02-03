// Task types matching the API
export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done' | 'blocked';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  skills_required: string[];
  claimed_by: string | null;
  claimed_at: string | null;
  timeout_minutes: number;
  parent_task_id: string | null;
  output: unknown;
  blocked_reason: string | null;
  due_date: string | null;  // YYYY-MM-DD format
  created_by: string;
  created_at: string;
  updated_at: string;
  // Usage tracking
  usage_input_tokens?: number | null;
  usage_output_tokens?: number | null;
  usage_model?: string | null;
  usage_cost_usd?: number | null;
}

// Activity types for the feed
export type ActivityType = 
  | 'task_created'
  | 'task_claimed'
  | 'task_completed'
  | 'task_blocked'
  | 'task_unblocked'
  | 'task_handoff'
  | 'task_updated'
  | 'task_deleted'
  | 'task_released';

export interface Activity {
  id: string;
  type: ActivityType;
  agent_id: string;
  task_id?: string;
  task_title?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  subtitle: string;
  icon: string;
}

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', subtitle: 'Ideas and upcoming work', icon: '📋' },
  { id: 'ready', title: 'Ready', subtitle: 'Waiting for agent', icon: '🎯' },
  { id: 'in_progress', title: 'In Progress', subtitle: 'Agent working', icon: '🤖' },
  { id: 'review', title: 'Review', subtitle: 'Awaiting verification', icon: '👀' },
  { id: 'done', title: 'Done', subtitle: 'Completed', icon: '✅' },
  { id: 'blocked', title: 'Blocked', subtitle: 'Needs attention', icon: '🚫' },
];

// Activity type icons
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  task_created: '✨',
  task_claimed: '🎯',
  task_completed: '✅',
  task_blocked: '🚫',
  task_unblocked: '🔓',
  task_handoff: '🤝',
  task_updated: '📝',
  task_deleted: '🗑️',
  task_released: '🔄',
};

// Filter options
export interface Filters {
  agent: string;
  skill: string;
  priority: string;
  search: string;
}
