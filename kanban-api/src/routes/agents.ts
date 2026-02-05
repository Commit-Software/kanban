import { Router, Request, Response } from 'express';
import { getAgentUsageSummary } from '../services/agent-usage.js';
import { requireAuth } from '../middleware/auth.js';

export const agentRoutes = Router();

agentRoutes.use(requireAuth);

// GET /agents/:id/usage - Get agent's usage summary (self-check)
agentRoutes.get('/:id/usage', async (req: Request, res: Response) => {
  try {
    const summary = await getAgentUsageSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching agent usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
});
