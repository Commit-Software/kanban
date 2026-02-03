import { Router } from 'express';
import { getAllAgentSettings, getAgentSettings, upsertAgentSettings, deleteAgentSettings, getAvailableModels, UpdateAgentSettingsSchema } from '../services/settings.js';
import { ZodError } from 'zod';
export const settingsRoutes = Router();
// Helper to handle Zod validation errors
const handleValidation = (schema, data) => {
    try {
        return { data: schema.parse(data) };
    }
    catch (e) {
        if (e instanceof ZodError) {
            return { error: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ') };
        }
        throw e;
    }
};
// GET /settings/models - Get available models
settingsRoutes.get('/models', async (_req, res) => {
    const models = getAvailableModels();
    res.json({ models });
});
// GET /settings/agents - Get all agent settings
settingsRoutes.get('/agents', async (_req, res) => {
    const settings = await getAllAgentSettings();
    res.json({ agents: settings });
});
// GET /settings/agents/:agentId - Get specific agent settings
settingsRoutes.get('/agents/:agentId', async (req, res) => {
    const settings = await getAgentSettings(req.params.agentId);
    if (!settings) {
        return res.status(404).json({ error: 'Agent settings not found' });
    }
    res.json(settings);
});
// PUT /settings/agents/:agentId - Create or update agent settings
settingsRoutes.put('/agents/:agentId', async (req, res) => {
    const { data: input, error } = handleValidation(UpdateAgentSettingsSchema, req.body);
    if (error) {
        return res.status(400).json({ error });
    }
    const settings = await upsertAgentSettings(req.params.agentId, input);
    res.json(settings);
});
// DELETE /settings/agents/:agentId - Delete agent settings
settingsRoutes.delete('/agents/:agentId', async (req, res) => {
    const deleted = await deleteAgentSettings(req.params.agentId);
    if (!deleted) {
        return res.status(404).json({ error: 'Agent settings not found' });
    }
    res.status(204).send();
});
