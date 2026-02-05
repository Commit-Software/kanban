# Build stage for UI
FROM node:20-alpine AS ui-builder
WORKDIR /app/kanban-ui
COPY kanban-ui/package*.json ./
RUN npm ci
COPY kanban-ui/ ./
RUN npm run build

# Build stage for API
FROM node:20-alpine AS api-builder
WORKDIR /app/kanban-api
COPY kanban-api/package*.json ./
RUN npm ci
COPY kanban-api/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies for API
COPY kanban-api/package*.json ./
RUN npm ci --omit=dev

# Copy built API
COPY --from=api-builder /app/kanban-api/dist ./dist

# Copy built UI to serve as static files
COPY --from=ui-builder /app/kanban-ui/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/kanban.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
