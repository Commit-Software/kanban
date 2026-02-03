import { Activity, ActivityQuery, ActivityType } from '../models/activity.js';
export declare const logActivity: (type: ActivityType, agentId: string, taskId?: string, taskTitle?: string, details?: Record<string, unknown>) => Promise<Activity>;
export declare const listActivities: (query?: ActivityQuery) => Promise<Activity[]>;
export declare const countActivities: (query?: Omit<ActivityQuery, "limit" | "offset">) => Promise<number>;
