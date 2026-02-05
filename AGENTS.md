# AGENTS.md - Kanban Project

> Guidelines for AI agents working in this codebase.

## Project Overview

Lightweight kanban board for AI agent task tracking. Monorepo structure:
- `kanban-api/` - Backend (TypeScript, Express, SQLite/Knex, Zod)
- `kanban-ui/` - Frontend (React 19, Vite, TailwindCSS v4)
- `kanban-skill/` - CLI tool for agent integration

## Build/Lint/Test Commands

### API (kanban-api/)
```bash
npm run dev          # Dev server with tsx watch (port 3000)
npm run build        # TypeScript compile
npm run test         # Vitest watch mode
npm run test:run     # Run tests once (CI)

# Single test file:
npx vitest run src/services/tasks.test.ts

# Tests matching pattern:
npx vitest run -t "should claim a ready task"
```

### UI (kanban-ui/)
```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # TypeScript + Vite build
npm run lint         # ESLint check
```

## Code Style Guidelines

### TypeScript
- Target: ES2022, strict mode
- API requires `.js` extensions in imports (ESM)
- Use `type` keyword for type-only imports

### Import Order
1. Node built-ins (crypto, path)
2. External packages (express, react)
3. Internal modules (relative paths)
4. Types (type-only imports)

```typescript
import { randomUUID } from 'crypto';
import { Router } from 'express';
import { knex } from '../db/index.js';
import type { Task } from '../models/task.js';
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `task-card.tsx` |
| Components | PascalCase | `TaskCard` |
| Functions | camelCase | `createTask` |
| Constants | SCREAMING_SNAKE | `API_BASE` |
| Types | PascalCase | `Task`, `CreateTask` |
| DB columns | snake_case | `created_at` |

### Type Definitions

**API - Use Zod schemas:**
```typescript
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  status: z.enum(['backlog', 'ready', 'in_progress', 'done']),
});
export type Task = z.infer<typeof TaskSchema>;
```

**UI - Use interfaces:**
```typescript
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}
```

### Error Handling

**Services return result objects:**
```typescript
async function updateTask(id: string, updates: UpdateTask): Promise<{
  success: boolean;
  task?: Task;
  error?: string;
}> {
  if (!existing) return { success: false, error: 'Task not found' };
  return { success: true, task };
}
```

**UI throws on fetch errors:**
```typescript
if (!res.ok) throw new Error('Failed to fetch');
```

### Database Patterns
- Use Knex query builder
- Serialize JSON arrays for SQLite
- Use atomic updates for concurrency

```typescript
// Atomic claim
await knex('tasks')
  .where({ id, status: 'ready', claimed_by: null })
  .update({ status: 'in_progress', claimed_by: agentId });
```

### Testing (Vitest)
```typescript
describe('claimTask', () => {
  it('should claim a ready task', async () => {
    const task = await createTask({ title: 'Test', status: 'ready', created_by: 'ken' });
    const result = await claimTask(task.id, 'nick');
    expect(result.success).toBe(true);
  });
});
```

## Commit Messages

Conventional commits (commitlint enforced):
```
<type>: <subject>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
```
Examples: `feat: add due dates`, `fix: prevent double-claim`

## Architecture

```
kanban-api/src/
├── db/           # Database setup
├── models/       # Zod schemas & types
├── routes/       # Express handlers
├── services/     # Business logic (tested)
└── index.ts      # Entry point

kanban-ui/src/
├── components/   # React components
├── pages/        # Route pages
├── api.ts        # API client
├── types.ts      # TypeScript types
└── App.tsx       # Main app
```

## Key Files

| Purpose | Location |
|---------|----------|
| Task business logic | `kanban-api/src/services/tasks.ts` |
| Task tests | `kanban-api/src/services/tasks.test.ts` |
| Task schema/types | `kanban-api/src/models/task.ts` |
| UI types | `kanban-ui/src/types.ts` |
| API client | `kanban-ui/src/api.ts` |

## Adding New Features

### New API Endpoint
1. Define Zod schema in `models/`
2. Implement logic in `services/` with tests
3. Add route in `routes/`, register in `index.ts`
4. Emit WebSocket events if real-time updates needed

### New UI Feature
1. Add types to `types.ts`
2. Add API method to `api.ts`
3. Create component with TailwindCSS
4. Handle WebSocket via `useSocket` hook
