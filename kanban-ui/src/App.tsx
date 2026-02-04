import { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { COLUMNS } from './types';
import type { Task, TaskStatus, Filters } from './types';
import { api } from './api';
import { useSocket } from './useSocket';
import { KanbanColumn } from './components/KanbanColumn';
import { StatsBar } from './components/StatsBar';
import { NewTaskModal } from './components/NewTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { FilterBar } from './components/FilterBar';
import { ActivityFeed } from './components/ActivityFeed';
import { HelpTooltip, HELP_CONTENT } from './components/HelpTooltip';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    agent: '',
    skill: '',
    priority: '',
    search: '',
  });

  // Support both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.listTasks();
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks. Is the API running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket handlers for real-time updates
  const { connected: wsConnected } = useSocket({
    'task:created': ({ task }) => {
      console.log('🔔 Task created:', task.title);
      setTasks(prev => [...prev, task]);
    },
    'task:updated': ({ task }) => {
      console.log('🔔 Task updated:', task.title);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      // Update editing task if it's the one being edited
      setEditingTask(prev => prev?.id === task.id ? task : prev);
    },
    'task:deleted': ({ taskId }) => {
      console.log('🔔 Task deleted:', taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      // Close edit modal if deleted task was being edited
      setEditingTask(prev => prev?.id === taskId ? null : prev);
    },
    'task:claimed': ({ task }) => {
      console.log('🔔 Task claimed:', task.title, 'by', task.claimed_by);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    },
    'task:completed': ({ task }) => {
      console.log('🔔 Task completed:', task.title);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      // Confetti for remote completions too!
      if (task.status === 'done') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ec4899', '#8b5cf6', '#06b6d4'],
        });
      }
    },
    'task:blocked': ({ task }) => {
      console.log('🔔 Task blocked:', task.title);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    },
  });

  // Initial fetch only — WebSocket handles real-time updates
  // Fallback polling every 30s in case WS disconnects
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleCreateTask = async (taskData: Parameters<typeof api.createTask>[0]) => {
    try {
      await api.createTask(taskData);
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Parameters<typeof api.updateTask>[1]) => {
    try {
      await api.updateTask(taskId, updates);
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistically update UI
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );

    // 🎊 Confetti when task moves to Done!
    if (newStatus === 'done') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'],
      });
    }

    // Update on server
    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to move task:', err);
      fetchTasks(); // Revert on error
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Agent filter - check claimed_by OR created_by
      if (filters.agent && task.claimed_by !== filters.agent && task.created_by !== filters.agent) {
        return false;
      }
      
      // Skill filter
      if (filters.skill && !task.skills_required.includes(filters.skill)) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && task.priority !== parseInt(filters.priority)) {
        return false;
      }
      
      // Search filter - check title and description
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(search);
        const matchesDesc = task.description?.toLowerCase().includes(search) || false;
        if (!matchesTitle && !matchesDesc) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, filters]);

  const getTasksForColumn = (status: string) => {
    return filteredTasks.filter(t => t.status === status);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-950 flex flex-col overflow-hidden">
      {/* Header - responsive */}
      <div className="flex-shrink-0 p-4 md:p-6 pb-2 md:pb-4">
        <div className="max-w-[1800px] mx-auto">
          {/* Mobile: stacked layout */}
          <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-xl md:text-2xl font-bold">Kanban Board</h1>
                <HelpTooltip {...HELP_CONTENT.kanban} />
                {/* WebSocket connection indicator */}
                <span 
                  className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
                  title={wsConnected ? 'Real-time connected' : 'Disconnected (polling fallback)'}
                />
              </div>
            </div>
            
            {/* Stats and buttons - row on mobile */}
            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6">
              <StatsBar tasks={tasks} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsActivityOpen(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                  title="Activity Feed"
                >
                  📜
                </button>
                <button
                  onClick={() => setIsNewTaskOpen(true)}
                  className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap"
                >
                  + New Task
                </button>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mt-3">
            <FilterBar 
              tasks={tasks} 
              filters={filters} 
              onFiltersChange={setFilters} 
            />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-2 bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Kanban columns with drag-and-drop - fills remaining height */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 min-h-0">
          <div className="flex gap-3 md:gap-4 h-full pb-4 max-w-[1800px] mx-auto justify-center">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksForColumn(column.id)}
                onEditTask={setEditingTask}
                onColumnCleared={fetchTasks}
              />
            ))}
          </div>
        </div>
      </DndContext>

      {/* New task modal */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSubmit={handleCreateTask}
      />

      {/* Edit task modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Activity Feed panel */}
      <ActivityFeed
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />
    </div>
  );
}

export default App;
