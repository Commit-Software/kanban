import { knex } from '../db/index.js';
import { z } from 'zod';

// Agent settings schema
export const AgentSettingsSchema = z.object({
  agent_id: z.string(),
  model: z.string().default('claude-sonnet-4'),
  budget_limit_usd: z.number().nullable().optional(),
});

export type AgentSettings = z.infer<typeof AgentSettingsSchema>;

// Update agent settings schema
export const UpdateAgentSettingsSchema = z.object({
  model: z.string().optional(),
  budget_limit_usd: z.number().nullable().optional(),
});

export type UpdateAgentSettings = z.infer<typeof UpdateAgentSettingsSchema>;

// Get all agent settings
export const getAllAgentSettings = async (): Promise<AgentSettings[]> => {
  const rows = await knex('agent_settings').select('*');
  return rows;
};

// Get settings for a specific agent
export const getAgentSettings = async (agentId: string): Promise<AgentSettings | null> => {
  const row = await knex('agent_settings').where({ agent_id: agentId }).first();
  return row || null;
};

// Create or update agent settings
export const upsertAgentSettings = async (
  agentId: string, 
  settings: UpdateAgentSettings
): Promise<AgentSettings> => {
  const now = new Date().toISOString();
  
  const existing = await getAgentSettings(agentId);
  
  if (existing) {
    // Update existing
    await knex('agent_settings')
      .where({ agent_id: agentId })
      .update({
        ...settings,
        updated_at: now,
      });
  } else {
    // Create new
    await knex('agent_settings').insert({
      agent_id: agentId,
      model: settings.model || 'claude-sonnet-4',
      budget_limit_usd: settings.budget_limit_usd ?? null,
      created_at: now,
      updated_at: now,
    });
  }
  
  return (await getAgentSettings(agentId))!;
};

// Delete agent settings
export const deleteAgentSettings = async (agentId: string): Promise<boolean> => {
  const deleted = await knex('agent_settings').where({ agent_id: agentId }).delete();
  return deleted > 0;
};

// Available models (could be configurable later)
export const getAvailableModels = () => [
  { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', cost_per_1k_input: 0.015, cost_per_1k_output: 0.075 },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', cost_per_1k_input: 0.003, cost_per_1k_output: 0.015 },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', cost_per_1k_input: 0.0008, cost_per_1k_output: 0.004 },
  { id: 'gpt-4o', name: 'GPT-4o', cost_per_1k_input: 0.005, cost_per_1k_output: 0.015 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost_per_1k_input: 0.00015, cost_per_1k_output: 0.0006 },
];
