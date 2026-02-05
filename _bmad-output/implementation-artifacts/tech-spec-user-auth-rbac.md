---
title: 'User Authentication & Role-Based Access Control'
slug: 'user-auth-rbac'
created: '2026-02-05'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Express 4', 'TypeScript', 'SQLite/better-sqlite3', 'Knex', 'Zod', 'Socket.IO', 'React 19', 'Vite', 'TailwindCSS v4', 'React Router v7', 'JWT', 'bcrypt']
files_to_modify:
  - 'kanban-api/src/db/index.ts'
  - 'kanban-api/src/models/user.ts'
  - 'kanban-api/src/services/auth.ts'
  - 'kanban-api/src/services/users.ts'
  - 'kanban-api/src/services/auth.test.ts'
  - 'kanban-api/src/middleware/auth.ts'
  - 'kanban-api/src/routes/auth.ts'
  - 'kanban-api/src/routes/users.ts'
  - 'kanban-api/src/routes/tasks.ts'
  - 'kanban-api/src/routes/activities.ts'
  - 'kanban-api/src/routes/stats.ts'
  - 'kanban-api/src/routes/settings.ts'
  - 'kanban-api/src/routes/agents.ts'
  - 'kanban-api/src/index.ts'
  - 'kanban-api/package.json'
  - 'kanban-ui/src/types.ts'
  - 'kanban-ui/src/api.ts'
  - 'kanban-ui/src/contexts/AuthContext.tsx'
  - 'kanban-ui/src/pages/Login.tsx'
  - 'kanban-ui/src/pages/Setup.tsx'
  - 'kanban-ui/src/components/Layout.tsx'
  - 'kanban-ui/src/components/ProtectedRoute.tsx'
  - 'kanban-ui/src/main.tsx'
  - 'kanban-ui/src/useSocket.ts'
  - 'kanban-skill/kanban-cli.sh'
code_patterns:
  - 'Zod schemas for validation with z.infer<> for types'
  - 'Service functions return { success, data?, error? } result objects'
  - 'Routes use handleValidation() helper for Zod parsing'
  - 'DB migrations via hasColumn() checks in initializeDb()'
  - 'JSON.stringify for array/object columns in SQLite'
  - 'WebSocket events emitted after mutations'
  - 'React hooks + useState for state management'
  - 'React Router v7 with Layout wrapper and Outlet'
test_patterns:
  - 'Vitest with in-memory SQLite'
  - 'beforeEach clears tables'
  - 'Tests in same directory as source with .test.ts suffix'
  - 'describe/it blocks with expect assertions'
---

# Tech-Spec: User Authentication & Role-Based Access Control

**Created:** 2026-02-05

## Overview

### Problem Statement

The kanban app is completely unprotected - anyone can access all endpoints, view/modify tasks, and hit the API. There is no user model, no authentication, and CORS is wide open. The WebSocket connections are also unauthenticated. This needs to be secured with user authentication and basic role-based access control.

### Solution

Implement JWT-based authentication with a simple two-role system (admin/user). Admin can manage users; regular users can only manage their own tasks. A first-run setup screen bootstraps the initial admin account when no users exist in the database.

**Secure by Default**: When a new user starts the app, they are immediately presented with a mandatory setup screen to create the admin account. No routes are accessible until setup is complete.

### Scope

**In Scope:**
- User model (id, email, password hash, role, created_at)
- JWT authentication (login, token validation, token refresh)
- Password hashing with bcrypt
- Auth middleware protecting all API routes
- WebSocket authentication (validate token on connection)
- Two roles: `admin` (full access, user CRUD) and `user` (own tasks only)
- First-run setup screen to create initial admin account
- Login page in UI
- Protected routes in React (redirect to login if unauthenticated)
- CLI tool auth support (pass JWT token in header)

**Out of Scope:**
- OAuth/social login (Google, GitHub, etc.)
- Password reset/forgot password flow
- Email verification
- Session-based auth (using stateless JWT only)
- Granular permissions beyond admin/user roles
- Audit logging of authentication events
- Rate limiting on auth endpoints

## Context for Development

### Codebase Patterns

**Database Pattern:**
- Schema defined inline in `db/index.ts` with migration checks using `hasColumn()`
- Tables created in `initializeDb()` function
- JSON columns serialized with `JSON.stringify()` / `JSON.parse()`

**Model Pattern:**
- Zod schemas in `models/` directory
- Types derived via `z.infer<typeof Schema>`
- Separate schemas for Create/Update/Query operations

**Service Pattern:**
- Business logic in `services/` directory
- Functions return result objects: `{ success: boolean; data?: T; error?: string }`
- Handles DB serialization internally

**Route Pattern:**
- Express routers in `routes/` directory
- Validation via `handleValidation(schema, data)` helper
- WebSocket events emitted after successful mutations
- Uses `x-agent-id` header for agent identification (will be replaced by JWT)

**UI Pattern:**
- React hooks + useState for local state
- API calls centralized in `api.ts`
- WebSocket via custom `useSocket` hook
- React Router v7 with Layout component wrapping routes via `<Outlet />`

**Test Pattern:**
- Vitest with in-memory SQLite
- `beforeEach` clears relevant tables
- Tests co-located with source (`.test.ts` suffix)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `kanban-api/src/db/index.ts` | Database setup, schema creation, migration pattern |
| `kanban-api/src/models/task.ts` | Zod schema pattern for models |
| `kanban-api/src/services/tasks.ts` | Service layer pattern with result objects |
| `kanban-api/src/routes/tasks.ts` | Route handler pattern with validation |
| `kanban-api/src/index.ts` | Express app setup, middleware, Socket.IO config |
| `kanban-api/src/services/tasks.test.ts` | Test pattern with Vitest |
| `kanban-ui/src/api.ts` | API client pattern |
| `kanban-ui/src/types.ts` | Frontend type definitions |
| `kanban-ui/src/useSocket.ts` | WebSocket hook pattern |
| `kanban-ui/src/main.tsx` | React Router setup |
| `kanban-ui/src/components/Layout.tsx` | Layout wrapper pattern |
| `kanban-skill/kanban-cli.sh` | CLI tool for agent integration |

### Technical Decisions

- **JWT for auth**: Stateless, works for both browser and CLI tool
- **bcrypt for passwords**: Industry standard, built-in salting (cost factor 12)
- **Simple role system**: `admin` and `user` roles only
- **First-run bootstrap**: Setup screen when no users exist - app is locked until admin is created
- **Token strategy**: Access token (15min) + Refresh token (7 days) stored in localStorage
- **Authorization header**: `Authorization: Bearer <token>` for all authenticated requests
- **WebSocket auth**: Token passed in `auth.token` during connection handshake
- **Task ownership**: `created_by` field links tasks to users; regular users can only see/edit their own tasks

---

## Implementation Plan

### Phase 1: Backend Foundation (Database + Models + Core Services)

- [ ] **Task 1.1**: Install auth dependencies
  - File: `kanban-api/package.json`
  - Action: Add `jsonwebtoken`, `bcrypt` to dependencies; add `@types/jsonwebtoken`, `@types/bcrypt` to devDependencies
  - Command: `cd kanban-api && npm install jsonwebtoken bcrypt && npm install -D @types/jsonwebtoken @types/bcrypt`

- [ ] **Task 1.2**: Create users table in database
  - File: `kanban-api/src/db/index.ts`
  - Action: Add `users` table creation in `initializeDb()` with columns:
    - `id` (uuid, primary key)
    - `email` (string, unique, not null)
    - `password_hash` (string, not null)
    - `role` (string: 'admin' | 'user', not null, default 'user')
    - `created_at` (datetime, not null)
    - `updated_at` (datetime, not null)
  - Action: Add `refresh_tokens` table for token management:
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to users)
    - `token_hash` (string, not null)
    - `expires_at` (datetime, not null)
    - `created_at` (datetime, not null)
  - Notes: Follow existing pattern with `hasTable()` check before creation

- [ ] **Task 1.3**: Create User model with Zod schemas
  - File: `kanban-api/src/models/user.ts` (NEW)
  - Action: Create schemas following `models/task.ts` pattern:
    - `UserSchema` - full user object (exclude password_hash from output)
    - `CreateUserSchema` - email, password, role (for admin creating users)
    - `UpdateUserSchema` - optional email, password, role
    - `LoginRequestSchema` - email, password
    - `SetupRequestSchema` - email, password (for initial admin)
    - `AuthResponseSchema` - accessToken, refreshToken, user
  - Export types via `z.infer<>`

- [ ] **Task 1.4**: Create auth service with core functions
  - File: `kanban-api/src/services/auth.ts` (NEW)
  - Action: Implement functions:
    - `hashPassword(password: string): Promise<string>` - bcrypt hash with cost 12
    - `verifyPassword(password: string, hash: string): Promise<boolean>` - bcrypt compare
    - `generateTokens(user: User): { accessToken: string, refreshToken: string }` - JWT sign
    - `verifyAccessToken(token: string): { valid: boolean, payload?: JwtPayload, error?: string }`
    - `verifyRefreshToken(token: string): { valid: boolean, payload?: JwtPayload, error?: string }`
    - `login(email: string, password: string): Promise<{ success, tokens?, user?, error? }>`
    - `refreshTokens(refreshToken: string): Promise<{ success, tokens?, error? }>`
    - `revokeRefreshToken(tokenHash: string): Promise<void>`
    - `isSetupRequired(): Promise<boolean>` - check if users table is empty
    - `setupAdmin(email: string, password: string): Promise<{ success, tokens?, user?, error? }>`
  - Notes: Use `JWT_SECRET` and `JWT_REFRESH_SECRET` from env; access token expires in 15m, refresh in 7d

- [ ] **Task 1.5**: Create users service for CRUD operations
  - File: `kanban-api/src/services/users.ts` (NEW)
  - Action: Implement functions following `services/tasks.ts` pattern:
    - `createUser(input: CreateUser): Promise<{ success, user?, error? }>`
    - `getUserById(id: string): Promise<User | null>`
    - `getUserByEmail(email: string): Promise<User | null>`
    - `listUsers(): Promise<User[]>`
    - `updateUser(id: string, updates: UpdateUser): Promise<{ success, user?, error? }>`
    - `deleteUser(id: string): Promise<{ success, error? }>`
  - Notes: Never return password_hash; hash password on create/update if provided

- [ ] **Task 1.6**: Create auth service tests
  - File: `kanban-api/src/services/auth.test.ts` (NEW)
  - Action: Write tests for:
    - Password hashing and verification
    - Token generation and verification
    - Login success and failure cases
    - Refresh token flow
    - Setup admin flow
    - isSetupRequired() returns true when no users, false when users exist

### Phase 2: Backend Middleware + Routes

- [ ] **Task 2.1**: Create auth middleware
  - File: `kanban-api/src/middleware/auth.ts` (NEW)
  - Action: Implement Express middleware:
    - `requireAuth` - validates JWT from `Authorization: Bearer <token>` header; sets `req.user`
    - `requireAdmin` - chains after requireAuth; checks `req.user.role === 'admin'`
    - `optionalAuth` - parses token if present but doesn't require it
  - Notes: Extend Express Request type to include `user?: { id, email, role }`

- [ ] **Task 2.2**: Create auth routes
  - File: `kanban-api/src/routes/auth.ts` (NEW)
  - Action: Implement routes:
    - `GET /auth/status` - returns `{ setupRequired: boolean }` (public)
    - `POST /auth/setup` - creates initial admin (only works if no users exist)
    - `POST /auth/login` - returns tokens + user
    - `POST /auth/refresh` - exchanges refresh token for new tokens
    - `POST /auth/logout` - revokes refresh token
    - `GET /auth/me` - returns current user (requires auth)
  - Notes: Follow `routes/tasks.ts` pattern with `handleValidation()`

- [ ] **Task 2.3**: Create users routes (admin only)
  - File: `kanban-api/src/routes/users.ts` (NEW)
  - Action: Implement routes (all require admin):
    - `GET /users` - list all users
    - `GET /users/:id` - get single user
    - `POST /users` - create new user
    - `PATCH /users/:id` - update user
    - `DELETE /users/:id` - delete user (prevent self-delete)
  - Notes: Apply `requireAuth` and `requireAdmin` middleware

- [ ] **Task 2.4**: Protect existing routes with auth middleware
  - Files: `kanban-api/src/routes/tasks.ts`, `activities.ts`, `stats.ts`, `settings.ts`, `agents.ts`
  - Action: 
    - Import `requireAuth` middleware
    - Apply to all routes: `router.use(requireAuth)`
    - For tasks: filter by `created_by` for non-admin users in list/get operations
    - For task mutations: verify ownership for non-admin users
  - Notes: Admin sees all tasks; regular users see only their own

- [ ] **Task 2.5**: Register auth routes and update index
  - File: `kanban-api/src/index.ts`
  - Action:
    - Import and register `authRoutes` at `/auth`
    - Import and register `userRoutes` at `/users`
    - Add WebSocket authentication:
      ```typescript
      io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));
        const { valid, payload } = verifyAccessToken(token);
        if (!valid) return next(new Error('Invalid token'));
        socket.data.user = payload;
        next();
      });
      ```
  - Notes: Keep `/health` and `/auth/status` public (no auth required)

### Phase 3: Frontend Auth Infrastructure

- [ ] **Task 3.1**: Add auth types to frontend
  - File: `kanban-ui/src/types.ts`
  - Action: Add interfaces:
    - `User { id, email, role, created_at }`
    - `AuthState { user: User | null, isAuthenticated: boolean, isLoading: boolean }`
    - `LoginCredentials { email, password }`
    - `AuthTokens { accessToken, refreshToken }`

- [ ] **Task 3.2**: Add auth methods to API client
  - File: `kanban-ui/src/api.ts`
  - Action:
    - Add token storage helpers: `getAccessToken()`, `setTokens()`, `clearTokens()`
    - Add auth header to all fetch calls: `Authorization: Bearer ${getAccessToken()}`
    - Add auth methods:
      - `checkStatus(): Promise<{ setupRequired: boolean }>`
      - `setup(email, password): Promise<{ user, tokens }>`
      - `login(email, password): Promise<{ user, tokens }>`
      - `logout(): Promise<void>`
      - `refreshTokens(): Promise<{ tokens }>`
      - `getMe(): Promise<{ user }>`
    - Add interceptor for 401 responses to trigger token refresh or logout
  - Notes: Store tokens in localStorage under `kanban_access_token` and `kanban_refresh_token`

- [ ] **Task 3.3**: Create AuthContext provider
  - File: `kanban-ui/src/contexts/AuthContext.tsx` (NEW)
  - Action: Create React context with:
    - State: `user`, `isAuthenticated`, `isLoading`, `setupRequired`
    - Actions: `login()`, `logout()`, `setup()`, `refreshUser()`
    - On mount: check `/auth/status`, then try `/auth/me` if token exists
    - Auto-refresh tokens before expiry (use setTimeout)
  - Export: `AuthProvider`, `useAuth()` hook

- [ ] **Task 3.4**: Create ProtectedRoute component
  - File: `kanban-ui/src/components/ProtectedRoute.tsx` (NEW)
  - Action: Component that:
    - Uses `useAuth()` to check authentication state
    - If `isLoading`: show loading spinner
    - If `setupRequired`: redirect to `/setup`
    - If not authenticated: redirect to `/login`
    - If authenticated: render `<Outlet />`
  - Notes: Wrap with `Navigate` from react-router-dom

- [ ] **Task 3.5**: Create Login page
  - File: `kanban-ui/src/pages/Login.tsx` (NEW)
  - Action: Create login form with:
    - Email and password inputs
    - Submit handler calling `useAuth().login()`
    - Error display for invalid credentials
    - Redirect to `/` on success
    - Link to setup if `setupRequired` (edge case)
  - Style: Match existing dark theme (gray-950 bg, pink-600 accent)

- [ ] **Task 3.6**: Create Setup page
  - File: `kanban-ui/src/pages/Setup.tsx` (NEW)
  - Action: Create admin setup form with:
    - Welcome message explaining first-run setup
    - Email and password inputs (with confirm password)
    - Password strength indicator (min 8 chars)
    - Submit handler calling `useAuth().setup()`
    - Redirect to `/` on success
    - Prevent access if setup not required
  - Style: Match existing dark theme, centered card layout

### Phase 4: Frontend Integration

- [ ] **Task 4.1**: Update main.tsx with auth routing
  - File: `kanban-ui/src/main.tsx`
  - Action:
    - Wrap app with `AuthProvider`
    - Add public routes: `/login`, `/setup`
    - Wrap existing routes with `ProtectedRoute`
    ```tsx
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<App />} />
              {/* ... other routes */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    ```

- [ ] **Task 4.2**: Update Layout with user info and logout
  - File: `kanban-ui/src/components/Layout.tsx`
  - Action:
    - Import `useAuth()` hook
    - Display current user email in header
    - Add logout button
    - Show "Users" nav link for admin role only
  - Notes: Style logout button consistently with existing nav

- [ ] **Task 4.3**: Update useSocket with auth token
  - File: `kanban-ui/src/useSocket.ts`
  - Action:
    - Import `getAccessToken` from api
    - Pass token in socket connection:
      ```typescript
      const socket = io(API_URL, {
        auth: { token: getAccessToken() },
        transports: ['websocket', 'polling'],
      });
      ```
    - Handle auth errors on socket connection
    - Reconnect with new token after refresh

- [ ] **Task 4.4**: Create Users management page (admin only)
  - File: `kanban-ui/src/pages/Users.tsx` (NEW)
  - Action: Admin-only page with:
    - List of all users (email, role, created_at)
    - Create user form (modal)
    - Edit user (change role, reset password)
    - Delete user (with confirmation)
  - Notes: Only accessible to admin role; add to routes and Layout nav

### Phase 5: CLI Tool Update

- [ ] **Task 5.1**: Update CLI to support authentication
  - File: `kanban-skill/kanban-cli.sh`
  - Action:
    - Add `KANBAN_TOKEN` environment variable support
    - Add token to all curl requests: `-H "Authorization: Bearer $KANBAN_TOKEN"`
    - Add new commands:
      - `login <email> <password>` - gets token and prints it (user saves to env)
      - `whoami` - shows current user from token
    - Update usage/help text
  - Notes: Token should be stored by user in env or shell config

---

## Acceptance Criteria

### Authentication Flow

- [ ] **AC 1.1**: Given no users exist in database, when UI loads, then redirect to `/setup` page
- [ ] **AC 1.2**: Given setup page is shown, when admin enters valid email/password and submits, then admin user is created and user is logged in and redirected to kanban board
- [ ] **AC 1.3**: Given setup is complete, when visiting `/setup`, then redirect to `/` (prevent re-setup)
- [ ] **AC 1.4**: Given user is not authenticated, when accessing any protected route, then redirect to `/login`
- [ ] **AC 1.5**: Given login page is shown, when user enters valid credentials, then user is logged in and redirected to kanban board
- [ ] **AC 1.6**: Given login page is shown, when user enters invalid credentials, then error message is displayed
- [ ] **AC 1.7**: Given user is authenticated, when clicking logout, then tokens are cleared and user is redirected to `/login`

### Token Management

- [ ] **AC 2.1**: Given valid access token, when making API request, then request succeeds
- [ ] **AC 2.2**: Given expired access token and valid refresh token, when making API request, then tokens are refreshed and request succeeds
- [ ] **AC 2.3**: Given expired refresh token, when making API request, then user is logged out and redirected to `/login`
- [ ] **AC 2.4**: Given no token, when making API request to protected route, then 401 Unauthorized is returned

### Role-Based Access

- [ ] **AC 3.1**: Given admin user, when viewing tasks, then all tasks from all users are visible
- [ ] **AC 3.2**: Given regular user, when viewing tasks, then only tasks created by that user are visible
- [ ] **AC 3.3**: Given regular user, when attempting to edit another user's task, then 403 Forbidden is returned
- [ ] **AC 3.4**: Given admin user, when accessing `/users`, then user management page is shown
- [ ] **AC 3.5**: Given regular user, when accessing `/users`, then redirect to `/` or show forbidden message
- [ ] **AC 3.6**: Given admin user, when creating a new user, then user is created with specified role

### WebSocket Authentication

- [ ] **AC 4.1**: Given valid token, when connecting to WebSocket, then connection succeeds
- [ ] **AC 4.2**: Given no token, when connecting to WebSocket, then connection is rejected
- [ ] **AC 4.3**: Given invalid token, when connecting to WebSocket, then connection is rejected

### CLI Authentication

- [ ] **AC 5.1**: Given `KANBAN_TOKEN` is set, when running CLI commands, then requests include auth header
- [ ] **AC 5.2**: Given `KANBAN_TOKEN` is not set, when running CLI commands, then error message indicates auth required
- [ ] **AC 5.3**: Given valid token, when running `whoami`, then current user info is displayed

---

## Additional Context

### Dependencies

**New API Dependencies:**
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcrypt": "^5.0.0"
  }
}
```

**Environment Variables (new):**
```env
JWT_SECRET=<random-secret-min-32-chars>
JWT_REFRESH_SECRET=<different-random-secret>
```

If `JWT_SECRET` is not provided, the app should generate a random one on first run and log a warning. For production, these should be explicitly set.

### Testing Strategy

**Unit Tests (services/auth.test.ts):**
- Password hashing produces valid bcrypt hash
- Password verification works for correct and incorrect passwords
- Token generation produces valid JWT
- Token verification accepts valid tokens, rejects expired/invalid
- Login succeeds with correct credentials, fails with incorrect
- Setup creates admin user when no users exist
- Setup fails when users already exist

**Integration Tests (manual or e2e):**
- Full login flow: enter credentials → receive tokens → access protected route
- Token refresh: wait for expiry → automatic refresh → continued access
- Role enforcement: regular user cannot access admin routes
- WebSocket auth: connect with token → receive events

**Manual Testing Checklist:**
- [ ] Fresh database → setup screen appears
- [ ] Complete setup → logged in, can access board
- [ ] Logout → redirected to login
- [ ] Login with new user → access board
- [ ] Create task → visible to creator
- [ ] Login as different user → cannot see other's tasks
- [ ] Login as admin → can see all tasks
- [ ] Admin creates new user → user can login
- [ ] CLI with token → commands work
- [ ] CLI without token → commands fail with auth error

### Notes

**High-Risk Items:**
- Token refresh timing: ensure refresh happens before access token expires to avoid brief logouts
- WebSocket reconnection: when tokens refresh, socket may need to reconnect with new token
- Concurrent requests during refresh: queue requests while refresh is in progress

**Security Considerations:**
- Passwords hashed with bcrypt cost factor 12 (good balance of security/performance)
- JWT secrets should be at least 32 characters
- Refresh tokens stored hashed in database, not plaintext
- Access tokens short-lived (15min) to limit exposure
- CORS should be tightened for production deployment

**Future Considerations (out of scope):**
- Password reset via email
- Account lockout after failed attempts
- Audit logging of auth events
- OAuth providers (Google, GitHub)
- API key auth for CLI (alternative to JWT)
