import type { Task, CreateTask, UpdateTask, TaskQuery, UsageData } from '../models/task.js';
export declare const buildTask: (input: CreateTask) => Omit<Task, "id" | "created_at" | "updated_at"> & {
    id: string;
    created_at: string;
    updated_at: string;
};
export declare const createTask: (input: CreateTask) => Promise<Task>;
export declare const getTaskById: (id: string) => Promise<Task | null>;
export declare const updateTask: (id: string, updates: UpdateTask, agentId?: string) => Promise<{
    success: boolean;
    task?: Task;
    error?: string;
}>;
export declare const deleteTask: (id: string, agentId?: string) => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const listTasks: (query: TaskQuery) => Promise<Task[]>;
export declare const claimTask: (taskId: string, agentId: string) => Promise<{
    success: boolean;
    task?: Task;
    error?: string;
}>;
export declare const completeTask: (taskId: string, agentId: string, output?: unknown, usage?: UsageData) => Promise<{
    success: boolean;
    task?: Task;
    error?: string;
}>;
export declare const blockTask: (taskId: string, agentId: string, reason: string) => Promise<{
    success: boolean;
    task?: Task;
    error?: string;
}>;
export declare const handoffTask: (taskId: string, agentId: string, output: unknown | undefined, nextTaskInput: Omit<CreateTask, "created_by">) => Promise<{
    success: boolean;
    completedTask?: Task;
    nextTask?: Task;
    error?: string;
}>;
export declare const releaseTimedOutTasks: () => Promise<number>;
export declare const archiveColumn: (status: string) => Promise<{
    count: number;
}>;
