import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeDb } from './db/index.js';
import { taskRoutes } from './routes/tasks.js';
import { activityRoutes } from './routes/activities.js';
import { statsRoutes } from './routes/stats.js';
import { settingsRoutes } from './routes/settings.js';
import { agentRoutes } from './routes/agents.js';
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
// Track connected clients
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});
// Helper to emit task events
export const emitTaskEvent = (event, data) => {
    io.emit(event, data);
};
// Middleware
app.use(express.json());
// CORS for local dev
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-agent-id');
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
app.use('/tasks', taskRoutes);
app.use('/activities', activityRoutes);
app.use('/stats', statsRoutes);
app.use('/settings', settingsRoutes);
app.use('/agents', agentRoutes);
// Error handler
app.use((err, _req, res, _next) => {
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
