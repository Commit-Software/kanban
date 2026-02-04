import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus } from '../types';
import { COLUMNS } from '../types';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    skills_required?: string[];
    due_date?: string | null;
  }) => void;
  onDelete: (taskId: string) => void;
}

export function EditTaskModal({ task, isOpen, onClose, onSave, onDelete }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('backlog');
  const [priority, setPriority] = useState(3);
  const [skills, setSkills] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync form state from task prop
  const syncFromTask = useCallback((t: Task) => {
    setTitle(t.title);
    setDescription(t.description || '');
    setStatus(t.status);
    setPriority(t.priority);
    setSkills(t.skills_required.join(', '));
    setDueDate(t.due_date || '');
    setShowDeleteConfirm(false);
  }, []);

  // Update form when task changes
  useEffect(() => {
    if (task) {
      syncFromTask(task);
    }
  }, [task, syncFromTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;

    onSave(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      skills_required: skills.split(',').map(s => s.trim()).filter(Boolean),
      due_date: dueDate || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-gray-800 rounded-t-xl md:rounded-xl p-4 md:p-6 w-full md:max-w-lg border-t md:border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg md:text-xl font-semibold">Edit Task</h2>
          <span className="text-gray-500 text-xs font-mono">{task.id.slice(0, 8)}...</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              placeholder="Task title..."
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Description / Requirements</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500 resize-none"
              rows={4}
              placeholder="Detailed requirements for the agent..."
            />
            <p className="text-gray-500 text-xs mt-1">
              💡 Agents will see this when they pick up the task.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              >
                {COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.icon} {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              >
                <option value={1}>1 - Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Due Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 rounded-lg transition-colors text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Required Skills</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              placeholder="research, coding, analysis..."
            />
          </div>

          {/* Metadata section */}
          <div className="bg-gray-900 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Created by</span>
              <span className="text-gray-300">{task.created_by}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-300">{new Date(task.created_at).toLocaleDateString()}</span>
            </div>
            {task.claimed_by && (
              <div className="flex justify-between">
                <span className="text-gray-500">Claimed by</span>
                <span className="text-green-400">🤖 {task.claimed_by}</span>
              </div>
            )}
            {/* Usage/Cost info */}
            {(task.usage_cost_usd != null || task.usage_input_tokens != null) && (
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-500">Usage</span>
                  {task.usage_cost_usd != null && (
                    <span className="text-emerald-400 font-medium">💰 ${task.usage_cost_usd.toFixed(2)}</span>
                  )}
                </div>
                {task.usage_input_tokens != null && task.usage_output_tokens != null && (
                  <div className="flex justify-between text-gray-400">
                    <span>Tokens: {((task.usage_input_tokens + task.usage_output_tokens) / 1000).toFixed(1)}K</span>
                    <span className="text-gray-500">({task.usage_input_tokens.toLocaleString()} in / {task.usage_output_tokens.toLocaleString()} out)</span>
                  </div>
                )}
                {task.usage_model && (
                  <div className="text-gray-500 mt-1">Model: {task.usage_model}</div>
                )}
              </div>
            )}
            {task.output != null && (
              <div className="mt-2">
                <span className="text-gray-500">Output:</span>
                <pre className="text-gray-300 text-xs bg-gray-800 rounded p-2 mt-1 overflow-x-auto max-h-24">
                  {JSON.stringify(task.output as Record<string, unknown>, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {!showDeleteConfirm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-900 hover:bg-red-800 text-red-300 px-3 md:px-4 py-3 md:py-2 rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 md:py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-3 md:py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span className="text-red-400 text-sm flex items-center">Delete?</span>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 md:py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 md:py-2 rounded-lg transition-colors"
                >
                  Yes, Delete
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
