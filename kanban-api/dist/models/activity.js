import { z } from 'zod';
// Activity types for the feed
export const ActivityType = z.enum([
    'task_created',
    'task_claimed',
    'task_completed',
    'task_blocked',
    'task_unblocked',
    'task_handoff',
    'task_updated',
    'task_deleted',
    'task_released', // When an agent unclaims
]);
// Activity record schema
export const ActivitySchema = z.object({
    id: z.string().uuid(),
    type: ActivityType,
    agent_id: z.string(),
    task_id: z.string().uuid().optional(),
    task_title: z.string().optional(),
    details: z.record(z.unknown()).optional(),
    created_at: z.string().datetime(),
});
// Query params for listing activities
export const ActivityQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    agent_id: z.string().optional(),
    task_id: z.string().uuid().optional(),
    type: ActivityType.optional(),
    since: z.string().datetime().optional(), // Activities after this timestamp
}).partial();
