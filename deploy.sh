#!/bin/bash
set -e

echo "🚀 Kanban Deployment Setup"
echo "=========================="

# Check requirements
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install from https://docker.com"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required."; exit 1; }

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: You need to set up a Cloudflare Tunnel"
    echo ""
    echo "1. Go to https://one.dash.cloudflare.com/"
    echo "2. Navigate to: Networks → Tunnels → Create a tunnel"
    echo "3. Name your tunnel (e.g., 'kanban')"
    echo "4. Copy the tunnel token"
    echo "5. Edit .env and paste the token as CLOUDFLARE_TUNNEL_TOKEN"
    echo "6. In Cloudflare, configure the tunnel:"
    echo "   - Public hostname: kanban.yourdomain.com"
    echo "   - Service: http://kanban:3000"
    echo ""
    echo "Then run this script again."
    exit 0
fi

# Check if token is set
source .env
if [ "$CLOUDFLARE_TUNNEL_TOKEN" = "your-tunnel-token-here" ]; then
    echo "❌ Please set CLOUDFLARE_TUNNEL_TOKEN in .env"
    exit 1
fi

echo ""
echo "🔨 Building and starting containers..."
docker compose up -d --build

echo ""
echo "✅ Kanban is now running!"
echo ""
echo "📊 View logs:        docker compose logs -f"
echo "🛑 Stop:             docker compose down"
echo "🔄 Restart:          docker compose restart"
echo "💾 Backup data:      docker compose cp kanban:/app/data ./backup"
echo ""
echo "Your app will be available at the URL you configured in Cloudflare Tunnel."
