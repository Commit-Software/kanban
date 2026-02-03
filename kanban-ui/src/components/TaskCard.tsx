import { useState } from 'react';
import type { Task } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

const priorityColors: Record<number, string> = {
  1: 'bg-gray-600',
  2: 'bg-blue-600',
  3: 'bg-yellow-600',
  4: 'bg-orange-600',
  5: 'bg-red-600',
};

const priorityLabels: Record<number, string> = {
  1: 'LOW',
  2: 'LOW',
  3: 'MEDIUM',
  4: 'HIGH',
  5: 'URGENT',
};

// Calculate due date status
function getDueDateStatus(dueDate: string | null): { label: string; color: string; icon: string } | null {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const formatDue = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (diffDays < 0) {
    return { label: formatDue, color: 'text-red-400 bg-red-900/30', icon: '🔴' };
  } else if (diffDays === 0) {
    return { label: 'Today', color: 'text-yellow-400 bg-yellow-900/30', icon: '🟡' };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', color: 'text-yellow-400 bg-yellow-900/30', icon: '🟡' };
  } else if (diffDays <= 7) {
    return { label: formatDue, color: 'text-blue-400 bg-blue-900/30', icon: '🔵' };
  } else {
    return { label: formatDue, color: 'text-gray-400 bg-gray-700', icon: '⚪' };
  }
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = priorityColors[task.priority] || 'bg-gray-600';
  const priorityLabel = priorityLabels[task.priority] || 'MEDIUM';
  const dueStatus = getDueDateStatus(task.due_date);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Collapsed view - compact single line
  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        {...attributes}
        {...listeners}
        className="bg-gray-800 rounded-lg px-3 py-2 mb-2 border border-gray-700 hover:border-gray-500 transition-colors cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(false);
            }}
            className="text-gray-500 hover:text-gray-300 text-xs"
          >
            ▶
          </button>
          <span className="text-white text-xs truncate flex-1">{task.title}</span>
          <span className={`${priorityColor} text-white text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0`}>
            {priorityLabel}
          </span>
          {task.claimed_by && <span className="text-green-400 text-xs">🤖</span>}
          {dueStatus && <span className="text-xs">{dueStatus.icon}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      {...attributes}
      {...listeners}
      className="bg-gray-800 rounded-lg p-3 md:p-4 mb-2 md:mb-3 border border-gray-700 hover:border-gray-500 transition-colors cursor-grab active:cursor-grabbing touch-none"
      onClick={() => {
        // Only trigger edit on click, not drag
        if (!isDragging && onEdit) {
          onEdit(task);
        }
      }}
    >
      {/* Header with title and priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
            className="text-gray-500 hover:text-gray-300 text-xs mt-0.5 shrink-0"
          >
            ▼
          </button>
          <h3 className="text-white font-medium text-xs md:text-sm leading-tight flex-1">
            {task.title}
          </h3>
        </div>
        <span className={`${priorityColor} text-white text-xs px-1.5 md:px-2 py-0.5 rounded font-medium shrink-0`}>
          {priorityLabel}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-400 text-xs mb-2 md:mb-3 line-clamp-2 ml-5">
          {task.description}
        </p>
      )}

      {/* Due date badge */}
      {dueStatus && (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mb-2 md:mb-3 ml-5 ${dueStatus.color}`}>
          <span>{dueStatus.icon}</span>
          <span>Due {dueStatus.label}</span>
        </div>
      )}

      {/* Claimed by agent */}
      {task.claimed_by && (
        <div className="flex items-center gap-1.5 mb-2 md:mb-3 ml-5">
          <span className="text-green-400 text-xs">🤖</span>
          <span className="text-green-400 text-xs font-medium">
            {task.claimed_by}
          </span>
        </div>
      )}

      {/* Skills */}
      {task.skills_required.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 md:mb-3 ml-5">
          {task.skills_required.map((skill) => (
            <span
              key={skill}
              className="bg-gray-700 text-gray-300 text-xs px-1.5 md:px-2 py-0.5 rounded"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Blocked reason */}
      {task.blocked_reason && (
        <div className="bg-red-900/30 border border-red-800 rounded p-2 mb-2 md:mb-3 ml-5">
          <p className="text-red-400 text-xs">
            ⚠️ {task.blocked_reason}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700 ml-5">
        <span className="text-gray-500 text-xs">
          {formatDate(task.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {task.usage_cost_usd != null && task.usage_cost_usd > 0 && (
            <span className="text-emerald-400 text-xs font-medium">
              💰 ${task.usage_cost_usd.toFixed(2)}
            </span>
          )}
          <span className="text-gray-600 text-xs hidden md:inline">
            Click to edit
          </span>
        </div>
      </div>
    </div>
  );
}
