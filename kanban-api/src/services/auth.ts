import { randomUUID, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { knex } from '../db/index.js';
import type { User, UserWithPasswordHash, AuthTokens, JwtPayload } from '../models/user.js';

const BCRYPT_COST = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('⚠️  JWT_SECRET not set, using random secret (tokens will not persist across restarts)');
    return randomUUID() + randomUUID();
  }
  return secret;
};

const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    console.warn('⚠️  JWT_REFRESH_SECRET not set, using random secret (refresh tokens will not persist across restarts)');
    return randomUUID() + randomUUID();
  }
  return secret;
};

let jwtSecret: string | null = null;
let jwtRefreshSecret: string | null = null;

const getSecrets = () => {
  if (!jwtSecret) jwtSecret = getJwtSecret();
  if (!jwtRefreshSecret) jwtRefreshSecret = getJwtRefreshSecret();
  return { jwtSecret, jwtRefreshSecret };
};

const sha256 = (input: string): string => {
  return createHash('sha256').update(input).digest('hex');
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_COST);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(sha256(token), BCRYPT_COST);
};

export const verifyToken = async (token: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(sha256(token), hash);
};

export const generateTokens = (user: User): AuthTokens => {
  const { jwtSecret, jwtRefreshSecret } = getSecrets();
  
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshPayload = {
    ...payload,
    jti: randomUUID(),
  };

  const refreshToken = jwt.sign(refreshPayload, jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): { valid: boolean; payload?: JwtPayload; error?: string } => {
  const { jwtSecret } = getSecrets();
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return { valid: true, payload: decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
};

export const verifyRefreshToken = (token: string): { valid: boolean; payload?: JwtPayload; error?: string } => {
  const { jwtRefreshSecret } = getSecrets();
  
  try {
    const decoded = jwt.verify(token, jwtRefreshSecret) as JwtPayload;
    return { valid: true, payload: decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Refresh token expired' };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid refresh token' };
    }
    return { valid: false, error: 'Refresh token verification failed' };
  }
};

const stripPasswordHash = (user: UserWithPasswordHash): User => {
  const { password_hash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const isSetupRequired = async (): Promise<boolean> => {
  const count = await knex('users').count('* as count').first();
  return count?.count === 0;
};

export const login = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; tokens?: AuthTokens; error?: string }> => {
  const user = await knex('users').where({ email }).first() as UserWithPasswordHash | undefined;
  
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    return { success: false, error: 'Invalid email or password' };
  }

  const safeUser = stripPasswordHash(user);
  const tokens = generateTokens(safeUser);

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000).toISOString();
  const tokenHash = await hashToken(tokens.refreshToken);

  await knex('refresh_tokens').insert({
    id: randomUUID(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: now,
  });

  return { success: true, user: safeUser, tokens };
};

export const refreshTokens = async (
  refreshToken: string
): Promise<{ success: boolean; user?: User; tokens?: AuthTokens; error?: string }> => {
  const verification = verifyRefreshToken(refreshToken);
  if (!verification.valid || !verification.payload) {
    return { success: false, error: verification.error || 'Invalid refresh token' };
  }

  const userId = verification.payload.sub;
  const user = await knex('users').where({ id: userId }).first() as UserWithPasswordHash | undefined;
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const storedTokens = await knex('refresh_tokens')
    .where({ user_id: userId })
    .where('expires_at', '>', new Date().toISOString());

  let tokenFound = false;
  for (const storedToken of storedTokens) {
    const isMatch = await verifyToken(refreshToken, storedToken.token_hash);
    if (isMatch) {
      tokenFound = true;
      await knex('refresh_tokens').where({ id: storedToken.id }).delete();
      break;
    }
  }

  if (!tokenFound) {
    return { success: false, error: 'Refresh token not found or expired' };
  }

  const safeUser = stripPasswordHash(user);
  const newTokens = generateTokens(safeUser);

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000).toISOString();
  const tokenHash = await hashToken(newTokens.refreshToken);

  await knex('refresh_tokens').insert({
    id: randomUUID(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: now,
  });

  return { success: true, user: safeUser, tokens: newTokens };
};

export const revokeRefreshToken = async (refreshToken: string, userId: string): Promise<void> => {
  const storedTokens = await knex('refresh_tokens').where({ user_id: userId });
  
  for (const storedToken of storedTokens) {
    const isMatch = await verifyToken(refreshToken, storedToken.token_hash);
    if (isMatch) {
      await knex('refresh_tokens').where({ id: storedToken.id }).delete();
      break;
    }
  }
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await knex('refresh_tokens').where({ user_id: userId }).delete();
};

export const setupAdmin = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; tokens?: AuthTokens; error?: string }> => {
  const setupRequired = await isSetupRequired();
  if (!setupRequired) {
    return { success: false, error: 'Setup already completed' };
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  const user: UserWithPasswordHash = {
    id: randomUUID(),
    email,
    password_hash: passwordHash,
    role: 'admin',
    created_at: now,
    updated_at: now,
  };

  await knex('users').insert(user);

  const safeUser = stripPasswordHash(user);
  const tokens = generateTokens(safeUser);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000).toISOString();
  const tokenHash = await hashToken(tokens.refreshToken);

  await knex('refresh_tokens').insert({
    id: randomUUID(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: now,
  });

  return { success: true, user: safeUser, tokens };
};

export const cleanupExpiredTokens = async (): Promise<number> => {
  const now = new Date().toISOString();
  const deleted = await knex('refresh_tokens')
    .where('expires_at', '<', now)
    .delete();
  return deleted;
};
