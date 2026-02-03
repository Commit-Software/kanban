interface DailyUsage {
    tokens_in: number;
    tokens_out: number;
    tokens_total: number;
    cost_usd: number;
    task_count: number;
}
interface AgentUsageSummary {
    agent_id: string;
    today: DailyUsage;
    yesterday: DailyUsage;
    week_total: DailyUsage;
    week_avg: DailyUsage;
    trend_vs_yesterday: string;
    trend_vs_week_avg: string;
}
export declare const getAgentUsageSummary: (agentId: string) => Promise<AgentUsageSummary>;
export {};
