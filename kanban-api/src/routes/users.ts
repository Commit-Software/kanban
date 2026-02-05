import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { CreateUserSchema, UpdateUserSchema } from '../models/user.js';
import { createUser, getUserById, listUsers, updateUser, deleteUser } from '../services/users.js';
import { revokeAllUserTokens } from '../services/auth.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const userRoutes = Router();

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

userRoutes.use(requireAuth);
userRoutes.use(requireAdmin);

userRoutes.get('/', async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json({ users, count: users.length });
});

userRoutes.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

userRoutes.post('/', async (req: Request, res: Response) => {
  const { data: input, error } = handleValidation(CreateUserSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const result = await createUser(input!);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({ user: result.user });
});

userRoutes.patch('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { data: input, error } = handleValidation(UpdateUserSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const result = await updateUser(req.params.id, input!);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }

  if (input!.password) {
    await revokeAllUserTokens(req.params.id);
  }

  res.json({ user: result.user });
});

userRoutes.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const result = await deleteUser(req.params.id);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }

  await revokeAllUserTokens(req.params.id);

  res.json({ success: true });
});
