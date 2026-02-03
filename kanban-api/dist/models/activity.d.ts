import { z } from 'zod';
export declare const ActivityType: z.ZodEnum<["task_created", "task_claimed", "task_completed", "task_blocked", "task_unblocked", "task_handoff", "task_updated", "task_deleted", "task_released"]>;
export type ActivityType = z.infer<typeof ActivityType>;
export declare const ActivitySchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["task_created", "task_claimed", "task_completed", "task_blocked", "task_unblocked", "task_handoff", "task_updated", "task_deleted", "task_released"]>;
    agent_id: z.ZodString;
    task_id: z.ZodOptional<z.ZodString>;
    task_title: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    type: "task_created" | "task_claimed" | "task_completed" | "task_blocked" | "task_unblocked" | "task_handoff" | "task_updated" | "task_deleted" | "task_released";
    agent_id: string;
    task_id?: string | undefined;
    task_title?: string | undefined;
    details?: Record<string, unknown> | undefined;
}, {
    id: string;
    created_at: string;
    type: "task_created" | "task_claimed" | "task_completed" | "task_blocked" | "task_unblocked" | "task_handoff" | "task_updated" | "task_deleted" | "task_released";
    agent_id: string;
    task_id?: string | undefined;
    task_title?: string | undefined;
    details?: Record<string, unknown> | undefined;
}>;
export type Activity = z.infer<typeof ActivitySchema>;
export declare const ActivityQuerySchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    offset: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    agent_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    task_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodOptional<z.ZodEnum<["task_created", "task_claimed", "task_completed", "task_blocked", "task_unblocked", "task_handoff", "task_updated", "task_deleted", "task_released"]>>>;
    since: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: "task_created" | "task_claimed" | "task_completed" | "task_blocked" | "task_unblocked" | "task_handoff" | "task_updated" | "task_deleted" | "task_released" | undefined;
    agent_id?: string | undefined;
    task_id?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    since?: string | undefined;
}, {
    type?: "task_created" | "task_claimed" | "task_completed" | "task_blocked" | "task_unblocked" | "task_handoff" | "task_updated" | "task_deleted" | "task_released" | undefined;
    agent_id?: string | undefined;
    task_id?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    since?: string | undefined;
}>;
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>;
