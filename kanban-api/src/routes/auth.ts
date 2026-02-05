import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { LoginRequestSchema, SetupRequestSchema, RefreshTokenSchema } from '../models/user.js';
import { isSetupRequired, setupAdmin, login, refreshTokens, revokeRefreshToken } from '../services/auth.js';
import { getUserById } from '../services/users.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

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

authRoutes.get('/status', async (_req: Request, res: Response) => {
  const setupRequired = await isSetupRequired();
  res.json({ setupRequired });
});

authRoutes.post('/setup', async (req: Request, res: Response) => {
  const { data: input, error } = handleValidation(SetupRequestSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const result = await setupAdmin(input!.email, input!.password);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({ user: result.user, tokens: result.tokens });
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  const { data: input, error } = handleValidation(LoginRequestSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const result = await login(input!.email, input!.password);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json({ user: result.user, tokens: result.tokens });
});

authRoutes.post('/refresh', async (req: Request, res: Response) => {
  const { data: input, error } = handleValidation(RefreshTokenSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const result = await refreshTokens(input!.refreshToken);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json({ user: result.user, tokens: result.tokens });
});

authRoutes.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (refreshToken && req.user) {
    await revokeRefreshToken(refreshToken, req.user.id);
  }

  res.json({ success: true });
});

authRoutes.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});
