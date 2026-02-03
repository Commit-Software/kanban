import { useState, useEffect } from 'react';
import { api } from '../api';
import { HelpTooltip, HELP_CONTENT } from '../components/HelpTooltip';

interface ArchivedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  claimed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_cost_usd: number | null;
  usage_input_tokens: number | null;
  usage_output_tokens: number | null;
  usage_model: string | null;
}

export default function Archive() {
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const fetchArchived = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api.baseUrl}/tasks?status=archived`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch archived tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const restoreTask = async (taskId: string, toStatus: string = 'backlog') => {
    try {
      await fetch(`${api.baseUrl}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toStatus }),
      });
      fetchArchived();
    } catch (err) {
      console.error('Failed to restore task:', err);
    }
  };

  // Get unique agents from tasks
  const agents = [...new Set(tasks.map(t => t.claimed_by || t.created_by).filter(Boolean))];

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (search && !task.title.toLowerCase().includes(search.toLowerCase()) && 
        !task.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Agent filter
    if (agentFilter && task.claimed_by !== agentFilter && task.created_by !== agentFilter) {
      return false;
    }
    
    // Date filters
    if (dateFrom) {
      const taskDate = new Date(task.updated_at);
      const fromDate = new Date(dateFrom);
      if (taskDate < fromDate) return false;
    }
    
    if (dateTo) {
      const taskDate = new Date(task.updated_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (taskDate > toDate) return false;
    }
    
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost: number | null) => {
    if (cost === null) return '-';
    return `$${cost.toFixed(2)}`;
  };

  const priorityLabel = (p: number) => {
    const labels: Record<number, { text: string; color: string }> = {
      1: { text: 'CRITICAL', color: 'bg-red-500' },
      2: { text: 'HIGH', color: 'bg-orange-500' },
      3: { text: 'MEDIUM', color: 'bg-yellow-500' },
      4: { text: 'LOW', color: 'bg-green-500' },
      5: { text: 'LOWEST', color: 'bg-gray-500' },
    };
    return labels[p] || { text: 'MEDIUM', color: 'bg-yellow-500' };
  };

  return (
    <div className="h-full overflow-auto bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white">📦 Archive</h1>
            <HelpTooltip {...HELP_CONTENT.archive} />
          </div>
          <div className="text-gray-400 text-sm">
            {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>

        {/* Filters - clean 2x2 on mobile, 1x4 on desktop */}
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 mb-4">
          {/* Search full width */}
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search tasks..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
            />
          </div>
          {/* 3 filters in a row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-500 text-[10px] uppercase mb-1 block">Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full h-9 bg-gray-800 border border-gray-700 rounded-lg px-2 text-white text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="">All</option>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-[10px] uppercase mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-9 bg-gray-800 border border-gray-700 rounded-lg px-1 text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-[10px] uppercase mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-9 bg-gray-800 border border-gray-700 rounded-lg px-1 text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="text-gray-500 text-center py-12">Loading...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              {tasks.length === 0 ? 'No archived tasks yet' : 'No tasks match your filters'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-gray-800 bg-gray-900/50">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Agent</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium">Archived</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const priority = priorityLabel(task.priority);
                    return (
                      <tr key={task.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-gray-500 text-xs truncate max-w-[300px]">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${priority.color} text-white text-xs px-2 py-0.5 rounded`}>
                            {priority.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-green-400">
                          {task.claimed_by || task.created_by || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {formatCost(task.usage_cost_usd)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {formatDate(task.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => restoreTask(task.id, 'backlog')}
                            className="text-pink-400 hover:text-pink-300 text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                            title="Restore to Backlog"
                          >
                            ↩️ Restore
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
