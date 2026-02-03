import { Router } from 'express';
import { ActivityQuerySchema } from '../models/activity.js';
import { listActivities, countActivities } from '../services/activities.js';
import { ZodError } from 'zod';
export const activityRoutes = Router();
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
// GET /activities - List activities with filters
activityRoutes.get('/', async (req, res) => {
    const { data: query, error } = handleValidation(ActivityQuerySchema, req.query);
    if (error) {
        return res.status(400).json({ error });
    }
    const [activities, total] = await Promise.all([
        listActivities(query),
        countActivities(query),
    ]);
    res.json({
        activities,
        count: activities.length,
        total,
    });
});
