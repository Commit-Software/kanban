import type { Task, Filters } from '../types';

interface FilterBarProps {
  tasks: Task[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FilterBar({ tasks, filters, onFiltersChange }: FilterBarProps) {
  // Extract unique values from tasks
  const agents = [...new Set(tasks.map(t => t.claimed_by).filter((a): a is string => !!a))];
  const creators = [...new Set(tasks.map(t => t.created_by))];
  const allAgents = [...new Set([...agents, ...creators])].sort();
  
  const allSkills = [...new Set(tasks.flatMap(t => t.skills_required))].sort();
  
  const priorities = [1, 2, 3, 4, 5];
  const priorityLabels: Record<number, string> = {
    1: '1 - Low',
    2: '2',
    3: '3 - Medium',
    4: '4',
    5: '5 - High',
  };

  const hasActiveFilters = filters.agent || filters.skill || filters.priority || filters.search;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Agent filter */}
      <select
        value={filters.agent}
        onChange={(e) => onFiltersChange({ ...filters, agent: e.target.value })}
        className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-[130px]"
      >
        <option value="">All Agents</option>
        {allAgents.map((agent) => (
          <option key={agent} value={agent}>{agent}</option>
        ))}
      </select>

      {/* Skills filter */}
      <select
        value={filters.skill}
        onChange={(e) => onFiltersChange({ ...filters, skill: e.target.value })}
        className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-[130px]"
      >
        <option value="">All Skills</option>
        {allSkills.map((skill) => (
          <option key={skill} value={skill}>{skill}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
        className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-[130px]"
      >
        <option value="">All Priorities</option>
        {priorities.map((p) => (
          <option key={p} value={String(p)}>{priorityLabels[p]}</option>
        ))}
      </select>

      {/* Search input */}
      <div className="relative flex-1 min-w-[150px] max-w-[250px]">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="🔍 Search..."
          className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-500"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onFiltersChange({ agent: '', skill: '', priority: '', search: '' })}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 transition-colors"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
