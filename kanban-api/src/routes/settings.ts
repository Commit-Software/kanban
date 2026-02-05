import { Router, Request, Response } from 'express';
import { 
  getAllAgentSettings, 
  getAgentSettings, 
  upsertAgentSettings, 
  deleteAgentSettings,
  getAvailableModels,
  UpdateAgentSettingsSchema 
} from '../services/settings.js';
import { ZodError } from 'zod';
import { requireAuth } from '../middleware/auth.js';

export const settingsRoutes = Router();

settingsRoutes.use(requireAuth);

// Helper to handle Zod validation errors
const handleValidation = <T>(schema: { parse: (data: unknown) => T }, data: unknown): { data?: T; error?: string } => {
  try {
    return { data: schema.parse(data) };
  } catch (e) {
    if (e instanceof ZodError) {
      return { error: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ') };
    }
    throw e;
  }
};

// GET /settings/models - Get available models
settingsRoutes.get('/models', async (_req: Request, res: Response) => {
  const models = getAvailableModels();
  res.json({ models });
});

// GET /settings/agents - Get all agent settings
settingsRoutes.get('/agents', async (_req: Request, res: Response) => {
  const settings = await getAllAgentSettings();
  res.json({ agents: settings });
});

// GET /settings/agents/:agentId - Get specific agent settings
settingsRoutes.get('/agents/:agentId', async (req: Request<{ agentId: string }>, res: Response) => {
  const settings = await getAgentSettings(req.params.agentId);
  if (!settings) {
    return res.status(404).json({ error: 'Agent settings not found' });
  }
  res.json(settings);
});

// PUT /settings/agents/:agentId - Create or update agent settings
settingsRoutes.put('/agents/:agentId', async (req: Request<{ agentId: string }>, res: Response) => {
  const { data: input, error } = handleValidation(UpdateAgentSettingsSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  
  const settings = await upsertAgentSettings(req.params.agentId, input!);
  res.json(settings);
});

// DELETE /settings/agents/:agentId - Delete agent settings
settingsRoutes.delete('/agents/:agentId', async (req: Request<{ agentId: string }>, res: Response) => {
  const deleted = await deleteAgentSettings(req.params.agentId);
  if (!deleted) {
    return res.status(404).json({ error: 'Agent settings not found' });
  }
  res.status(204).send();
});
