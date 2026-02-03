import { knex } from '../db/index.js';
import { z } from 'zod';

// Query schema for usage stats
export const UsageStatsQuerySchema = z.object({
  agent_id: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type UsageStatsQuery = z.infer<typeof UsageStatsQuerySchema>;

// Get usage statistics
export const getUsageStats = async (query: UsageStatsQuery) => {
  let q = knex('tasks')
    .whereNotNull('usage_input_tokens');
  
  if (query.agent_id) {
    q = q.where('claimed_by', query.agent_id);
  }
  
  if (query.from) {
    q = q.where('updated_at', '>=', query.from);
  }
  
  if (query.to) {
    q = q.where('updated_at', '<=', query.to);
  }
  
  // Get all tasks with usage data for aggregation
  const tasks = await q.select(
    'id',
    'title',
    'claimed_by',
    'usage_input_tokens',
    'usage_output_tokens',
    'usage_model',
    'usage_cost_usd',
    'updated_at'
  );
  
  // Calculate totals
  const totals = {
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_tokens: 0,
    total_cost_usd: 0,
    task_count: tasks.length,
  };
  
  // By agent breakdown
  const byAgent: Record<string, { input_tokens: number; output_tokens: number; cost_usd: number; task_count: number }> = {};
  
  // By model breakdown
  const byModel: Record<string, { input_tokens: number; output_tokens: number; cost_usd: number; task_count: number }> = {};
  
  // Daily breakdown for charts
  const byDay: Record<string, { input_tokens: number; output_tokens: number; cost_usd: number; task_count: number }> = {};
  
  for (const task of tasks) {
    const inputTokens = task.usage_input_tokens || 0;
    const outputTokens = task.usage_output_tokens || 0;
    const cost = task.usage_cost_usd || 0;
    const model = task.usage_model || 'unknown';
    const agent = task.claimed_by || 'unknown';
    const day = task.updated_at ? task.updated_at.split('T')[0] : 'unknown';
    
    // Totals
    totals.total_input_tokens += inputTokens;
    totals.total_output_tokens += outputTokens;
    totals.total_tokens += inputTokens + outputTokens;
    totals.total_cost_usd += cost;
    
    // By agent
    if (!byAgent[agent]) {
      byAgent[agent] = { input_tokens: 0, output_tokens: 0, cost_usd: 0, task_count: 0 };
    }
    byAgent[agent].input_tokens += inputTokens;
    byAgent[agent].output_tokens += outputTokens;
    byAgent[agent].cost_usd += cost;
    byAgent[agent].task_count += 1;
    
    // By model
    if (!byModel[model]) {
      byModel[model] = { input_tokens: 0, output_tokens: 0, cost_usd: 0, task_count: 0 };
    }
    byModel[model].input_tokens += inputTokens;
    byModel[model].output_tokens += outputTokens;
    byModel[model].cost_usd += cost;
    byModel[model].task_count += 1;
    
    // By day
    if (!byDay[day]) {
      byDay[day] = { input_tokens: 0, output_tokens: 0, cost_usd: 0, task_count: 0 };
    }
    byDay[day].input_tokens += inputTokens;
    byDay[day].output_tokens += outputTokens;
    byDay[day].cost_usd += cost;
    byDay[day].task_count += 1;
  }
  
  // Get unique agents count
  const uniqueAgents = new Set(tasks.map(t => t.claimed_by).filter(Boolean));
  
  // Recent tasks with usage
  const recentTasks = tasks
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    .slice(0, 20)
    .map(t => ({
      id: t.id,
      title: t.title,
      agent: t.claimed_by,
      model: t.usage_model,
      input_tokens: t.usage_input_tokens,
      output_tokens: t.usage_output_tokens,
      total_tokens: (t.usage_input_tokens || 0) + (t.usage_output_tokens || 0),
      cost_usd: t.usage_cost_usd,
      completed_at: t.updated_at,
    }));
  
  return {
    totals: {
      ...totals,
      agent_count: uniqueAgents.size,
    },
    by_agent: Object.entries(byAgent).map(([agent, data]) => ({ agent, ...data })),
    by_model: Object.entries(byModel).map(([model, data]) => ({ model, ...data })),
    by_day: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, data]) => ({ day, ...data })),
    recent_tasks: recentTasks,
  };
};
