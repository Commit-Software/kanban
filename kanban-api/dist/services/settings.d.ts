import { z } from 'zod';
export declare const AgentSettingsSchema: z.ZodObject<{
    agent_id: z.ZodString;
    model: z.ZodDefault<z.ZodString>;
    budget_limit_usd: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    agent_id: string;
    model: string;
    budget_limit_usd?: number | null | undefined;
}, {
    agent_id: string;
    model?: string | undefined;
    budget_limit_usd?: number | null | undefined;
}>;
export type AgentSettings = z.infer<typeof AgentSettingsSchema>;
export declare const UpdateAgentSettingsSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    budget_limit_usd: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    model?: string | undefined;
    budget_limit_usd?: number | null | undefined;
}, {
    model?: string | undefined;
    budget_limit_usd?: number | null | undefined;
}>;
export type UpdateAgentSettings = z.infer<typeof UpdateAgentSettingsSchema>;
export declare const getAllAgentSettings: () => Promise<AgentSettings[]>;
export declare const getAgentSettings: (agentId: string) => Promise<AgentSettings | null>;
export declare const upsertAgentSettings: (agentId: string, settings: UpdateAgentSettings) => Promise<AgentSettings>;
export declare const deleteAgentSettings: (agentId: string) => Promise<boolean>;
export declare const getAvailableModels: () => {
    id: string;
    name: string;
    cost_per_1k_input: number;
    cost_per_1k_output: number;
}[];
