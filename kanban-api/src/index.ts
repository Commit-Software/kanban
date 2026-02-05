import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { initializeDb } from './db/index.js';
import { taskRoutes } from './routes/tasks.js';
import { activityRoutes } from './routes/activities.js';
import { statsRoutes } from './routes/stats.js';
import { settingsRoutes } from './routes/settings.js';
import { agentRoutes } from './routes/agents.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { verifyAccessToken } from './services/auth.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.IO setup with CORS
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  const { valid, payload } = verifyAccessToken(token);
  if (!valid || !payload) {
    return next(new Error('Invalid token'));
  }
  socket.data.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id} (user: ${socket.data.user?.email})`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Helper to emit task events
export const emitTaskEvent = (event: string, data: unknown) => {
  io.emit(event, data);
};

// Middleware
app.use(express.json());

// CORS for local dev
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agent-id');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/activities', activityRoutes);
app.use('/stats', statsRoutes);
app.use('/settings', settingsRoutes);
app.use('/agents', agentRoutes);

// Serve static files from /public (UI build) in production
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA fallback - serve index.html for non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.method !== 'GET' ||
      req.path.startsWith('/auth') || req.path.startsWith('/users') || 
      req.path.startsWith('/tasks') || req.path.startsWith('/activities') ||
      req.path.startsWith('/stats') || req.path.startsWith('/settings') ||
      req.path.startsWith('/agents') || req.path.startsWith('/health') ||
      req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const start = async () => {
  await initializeDb();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Kanban API running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready`);
  });
};

start().catch(console.error);

export { app };
