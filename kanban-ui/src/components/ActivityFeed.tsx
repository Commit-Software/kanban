import { useState, useEffect, useCallback } from 'react';
import type { Activity, ActivityType } from '../types';
import { ACTIVITY_ICONS } from '../types';
import { api } from '../api';

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// Get action verb for activity type
function getActionVerb(type: ActivityType): string {
  switch (type) {
    case 'task_created': return 'created';
    case 'task_claimed': return 'claimed';
    case 'task_completed': return 'completed';
    case 'task_blocked': return 'blocked';
    case 'task_unblocked': return 'unblocked';
    case 'task_handoff': return 'handed off';
    case 'task_updated': return 'updated';
    case 'task_deleted': return 'deleted';
    case 'task_released': return 'released';
    default: return 'acted on';
  }
}

interface ActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityFeed({ isOpen, onClose }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await api.listActivities({ limit: 50 });
      setActivities(data.activities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open and poll every 5 seconds
  useEffect(() => {
    if (isOpen) {
      fetchActivities();
      const interval = setInterval(fetchActivities, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchActivities]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - mobile only */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-full md:w-80 bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl"
        style={{
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {/* Header - with safe area padding inside */}
        <div 
          className="flex-shrink-0 flex items-center justify-between px-4 pb-3 border-b border-gray-800"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
        >
          <h2 className="text-white font-semibold flex items-center gap-2">
            📜 Activity Feed
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchActivities}
              className="text-gray-400 hover:text-white p-2 transition-colors"
              title="Refresh"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 text-xl transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Activity list */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {loading ? (
            <div className="p-4 text-gray-500 text-center">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No activity yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {activities.map((activity) => (
                <div key={activity.id} className="p-3 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">
                      {ACTIVITY_ICONS[activity.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-sm">
                        <span className="font-medium text-white">{activity.agent_id}</span>
                        {' '}{getActionVerb(activity.type)}
                      </p>
                      {activity.task_title && (
                        <p className="text-gray-400 text-sm truncate mt-0.5">
                          "{activity.task_title}"
                        </p>
                      )}
                      <p className="text-gray-600 text-xs mt-1">
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
