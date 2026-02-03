import type { Task } from '../types';

interface StatsBarProps {
  tasks: Task[];
}

export function StatsBar({ tasks }: StatsBarProps) {
  const total = tasks.length;
  const active = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="flex items-center gap-3 md:gap-6 text-sm">
      <div className="text-center">
        <div className="text-xl md:text-2xl font-bold text-white">{total}</div>
        <div className="text-gray-500 text-xs">Total</div>
      </div>
      <div className="text-center">
        <div className="text-xl md:text-2xl font-bold text-blue-400">{active}</div>
        <div className="text-gray-500 text-xs">Active</div>
      </div>
      <div className="text-center">
        <div className="text-xl md:text-2xl font-bold text-green-400">{done}</div>
        <div className="text-gray-500 text-xs">Done</div>
      </div>
      {blocked > 0 && (
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-red-400">{blocked}</div>
          <div className="text-gray-500 text-xs">Blocked</div>
        </div>
      )}
    </div>
  );
}
