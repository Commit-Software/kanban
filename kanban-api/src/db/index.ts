import Knex from 'knex';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/kanban.db');

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const knex = Knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  // Enable WAL mode for better concurrency
  pool: {
    afterCreate: (conn: any, done: (err: Error | null, conn: any) => void) => {
      conn.pragma('journal_mode = WAL');
      done(null, conn);
    },
  },
});

// Initialize database schema
export const initializeDb = async (): Promise<void> => {
  const hasTasksTable = await knex.schema.hasTable('tasks');
  
  if (!hasTasksTable) {
    await knex.schema.createTable('tasks', (table) => {
      table.uuid('id').primary();
      table.string('title', 255).notNullable();
      table.text('description');
      table.string('status', 20).notNullable().defaultTo('backlog');
      table.integer('priority').notNullable().defaultTo(3);
      table.json('skills_required').defaultTo('[]');
      table.string('claimed_by');
      table.datetime('claimed_at');
      table.integer('timeout_minutes').notNullable().defaultTo(30);
      table.uuid('parent_task_id').references('id').inTable('tasks');
      table.json('output');
      table.text('blocked_reason');
      table.date('due_date');
      // Usage tracking fields
      table.integer('usage_input_tokens');
      table.integer('usage_output_tokens');
      table.string('usage_model');
      table.float('usage_cost_usd');
      table.string('created_by').notNullable();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      
      // Indexes for common queries
      table.index('status');
      table.index('claimed_by');
      table.index('parent_task_id');
      table.index('due_date');
      table.index(['status', 'claimed_by']);
    });
    
    console.log('✅ Tasks table created');
  } else {
    // Migrations for existing tables
    const hasDueDate = await knex.schema.hasColumn('tasks', 'due_date');
    if (!hasDueDate) {
      await knex.schema.alterTable('tasks', (table) => {
        table.date('due_date');
      });
      console.log('✅ Added due_date column to tasks');
    }
    
    // Migration: add usage tracking columns
    const hasUsageTokens = await knex.schema.hasColumn('tasks', 'usage_input_tokens');
    if (!hasUsageTokens) {
      await knex.schema.alterTable('tasks', (table) => {
        table.integer('usage_input_tokens');
        table.integer('usage_output_tokens');
        table.string('usage_model');
        table.float('usage_cost_usd');
      });
      console.log('✅ Added usage tracking columns to tasks');
    }
  }

  // Activities table for the activity feed
  const hasActivitiesTable = await knex.schema.hasTable('activities');
  
  if (!hasActivitiesTable) {
    await knex.schema.createTable('activities', (table) => {
      table.uuid('id').primary();
      table.string('type', 50).notNullable();
      table.string('agent_id').notNullable();
      table.uuid('task_id');
      table.string('task_title', 255);
      table.json('details');
      table.datetime('created_at').notNullable();
      
      // Indexes for common queries
      table.index('agent_id');
      table.index('task_id');
      table.index('type');
      table.index('created_at');
    });
    
    console.log('✅ Activities table created');
  }

  // Agent settings table for model configuration
  const hasAgentSettingsTable = await knex.schema.hasTable('agent_settings');
  
  if (!hasAgentSettingsTable) {
    await knex.schema.createTable('agent_settings', (table) => {
      table.string('agent_id').primary();
      table.string('model').defaultTo('claude-sonnet-4');
      table.float('budget_limit_usd');
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
    });
    
    console.log('✅ Agent settings table created');
  }

  // Users table for authentication
  const hasUsersTable = await knex.schema.hasTable('users');

  if (!hasUsersTable) {
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('role', 20).notNullable().defaultTo('user');
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();

      // Indexes
      table.index('email');
      table.index('role');
    });

    console.log('✅ Users table created');
  }

  // Refresh tokens table for JWT refresh token management
  const hasRefreshTokensTable = await knex.schema.hasTable('refresh_tokens');

  if (!hasRefreshTokensTable) {
    await knex.schema.createTable('refresh_tokens', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('token_hash').notNullable();
      table.datetime('expires_at').notNullable();
      table.datetime('created_at').notNullable();

      // Indexes
      table.index('user_id');
      table.index('token_hash');
      table.index('expires_at');
    });

    console.log('✅ Refresh tokens table created');
  }
};

// Close database connection
export const closeDb = async (): Promise<void> => {
  await knex.destroy();
};
