# Self-Hosted Deployment Guide

Deploy Kanban locally with Docker Compose and Cloudflare Tunnel for free public access.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare                         │
│  ┌───────────────────────────────────────────────┐  │
│  │  Tunnel (FREE)                                │  │
│  │  - kanban.yourdomain.com → localhost:3000    │  │
│  │  - Auto SSL, DDoS protection                 │  │
│  │  - Works behind NAT/firewall                  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼ (outbound connection)
┌─────────────────────────────────────────────────────┐
│              Your Machine (Docker)                   │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  cloudflared    │  │  kanban-app             │  │
│  │  (tunnel)       │──│  - API + WebSockets     │  │
│  └─────────────────┘  │  - Static UI            │  │
│                       │  - SQLite (volume)      │  │
│                       └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker & Docker Compose
- A domain on Cloudflare (free tier works)
- Cloudflare account

## Quick Start

### 1. Clone and enter the repo

```bash
git clone https://github.com/Commit-Software/kanban.git
cd kanban
```

### 2. Create a Cloudflare Tunnel

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks → Tunnels**
3. Click **Create a tunnel**
4. Choose **Cloudflared** connector
5. Name your tunnel (e.g., `kanban`)
6. Copy the tunnel token

### 3. Configure the tunnel hostname

In the Cloudflare dashboard, add a public hostname:

| Field | Value |
|-------|-------|
| Subdomain | `kanban` (or your choice) |
| Domain | Select your domain |
| Type | `HTTP` |
| URL | `kanban:3000` |

### 4. Set up environment

```bash
cp .env.example .env
# Edit .env and paste your tunnel token
```

### 5. Deploy

```bash
./deploy.sh
```

Your app is now live at `https://kanban.yourdomain.com`! 🎉

## Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start containers |
| `docker compose down` | Stop containers |
| `docker compose logs -f` | View logs |
| `docker compose restart` | Restart containers |
| `docker compose pull && docker compose up -d --build` | Update and rebuild |

## Data Backup

SQLite data is stored in a Docker volume. To backup:

```bash
# Create backup
docker compose cp kanban:/app/data ./backup-$(date +%Y%m%d)

# Restore backup
docker compose cp ./backup-20240205/. kanban:/app/data
docker compose restart kanban
```

## Updating

```bash
git pull
docker compose up -d --build
```

## Troubleshooting

### Tunnel not connecting
- Check the token in `.env` is correct
- Verify the tunnel is active in Cloudflare dashboard
- Check logs: `docker compose logs cloudflared`

### App not loading
- Check app logs: `docker compose logs kanban`
- Verify containers are running: `docker compose ps`

### WebSocket issues
- Ensure tunnel hostname uses `HTTP` not `HTTPS` (Cloudflare handles SSL)
- Check that `/socket.io` path isn't blocked

## Cost

**$0/month** — just your electricity! 

- Cloudflare Tunnel: Free
- Cloudflare DNS: Free
- Docker: Free
- SQLite: Free
