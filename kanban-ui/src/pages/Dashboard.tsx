import { useState, useEffect } from 'react';
import { api } from '../api';
import { HelpTooltip, HELP_CONTENT } from '../components/HelpTooltip';

// Agent Usage Card Component
function AgentUsageCard({ agents }: { agents: string[] }) {
  const [agentId, setAgentId] = useState('');
  const [usage, setUsage] = useState<{
    today: { cost_usd: number; tokens_total: number; task_count: number };
    yesterday: { cost_usd: number; tokens_total: number; task_count: number };
    week_total: { cost_usd: number; tokens_total: number; task_count: number };
    trend_vs_yesterday: string;
    trend_vs_week_avg: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async (id: string) => {
    if (!id) {
      setUsage(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${api.baseUrl}/agents/${encodeURIComponent(id)}/usage`);
      if (!response.ok) throw new Error('Agent not found');
      const data = await response.json();
      setUsage(data);
    } catch {
      setError('Could not fetch agent usage');
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgent = e.target.value;
    setAgentId(newAgent);
    fetchUsage(newAgent);
  };

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
      <h3 className="text-white font-semibold mb-4">🤖 Agent Self-Check</h3>
      
      <div className="mb-4">
        <select
          value={agentId}
          onChange={handleAgentChange}
          className="w-full md:w-64 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 cursor-pointer"
        >
          <option value="">Select an agent...</option>
          {agents.map((agent) => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-gray-500 text-sm text-center py-4">Loading...</div>
      )}

      {error && (
        <div className="text-red-400 text-sm mb-2">{error}</div>
      )}

      {usage && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Today */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-gray-500 text-xs uppercase mb-1">Today</div>
            <div className="text-white text-lg font-bold">{formatCost(usage.today.cost_usd)}</div>
            <div className="text-gray-400 text-xs">{formatTokens(usage.today.tokens_total)} tokens</div>
            <div className="text-gray-400 text-xs">{usage.today.task_count} tasks</div>
          </div>
          
          {/* Yesterday */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-gray-500 text-xs uppercase mb-1">Yesterday</div>
            <div className="text-white text-lg font-bold">{formatCost(usage.yesterday.cost_usd)}</div>
            <div className="text-gray-400 text-xs">{formatTokens(usage.yesterday.tokens_total)} tokens</div>
            <div className="text-gray-400 text-xs">{usage.yesterday.task_count} tasks</div>
          </div>
          
          {/* Week Total */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-gray-500 text-xs uppercase mb-1">This Week</div>
            <div className="text-white text-lg font-bold">{formatCost(usage.week_total.cost_usd)}</div>
            <div className="text-gray-400 text-xs">{formatTokens(usage.week_total.tokens_total)} tokens</div>
            <div className="text-gray-400 text-xs">{usage.week_total.task_count} tasks</div>
          </div>
          
          {/* Trends */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-gray-500 text-xs uppercase mb-1">Trends</div>
            <div className="text-sm">
              <span className="text-gray-400">vs yesterday: </span>
              <span className={usage.trend_vs_yesterday.startsWith('+') ? 'text-red-400' : 'text-green-400'}>
                {usage.trend_vs_yesterday}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">vs week avg: </span>
              <span className={usage.trend_vs_week_avg.startsWith('+') ? 'text-red-400' : 'text-green-400'}>
                {usage.trend_vs_week_avg}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {!usage && !error && !loading && (
        <div className="text-gray-500 text-sm text-center py-4">
          Select an agent to view their daily usage stats
        </div>
      )}
    </div>
  );
}

interface UsageStats {
  totals: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    task_count: number;
    agent_count: number;
  };
  by_agent: Array<{
    agent: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    task_count: number;
  }>;
  by_model: Array<{
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    task_count: number;
  }>;
  by_day: Array<{
    day: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    task_count: number;
  }>;
  recent_tasks: Array<{
    id: string;
    title: string;
    agent: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
    completed_at: string;
  }>;
}

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function Dashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('all');

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on period
      let from: string | undefined;
      const now = new Date();
      
      if (period === 'today') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString();
      } else if (period === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        from = monthAgo.toISOString();
      }
      
      const params = from ? `?from=${encodeURIComponent(from)}` : '';
      const response = await fetch(`${api.baseUrl}/stats/usage${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load usage stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  const getMaxValue = (items: Array<{ cost_usd: number }>) => {
    return Math.max(...items.map(i => i.cost_usd), 0.01);
  };

  if (loading && !stats) {
    return (
      <div className="h-full bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-950 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl font-bold">📊 Usage Dashboard</h1>
            <HelpTooltip {...HELP_CONTENT.dashboard} />
          </div>
          
          <div className="flex items-center gap-2">
            {(['today', 'week', 'month', 'all'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            <button
              onClick={fetchStats}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
            >
              🔄
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-500 text-xs uppercase mb-1">Total Cost</div>
                <div className="text-white text-2xl font-bold">{formatCost(stats.totals.total_cost_usd)}</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-500 text-xs uppercase mb-1">Tokens Used</div>
                <div className="text-white text-2xl font-bold">{formatTokens(stats.totals.total_tokens)}</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-500 text-xs uppercase mb-1">Tasks Completed</div>
                <div className="text-white text-2xl font-bold">{stats.totals.task_count}</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-500 text-xs uppercase mb-1">Active Agents</div>
                <div className="text-white text-2xl font-bold">{stats.totals.agent_count}</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* By Agent */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">🤖 By Agent</h3>
                {stats.by_agent.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8">No usage data yet</div>
                ) : (
                  <div className="space-y-3">
                    {stats.by_agent.map((item) => {
                      const percent = (item.cost_usd / getMaxValue(stats.by_agent)) * 100;
                      return (
                        <div key={item.agent}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white">{item.agent}</span>
                            <span className="text-gray-400">
                              {formatCost(item.cost_usd)} · {formatTokens(item.input_tokens + item.output_tokens)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pink-500 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* By Model */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">🏷️ By Model</h3>
                {stats.by_model.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8">No usage data yet</div>
                ) : (
                  <div className="space-y-3">
                    {stats.by_model.map((item) => {
                      const percent = (item.cost_usd / getMaxValue(stats.by_model)) * 100;
                      return (
                        <div key={item.model}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white">{item.model}</span>
                            <span className="text-gray-400">
                              {formatCost(item.cost_usd)} · {formatTokens(item.input_tokens + item.output_tokens)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Usage Over Time */}
            {stats.by_day.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
                <h3 className="text-white font-semibold mb-4">📈 Usage Over Time</h3>
                <div className="flex items-end gap-1 h-32">
                  {stats.by_day.slice(-14).map((day) => {
                    const maxCost = Math.max(...stats.by_day.map(d => d.cost_usd), 0.01);
                    const height = (day.cost_usd / maxCost) * 100;
                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-pink-500/80 rounded-t transition-all hover:bg-pink-400"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${day.day}: ${formatCost(day.cost_usd)}`}
                        />
                        <span className="text-gray-600 text-[10px] rotate-45 origin-left whitespace-nowrap">
                          {day.day.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agent Self-Check */}
            <AgentUsageCard agents={stats.by_agent.map(a => a.agent)} />

            {/* Recent Tasks Table */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">📋 Recent Tasks</h3>
              {stats.recent_tasks.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  No tasks with usage data yet.<br/>
                  Complete tasks with the <code className="bg-gray-800 px-1 rounded">usage</code> field to see them here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left border-b border-gray-800">
                        <th className="pb-2 font-medium">Task</th>
                        <th className="pb-2 font-medium">Agent</th>
                        <th className="pb-2 font-medium">Model</th>
                        <th className="pb-2 font-medium text-right">Tokens</th>
                        <th className="pb-2 font-medium text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_tasks.map((task) => (
                        <tr key={task.id} className="border-b border-gray-800/50">
                          <td className="py-2 text-white truncate max-w-[200px]">{task.title}</td>
                          <td className="py-2 text-green-400">{task.agent}</td>
                          <td className="py-2 text-gray-400">{task.model}</td>
                          <td className="py-2 text-gray-400 text-right">{formatTokens(task.total_tokens)}</td>
                          <td className="py-2 text-white text-right">{formatCost(task.cost_usd || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
