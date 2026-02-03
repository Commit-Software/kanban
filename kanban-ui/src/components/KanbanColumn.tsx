import { useState, useEffect } from 'react';
import type { Task, Column } from '../types';
import { TaskCard } from './TaskCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { api } from '../api';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onColumnCleared?: () => void;
}

// localStorage key for collapsed state
const COLLAPSED_KEY = 'kanban-collapsed-columns';

const getCollapsedState = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '{}');
  } catch {
    return {};
  }
};

const setCollapsedState = (columnId: string, collapsed: boolean) => {
  const state = getCollapsedState();
  state[columnId] = collapsed;
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state));
};

export function KanbanColumn({ column, tasks, onEditTask, onColumnCleared }: KanbanColumnProps) {
  const [collapsed, setCollapsed] = useState(() => getCollapsedState()[column.id] || false);
  const [clearing, setClearing] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Persist collapsed state
  const toggleCollapsed = (newState: boolean) => {
    setCollapsed(newState);
    setCollapsedState(column.id, newState);
  };

  const handleClearColumn = async () => {
    if (tasks.length === 0) return;
    if (!confirm(`Archive all ${tasks.length} task(s) in "${column.title}"? They'll be hidden but kept in the database.`)) return;
    
    setClearing(true);
    try {
      await fetch(`${api.baseUrl}/tasks/archive-column`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: column.id }),
      });
      onColumnCleared?.();
    } catch (err) {
      console.error('Failed to clear column:', err);
    } finally {
      setClearing(false);
    }
  };

  // Collapsed view - just header with count
  if (collapsed) {
    return (
      <div 
        ref={setNodeRef}
        className={`bg-gray-900 rounded-xl p-3 w-[50px] md:w-[60px] flex-shrink-0 flex flex-col h-full transition-colors cursor-pointer hover:bg-gray-800 ${
          isOver ? 'ring-2 ring-pink-500 bg-gray-800' : ''
        }`}
        onClick={() => toggleCollapsed(false)}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg">{column.icon}</span>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
          <span className="text-gray-500 text-xs writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
            {column.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-900 rounded-xl p-3 md:p-4 w-[260px] md:w-[300px] flex-shrink-0 flex flex-col h-full transition-colors ${
        isOver ? 'ring-2 ring-pink-500 bg-gray-800' : ''
      }`}
    >
      {/* Column header - fixed */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base md:text-lg">{column.icon}</span>
          <h2 className="text-white font-semibold text-sm md:text-base">{column.title}</h2>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {tasks.length > 0 && (
              <button
                onClick={handleClearColumn}
                disabled={clearing}
                className="text-gray-500 hover:text-red-400 text-xs px-1.5 py-0.5 rounded hover:bg-gray-800 transition-colors"
                title="Archive all tasks in this column"
              >
                {clearing ? '...' : '🗑️'}
              </button>
            )}
            <button
              onClick={() => toggleCollapsed(true)}
              className="text-gray-500 hover:text-gray-300 text-xs px-1.5 py-0.5 rounded hover:bg-gray-800 transition-colors"
              title="Collapse column"
            >
              ◀
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-xs mb-2 md:mb-3">{column.subtitle}</p>
      </div>

      {/* Tasks - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 task-scroll pr-1">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-gray-600 text-xs md:text-sm text-center py-6 md:py-8 border-2 border-dashed border-gray-800 rounded-lg">
              Drop tasks here
            </div>
          ) : (
            <div className="pb-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
