import { useState, useEffect } from 'react';
import { api } from '../api';
import { HelpTooltip, HELP_CONTENT } from '../components/HelpTooltip';

interface Model {
  id: string;
  name: string;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
}

interface AgentSettings {
  agent_id: string;
  model: string;
  budget_limit_usd: number | null;
  created_at?: string;
  updated_at?: string;
}

export default function Settings() {
  const [models, setModels] = useState<Model[]>([]);
  const [agents, setAgents] = useState<AgentSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  
  // New agent form
  const [newAgentId, setNewAgentId] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('claude-sonnet-4');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [modelsRes, agentsRes] = await Promise.all([
        fetch(`${api.baseUrl}/settings/models`),
        fetch(`${api.baseUrl}/settings/agents`),
      ]);
      
      if (!modelsRes.ok || !agentsRes.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const modelsData = await modelsRes.json();
      const agentsData = await agentsRes.json();
      
      setModels(modelsData.models);
      setAgents(agentsData.agents);
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateAgentModel = async (agentId: string, model: string) => {
    try {
      setSaving(agentId);
      
      const response = await fetch(`${api.baseUrl}/settings/agents/${encodeURIComponent(agentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      // Update local state
      setAgents(prev => prev.map(a => 
        a.agent_id === agentId ? { ...a, model } : a
      ));
    } catch (err) {
      setError('Failed to update agent settings');
    } finally {
      setSaving(null);
    }
  };

  const addAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentId.trim()) return;
    
    try {
      setSaving('new');
      
      const response = await fetch(`${api.baseUrl}/settings/agents/${encodeURIComponent(newAgentId.trim())}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newAgentModel }),
      });
      
      if (!response.ok) throw new Error('Failed to add agent');
      
      const newAgent = await response.json();
      setAgents(prev => [...prev, newAgent]);
      setNewAgentId('');
      setNewAgentModel('claude-sonnet-4');
    } catch (err) {
      setError('Failed to add agent');
    } finally {
      setSaving(null);
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm(`Remove settings for ${agentId}?`)) return;
    
    try {
      setSaving(agentId);
      
      const response = await fetch(`${api.baseUrl}/settings/agents/${encodeURIComponent(agentId)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setAgents(prev => prev.filter(a => a.agent_id !== agentId));
    } catch (err) {
      setError('Failed to delete agent settings');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-950 overflow-y-auto">
      <div className="max-w-[800px] mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-white text-2xl font-bold">⚙️ Settings</h1>
          <HelpTooltip {...HELP_CONTENT.settings} />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Available Models */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <h2 className="text-white font-semibold mb-4">🏷️ Available Models</h2>
          <div className="grid gap-2">
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <div className="text-white font-medium">{model.name}</div>
                  <div className="text-gray-500 text-xs font-mono">{model.id}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-gray-400">
                    ${model.cost_per_1k_input}/1K in
                  </div>
                  <div className="text-gray-400">
                    ${model.cost_per_1k_output}/1K out
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Settings */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <h2 className="text-white font-semibold mb-4">🤖 Agent Model Configuration</h2>
          
          {agents.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              No agents configured yet. Add one below.
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {agents.map((agent) => (
                <div key={agent.agent_id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <div className="text-white font-medium">{agent.agent_id}</div>
                  </div>
                  <select
                    value={agent.model}
                    onChange={(e) => updateAgentModel(agent.agent_id, e.target.value)}
                    disabled={saving === agent.agent_id}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-pink-500"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteAgent(agent.agent_id)}
                    disabled={saving === agent.agent_id}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove agent"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Agent */}
          <form onSubmit={addAgent} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-800">
            <input
              type="text"
              value={newAgentId}
              onChange={(e) => setNewAgentId(e.target.value)}
              placeholder="Agent ID (e.g., nick)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 min-w-0"
            />
            <select
              value={newAgentModel}
              onChange={(e) => setNewAgentModel(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 w-full sm:w-auto"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newAgentId.trim() || saving === 'new'}
              className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
            >
              + Add
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-gray-400 font-medium mb-2">💡 How it works</h3>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• Configure which model each agent should use</li>
            <li>• Agents report usage when completing tasks</li>
            <li>• View costs and token usage in the Dashboard</li>
            <li>• Budget limits coming soon!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
