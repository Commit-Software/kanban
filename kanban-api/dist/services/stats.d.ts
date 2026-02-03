import { z } from 'zod';
export declare const UsageStatsQuerySchema: z.ZodObject<{
    agent_id: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    agent_id?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
}, {
    agent_id?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
}>;
export type UsageStatsQuery = z.infer<typeof UsageStatsQuerySchema>;
export declare const getUsageStats: (query: UsageStatsQuery) => Promise<{
    totals: {
        agent_count: number;
        total_input_tokens: number;
        total_output_tokens: number;
        total_tokens: number;
        total_cost_usd: number;
        task_count: number;
    };
    by_agent: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        task_count: number;
        agent: string;
    }[];
    by_model: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        task_count: number;
        model: string;
    }[];
    by_day: {
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        task_count: number;
        day: string;
    }[];
    recent_tasks: {
        id: any;
        title: any;
        agent: any;
        model: any;
        input_tokens: any;
        output_tokens: any;
        total_tokens: any;
        cost_usd: any;
        completed_at: any;
    }[];
}>;
