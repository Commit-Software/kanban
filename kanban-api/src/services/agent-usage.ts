import { knex } from '../db/index.js';

interface DailyUsage {
  tokens_in: number;
  tokens_out: number;
  tokens_total: number;
  cost_usd: number;
  task_count: number;
}

interface AgentUsageSummary {
  agent_id: string;
  today: DailyUsage;
  yesterday: DailyUsage;
  week_total: DailyUsage;
  week_avg: DailyUsage;
  trend_vs_yesterday: string;
  trend_vs_week_avg: string;
}

const emptyUsage = (): DailyUsage => ({
  tokens_in: 0,
  tokens_out: 0,
  tokens_total: 0,
  cost_usd: 0,
  task_count: 0,
});

const getDateRange = (daysAgo: number): { start: string; end: string } => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().split('T')[0];
  return {
    start: `${dateStr}T00:00:00.000Z`,
    end: `${dateStr}T23:59:59.999Z`,
  };
};

const aggregateUsage = (tasks: any[]): DailyUsage => {
  return tasks.reduce((acc, task) => ({
    tokens_in: acc.tokens_in + (task.usage_input_tokens || 0),
    tokens_out: acc.tokens_out + (task.usage_output_tokens || 0),
    tokens_total: acc.tokens_total + (task.usage_input_tokens || 0) + (task.usage_output_tokens || 0),
    cost_usd: acc.cost_usd + (task.usage_cost_usd || 0),
    task_count: acc.task_count + 1,
  }), emptyUsage());
};

const calcTrend = (current: number, baseline: number): string => {
  if (baseline === 0) return current > 0 ? '+∞%' : '0%';
  const pct = ((current - baseline) / baseline) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
};

export const getAgentUsageSummary = async (agentId: string): Promise<AgentUsageSummary> => {
  const today = getDateRange(0);
  const yesterday = getDateRange(1);
  
  // Get today's tasks
  const todayTasks = await knex('tasks')
    .where('claimed_by', agentId)
    .where('status', 'done')
    .whereNotNull('usage_input_tokens')
    .where('updated_at', '>=', today.start)
    .where('updated_at', '<=', today.end);
  
  // Get yesterday's tasks
  const yesterdayTasks = await knex('tasks')
    .where('claimed_by', agentId)
    .where('status', 'done')
    .whereNotNull('usage_input_tokens')
    .where('updated_at', '>=', yesterday.start)
    .where('updated_at', '<=', yesterday.end);
  
  // Get last 7 days (including today)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekTasks = await knex('tasks')
    .where('claimed_by', agentId)
    .where('status', 'done')
    .whereNotNull('usage_input_tokens')
    .where('updated_at', '>=', weekStart.toISOString());
  
  const todayUsage = aggregateUsage(todayTasks);
  const yesterdayUsage = aggregateUsage(yesterdayTasks);
  const weekUsage = aggregateUsage(weekTasks);
  
  // Calculate week average (per day)
  const weekAvg: DailyUsage = {
    tokens_in: Math.round(weekUsage.tokens_in / 7),
    tokens_out: Math.round(weekUsage.tokens_out / 7),
    tokens_total: Math.round(weekUsage.tokens_total / 7),
    cost_usd: Math.round((weekUsage.cost_usd / 7) * 100) / 100,
    task_count: Math.round(weekUsage.task_count / 7 * 10) / 10,
  };
  
  return {
    agent_id: agentId,
    today: todayUsage,
    yesterday: yesterdayUsage,
    week_total: weekUsage,
    week_avg: weekAvg,
    trend_vs_yesterday: calcTrend(todayUsage.cost_usd, yesterdayUsage.cost_usd),
    trend_vs_week_avg: calcTrend(todayUsage.cost_usd, weekAvg.cost_usd),
  };
};
