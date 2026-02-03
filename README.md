# 📋 Kanban

A lightweight kanban board for tracking AI agent tasks and usage. Built for dogfooding AI-assisted development workflows.

## Screenshots

### Kanban Board
Drag-and-drop task management with columns for Backlog, Ready, In Progress, and Review.

![Kanban Board](docs/screenshots/kanban-board.png)

### Usage Dashboard
Monitor costs, tokens, and activity across all agents.

![Dashboard](docs/screenshots/dashboard.png)

### Archive
Browse and restore completed tasks with filtering options.

![Archive](docs/screenshots/archive.png)

### Settings
Configure models and agent-specific pricing.

![Settings](docs/screenshots/settings.png)

## Features

- **Kanban Board** — Drag-and-drop task management across Backlog → In Progress → Review → Done
- **Agent Tracking** — Track which AI agent (Nick, Claude, etc.) is working on each task
- **Usage Dashboard** — Monitor estimated costs and token usage per agent
- **Activity Feed** — Real-time updates on task changes
- **WebSocket Support** — Live updates across multiple clients
- **CLI Tool** — Command-line interface for agent integration
- **PWA Ready** — Installable as a Progressive Web App

## Architecture

```
kanban/
├── kanban-api/     # Backend API (TypeScript, Hono, SQLite)
├── kanban-ui/      # Frontend (React, Vite, TailwindCSS)
└── kanban-skill/   # CLI tool for OpenClaw agent integration
```

## Quick Start

### API Server

```bash
cd kanban-api
npm install
npm run dev
# Server runs on http://localhost:3000
```

### UI

```bash
cd kanban-ui
npm install
npm run dev
# UI runs on http://localhost:5173
```

### Environment

Create `.env` in `kanban-api/`:

```env
PORT=3000
DATABASE_PATH=./data/kanban.db
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/stats` | Get usage statistics |
| GET | `/activities` | Get activity feed |
| GET | `/agents` | List agents with usage |
| GET | `/settings` | Get app settings |
| PATCH | `/settings` | Update settings |

## CLI Usage

The CLI tool allows agents to interact with the kanban board:

```bash
# List tasks
./kanban-skill/kanban-cli.sh list

# Create a task
./kanban-skill/kanban-cli.sh create "Fix bug" --agent nick --estimate 0.50

# Move a task
./kanban-skill/kanban-cli.sh move <task-id> in_progress

# Complete a task
./kanban-skill/kanban-cli.sh complete <task-id>
```

## Tech Stack

- **Backend**: TypeScript, Hono, better-sqlite3
- **Frontend**: React 18, Vite, TailwindCSS, React DnD
- **Database**: SQLite
- **Real-time**: WebSocket

## License

MIT

---

Built with 🤖 by Nick & Ken during a late-night coding session.
