import { useState } from 'react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    status: string;
    priority: number;
    skills_required: string[];
    due_date?: string | null;
    created_by: string;
  }) => void;
}

export function NewTaskModal({ isOpen, onClose, onSubmit }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('backlog');
  const [priority, setPriority] = useState(3);
  const [skills, setSkills] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createdBy, setCreatedBy] = useState('ken');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      skills_required: skills.split(',').map(s => s.trim()).filter(Boolean),
      due_date: dueDate || null,
      created_by: createdBy,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setStatus('backlog');
    setPriority(3);
    setSkills('');
    setDueDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-gray-800 rounded-t-xl md:rounded-xl p-4 md:p-6 w-full md:max-w-md border-t md:border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white text-lg md:text-xl font-semibold mb-4">+ New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              placeholder="Task title..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500 resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              >
                <option value="backlog">Backlog</option>
                <option value="ready">Ready</option>
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
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              placeholder="research, coding, analysis..."
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Created By</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-pink-500"
              placeholder="Your name..."
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
