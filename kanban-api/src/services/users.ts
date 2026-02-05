import { randomUUID } from 'crypto';
import { knex } from '../db/index.js';
import { hashPassword } from './auth.js';
import type { User, UserWithPasswordHash, CreateUser, UpdateUser } from '../models/user.js';

const stripPasswordHash = (user: UserWithPasswordHash): User => {
  const { password_hash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const createUser = async (
  input: CreateUser
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const existing = await knex('users').where({ email: input.email }).first();
  if (existing) {
    return { success: false, error: 'Email already in use' };
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);

  const user: UserWithPasswordHash = {
    id: randomUUID(),
    email: input.email,
    password_hash: passwordHash,
    role: input.role ?? 'user',
    created_at: now,
    updated_at: now,
  };

  await knex('users').insert(user);

  return { success: true, user: stripPasswordHash(user) };
};

export const getUserById = async (id: string): Promise<User | null> => {
  const user = await knex('users').where({ id }).first() as UserWithPasswordHash | undefined;
  if (!user) return null;
  return stripPasswordHash(user);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await knex('users').where({ email }).first() as UserWithPasswordHash | undefined;
  if (!user) return null;
  return stripPasswordHash(user);
};

export const listUsers = async (): Promise<User[]> => {
  const users = await knex('users')
    .select('id', 'email', 'role', 'created_at', 'updated_at')
    .orderBy('created_at', 'asc') as User[];
  return users;
};

export const updateUser = async (
  id: string,
  updates: UpdateUser
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const existing = await knex('users').where({ id }).first() as UserWithPasswordHash | undefined;
  if (!existing) {
    return { success: false, error: 'User not found' };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.email !== undefined) {
    const emailExists = await knex('users')
      .where({ email: updates.email })
      .whereNot({ id })
      .first();
    if (emailExists) {
      return { success: false, error: 'Email already in use' };
    }
    updateData.email = updates.email;
  }

  if (updates.password !== undefined) {
    updateData.password_hash = await hashPassword(updates.password);
  }

  if (updates.role !== undefined) {
    updateData.role = updates.role;
  }

  await knex('users').where({ id }).update(updateData);

  const user = await getUserById(id);
  return { success: true, user: user! };
};

export const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const existing = await knex('users').where({ id }).first();
  if (!existing) {
    return { success: false, error: 'User not found' };
  }

  await knex('users').where({ id }).delete();
  return { success: true };
};

export const countUsers = async (): Promise<number> => {
  const result = await knex('users').count('* as count').first();
  return Number(result?.count ?? 0);
};
