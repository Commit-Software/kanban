import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.js';
import type { JwtPayload } from '../models/user.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'user';
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  const { valid, payload, error } = verifyAccessToken(token);

  if (!valid || !payload) {
    res.status(401).json({ error: error || 'Invalid token' });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  const { valid, payload } = verifyAccessToken(token);

  if (valid && payload) {
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

  next();
};
