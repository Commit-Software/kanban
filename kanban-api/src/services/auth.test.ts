import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { knex, initializeDb, closeDb } from '../db/index.js';
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  isSetupRequired,
  setupAdmin,
  login,
  refreshTokens,
  revokeAllUserTokens,
} from './auth.js';
import { createUser } from './users.js';
import type { User } from '../models/user.js';

beforeAll(async () => {
  await initializeDb();
});

afterAll(async () => {
  await closeDb();
});

beforeEach(async () => {
  await knex('refresh_tokens').delete();
  await knex('users').delete();
});

describe('hashPassword / verifyPassword', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'mySecurePassword123';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'mySecurePassword123';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for same password', async () => {
    const password = 'testPassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});

describe('generateTokens / verifyAccessToken / verifyRefreshToken', () => {
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('should generate valid access and refresh tokens', () => {
    const tokens = generateTokens(mockUser);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });

  it('should verify a valid access token', () => {
    const tokens = generateTokens(mockUser);
    const result = verifyAccessToken(tokens.accessToken);

    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe(mockUser.id);
    expect(result.payload?.email).toBe(mockUser.email);
    expect(result.payload?.role).toBe(mockUser.role);
  });

  it('should verify a valid refresh token', () => {
    const tokens = generateTokens(mockUser);
    const result = verifyRefreshToken(tokens.refreshToken);

    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe(mockUser.id);
  });

  it('should reject an invalid access token', () => {
    const result = verifyAccessToken('invalid.token.here');

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject access token verified as refresh token', () => {
    const tokens = generateTokens(mockUser);
    const result = verifyRefreshToken(tokens.accessToken);

    expect(result.valid).toBe(false);
  });
});

describe('isSetupRequired', () => {
  it('should return true when no users exist', async () => {
    const required = await isSetupRequired();
    expect(required).toBe(true);
  });

  it('should return false when users exist', async () => {
    await createUser({
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    const required = await isSetupRequired();
    expect(required).toBe(false);
  });
});

describe('setupAdmin', () => {
  it('should create admin user when no users exist', async () => {
    const result = await setupAdmin('admin@example.com', 'securePassword123');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('admin@example.com');
    expect(result.user?.role).toBe('admin');
    expect(result.tokens?.accessToken).toBeDefined();
    expect(result.tokens?.refreshToken).toBeDefined();
  });

  it('should fail when setup already completed', async () => {
    await setupAdmin('admin@example.com', 'securePassword123');

    const result = await setupAdmin('another@example.com', 'password456');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already completed');
  });
});

describe('login', () => {
  beforeEach(async () => {
    await createUser({
      email: 'user@example.com',
      password: 'correctPassword',
      role: 'user',
    });
  });

  it('should login with correct credentials', async () => {
    const result = await login('user@example.com', 'correctPassword');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('user@example.com');
    expect(result.tokens?.accessToken).toBeDefined();
    expect(result.tokens?.refreshToken).toBeDefined();
  });

  it('should reject incorrect password', async () => {
    const result = await login('user@example.com', 'wrongPassword');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('should reject non-existent email', async () => {
    const result = await login('nonexistent@example.com', 'anyPassword');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('should store refresh token in database', async () => {
    const result = await login('user@example.com', 'correctPassword');
    expect(result.success).toBe(true);

    const storedTokens = await knex('refresh_tokens')
      .where({ user_id: result.user!.id })
      .select();

    expect(storedTokens).toHaveLength(1);
    expect(storedTokens[0].token_hash).toBeDefined();
  });
});

describe('refreshTokens', () => {
  it('should issue new tokens with valid refresh token', async () => {
    await createUser({
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
    });

    const loginResult = await login('user@example.com', 'password123');
    expect(loginResult.success).toBe(true);

    const refreshResult = await refreshTokens(loginResult.tokens!.refreshToken);

    expect(refreshResult.success).toBe(true);
    expect(refreshResult.tokens?.accessToken).toBeDefined();
    expect(refreshResult.tokens?.refreshToken).toBeDefined();
    expect(refreshResult.user?.email).toBe('user@example.com');
  });

  it('should invalidate old refresh token after use', async () => {
    await createUser({
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
    });

    const loginResult = await login('user@example.com', 'password123');
    const oldRefreshToken = loginResult.tokens!.refreshToken;

    const firstRefresh = await refreshTokens(oldRefreshToken);
    expect(firstRefresh.success).toBe(true);

    const secondRefresh = await refreshTokens(oldRefreshToken);
    expect(secondRefresh.success).toBe(false);
    expect(secondRefresh.error).toContain('not found');
  });

  it('should reject invalid refresh token', async () => {
    const result = await refreshTokens('invalid.refresh.token');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('revokeAllUserTokens', () => {
  it('should delete all refresh tokens for a user', async () => {
    const createResult = await createUser({
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
    });

    await login('user@example.com', 'password123');
    await login('user@example.com', 'password123');

    const beforeRevoke = await knex('refresh_tokens')
      .where({ user_id: createResult.user!.id })
      .count('* as count')
      .first();
    expect(Number(beforeRevoke?.count)).toBe(2);

    await revokeAllUserTokens(createResult.user!.id);

    const afterRevoke = await knex('refresh_tokens')
      .where({ user_id: createResult.user!.id })
      .count('* as count')
      .first();
    expect(Number(afterRevoke?.count)).toBe(0);
  });
});
