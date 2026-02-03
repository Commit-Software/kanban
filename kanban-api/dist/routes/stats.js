import { Router } from 'express';
import { getUsageStats, UsageStatsQuerySchema } from '../services/stats.js';
import { ZodError } from 'zod';
export const statsRoutes = Router();
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
// GET /stats/usage - Get usage statistics
statsRoutes.get('/usage', async (req, res) => {
    const { data: query, error } = handleValidation(UsageStatsQuerySchema, req.query);
    if (error) {
        return res.status(400).json({ error });
    }
    const stats = await getUsageStats(query);
    res.json(stats);
});
