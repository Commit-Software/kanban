import { z } from 'zod';
export declare const TaskStatus: {
    readonly BACKLOG: "backlog";
    readonly READY: "ready";
    readonly IN_PROGRESS: "in_progress";
    readonly REVIEW: "review";
    readonly DONE: "done";
    readonly BLOCKED: "blocked";
    readonly ARCHIVED: "archived";
};
export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["backlog", "ready", "in_progress", "review", "done", "blocked", "archived"]>;
    priority: z.ZodDefault<z.ZodNumber>;
    skills_required: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    claimed_by: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    claimed_at: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    timeout_minutes: z.ZodDefault<z.ZodNumber>;
    parent_task_id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    output: z.ZodDefault<z.ZodNullable<z.ZodUnknown>>;
    blocked_reason: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    due_date: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    usage_input_tokens: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    usage_output_tokens: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    usage_model: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    usage_cost_usd: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    created_by: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    due_date: string | null;
    usage_input_tokens: number | null;
    id: string;
    title: string;
    status: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | "archived";
    priority: number;
    skills_required: string[];
    claimed_by: string | null;
    claimed_at: string | null;
    timeout_minutes: number;
    parent_task_id: string | null;
    blocked_reason: string | null;
    usage_output_tokens: number | null;
    usage_model: string | null;
    usage_cost_usd: number | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    description?: string | undefined;
    output?: unknown;
}, {
    id: string;
    title: string;
    status: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | "archived";
    created_by: string;
    created_at: string;
    updated_at: string;
    due_date?: string | null | undefined;
    usage_input_tokens?: number | null | undefined;
    description?: string | undefined;
    priority?: number | undefined;
    skills_required?: string[] | undefined;
    claimed_by?: string | null | undefined;
    claimed_at?: string | null | undefined;
    timeout_minutes?: number | undefined;
    parent_task_id?: string | null | undefined;
    output?: unknown;
    blocked_reason?: string | null | undefined;
    usage_output_tokens?: number | null | undefined;
    usage_model?: string | null | undefined;
    usage_cost_usd?: number | null | undefined;
}>;
export type Task = z.infer<typeof TaskSchema>;
export declare const CreateTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["backlog", "ready", "in_progress", "review", "done", "blocked"]>>;
    priority: z.ZodDefault<z.ZodNumber>;
    skills_required: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    timeout_minutes: z.ZodDefault<z.ZodNumber>;
    parent_task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    due_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_by: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    status: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked";
    priority: number;
    skills_required: string[];
    timeout_minutes: number;
    created_by: string;
    due_date?: string | null | undefined;
    description?: string | undefined;
    parent_task_id?: string | null | undefined;
}, {
    title: string;
    created_by: string;
    due_date?: string | null | undefined;
    description?: string | undefined;
    status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | undefined;
    priority?: number | undefined;
    skills_required?: string[] | undefined;
    timeout_minutes?: number | undefined;
    parent_task_id?: string | null | undefined;
}>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export declare const UpdateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["backlog", "ready", "in_progress", "review", "done", "blocked"]>>;
    priority: z.ZodOptional<z.ZodNumber>;
    skills_required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeout_minutes: z.ZodOptional<z.ZodNumber>;
    blocked_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    due_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    due_date?: string | null | undefined;
    title?: string | undefined;
    description?: string | undefined;
    status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | undefined;
    priority?: number | undefined;
    skills_required?: string[] | undefined;
    timeout_minutes?: number | undefined;
    blocked_reason?: string | null | undefined;
}, {
    due_date?: string | null | undefined;
    title?: string | undefined;
    description?: string | undefined;
    status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | undefined;
    priority?: number | undefined;
    skills_required?: string[] | undefined;
    timeout_minutes?: number | undefined;
    blocked_reason?: string | null | undefined;
}>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export declare const ClaimTaskSchema: z.ZodObject<{
    agent_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agent_id: string;
}, {
    agent_id: string;
}>;
export type ClaimTask = z.infer<typeof ClaimTaskSchema>;
export declare const UsageDataSchema: z.ZodObject<{
    input_tokens: z.ZodNumber;
    output_tokens: z.ZodNumber;
    model: z.ZodString;
    cost_usd: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd?: number | undefined;
}, {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd?: number | undefined;
}>;
export type UsageData = z.infer<typeof UsageDataSchema>;
export declare const CompleteTaskSchema: z.ZodObject<{
    output: z.ZodOptional<z.ZodUnknown>;
    usage: z.ZodOptional<z.ZodObject<{
        input_tokens: z.ZodNumber;
        output_tokens: z.ZodNumber;
        model: z.ZodString;
        cost_usd: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        model: string;
        input_tokens: number;
        output_tokens: number;
        cost_usd?: number | undefined;
    }, {
        model: string;
        input_tokens: number;
        output_tokens: number;
        cost_usd?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    output?: unknown;
    usage?: {
        model: string;
        input_tokens: number;
        output_tokens: number;
        cost_usd?: number | undefined;
    } | undefined;
}, {
    output?: unknown;
    usage?: {
        model: string;
        input_tokens: number;
        output_tokens: number;
        cost_usd?: number | undefined;
    } | undefined;
}>;
export type CompleteTask = z.infer<typeof CompleteTaskSchema>;
export declare const BlockTaskSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type BlockTask = z.infer<typeof BlockTaskSchema>;
export declare const HandoffTaskSchema: z.ZodObject<{
    output: z.ZodOptional<z.ZodUnknown>;
    next_task: z.ZodObject<Omit<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<["backlog", "ready", "in_progress", "review", "done", "blocked"]>>;
        priority: z.ZodDefault<z.ZodNumber>;
        skills_required: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        timeout_minutes: z.ZodDefault<z.ZodNumber>;
        parent_task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        due_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        created_by: z.ZodString;
    }, "created_by">, "strip", z.ZodTypeAny, {
        title: string;
        status: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked";
        priority: number;
        skills_required: string[];
        timeout_minutes: number;
        due_date?: string | null | undefined;
        description?: string | undefined;
        parent_task_id?: string | null | undefined;
    }, {
        title: string;
        due_date?: string | null | undefined;
        description?: string | undefined;
        status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | undefined;
        priority?: number | undefined;
        skills_required?: string[] | undefined;
        timeout_minutes?: number | undefined;
        parent_task_id?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    next_task: {
        title: string;
        status: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked";
        priority: number;
        skills_required: string[];
        timeout_minutes: number;
        due_date?: string | null | undefined;
        description?: string | undefined;
        parent_task_id?: string | null | undefined;
    };
    output?: unknown;
}, {
    next_task: {
        title: string;
        due_date?: string | null | undefined;
        description?: string | undefined;
        status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | undefined;
        priority?: number | undefined;
        skills_required?: string[] | undefined;
        timeout_minutes?: number | undefined;
        parent_task_id?: string | null | undefined;
    };
    output?: unknown;
}>;
export type HandoffTask = z.infer<typeof HandoffTaskSchema>;
export declare const TaskQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["backlog", "ready", "in_progress", "review", "done", "blocked", "archived"]>>;
    skills: z.ZodOptional<z.ZodString>;
    claimed_by: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | "archived" | undefined;
    claimed_by?: string | undefined;
    skills?: string | undefined;
}, {
    status?: "backlog" | "ready" | "in_progress" | "review" | "done" | "blocked" | "archived" | undefined;
    claimed_by?: string | undefined;
    skills?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type TaskQuery = z.infer<typeof TaskQuerySchema>;
