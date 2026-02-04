import { useState } from 'react';

interface HelpSection {
  title: string;
  content: string;
}

interface HelpTooltipProps {
  title: string;
  sections: HelpSection[];
}

export function HelpTooltip({ title, sections }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-800"
        aria-label="Help"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path strokeWidth="2" d="M12 16v-4m0-4h.01" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-5 w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                <span className="text-blue-400">ℹ️</span> {title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-pink-400 font-medium text-sm mb-1">{section.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-5 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Pre-defined help content for each page
// eslint-disable-next-line react-refresh/only-export-components
export const HELP_CONTENT = {
  kanban: {
    title: 'Kanban Board Help',
    sections: [
      {
        title: '📋 What is this?',
        content: 'The Kanban board visualizes your tasks across different stages. Drag and drop tasks between columns to update their status.',
      },
      {
        title: '🔴🟢 Connection Status',
        content: `The dot next to the title shows real-time connection:
• 🟢 Green = WebSocket connected (instant updates)
• 🔴 Red = Disconnected (still works, polls every few seconds)

If red, the board still functions — you just won't see instant updates when others make changes.`,
      },
      {
        title: '🎯 Columns',
        content: `• Backlog — Ideas and future work
• Ready — Tasks waiting for an agent
• In Progress — Agent actively working
• Review — Awaiting verification
• Done — Completed tasks
• Blocked — Needs attention`,
      },
      {
        title: '✏️ Managing Tasks',
        content: `• Click "+ New Task" to create a task
• Click any task card to edit details
• Drag cards between columns to change status
• Use filters to find specific tasks`,
      },
      {
        title: '🗑️ Clear Column',
        content: 'Click the trash icon on a column header to archive all tasks in that column. Archived tasks move to the Archive page.',
      },
      {
        title: '🤖 Agent Integration',
        content: 'Tasks in "Ready" can be claimed by AI agents. The agent badge shows who is working on it. Usage costs are tracked automatically.',
      },
    ],
  },
  dashboard: {
    title: 'Dashboard Help',
    sections: [
      {
        title: '📊 What is this?',
        content: 'The dashboard shows usage statistics and costs across all agents and tasks.',
      },
      {
        title: '💰 Cost Tracking',
        content: 'See total spend, tokens used, and costs broken down by agent. Track daily trends to monitor usage.',
      },
      {
        title: '🤖 Agent Self-Check',
        content: 'Select an agent from the dropdown to see their personal usage stats including today, yesterday, and weekly totals.',
      },
      {
        title: '📈 Trends',
        content: 'Percentage changes show how usage compares to previous periods. Green = decrease, Red = increase in spending.',
      },
    ],
  },
  archive: {
    title: 'Archive Help',
    sections: [
      {
        title: '📦 What is this?',
        content: 'The archive stores historical tasks that have been cleared from the Kanban board. Browse and search past work.',
      },
      {
        title: '🔍 Filters',
        content: `• Search — Find tasks by title or description
• Agent — Filter by who worked on it
• From/To — Date range for when archived`,
      },
      {
        title: '↩️ Restore',
        content: 'Click the restore button on any task to bring it back to the Backlog column on the Kanban board.',
      },
      {
        title: '💰 Cost History',
        content: 'Each archived task shows its usage cost, helping you track historical spend per task.',
      },
    ],
  },
  settings: {
    title: 'Settings Help',
    sections: [
      {
        title: '⚙️ What is this?',
        content: 'Configure your Kanban board preferences and API connections.',
      },
      {
        title: '🔗 API Settings',
        content: 'Set the API URL if running the backend on a different server. Default is localhost:3000.',
      },
      {
        title: '🎨 Display',
        content: 'Customize how tasks are displayed, including compact mode and default filters.',
      },
      {
        title: '🤖 Agent Config',
        content: 'Configure which agents can access the board and their permissions.',
      },
    ],
  },
};
