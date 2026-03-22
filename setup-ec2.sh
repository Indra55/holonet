#!/bin/bash
set -e

# ============================================================================
# HOLONET — EC2 Instance Setup Script
# Run on a fresh Ubuntu 22.04/24.04 EC2 instance
# ============================================================================

# ---- Config (change these before running) ----
GITHUB_REPO="https://github.com/Indra55/holonet.git"
DOMAIN="your-domain.com"              # change to your actual domain

# ---- Neon DB (your existing connection string) ----
PG_CONNECTION_STRING="postgresql://neondb_owner:npg_zvanpq58OGJR@ep-delicate-snow-aiekf2iz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ============================================================================
# 1. SYSTEM UPDATE
# ============================================================================
echo "=== [1/8] Updating system ==="
sudo apt update && sudo apt upgrade -y

# ============================================================================
# 2. INSTALL DOCKER
# ============================================================================
echo "=== [2/8] Installing Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add current user to docker group (takes effect after re-login)
sudo usermod -aG docker $USER

# ============================================================================
# 3. INSTALL BUN
# ============================================================================
echo "=== [3/8] Installing Bun ==="
curl -fsSL https://bun.sh/install | bash

# Make bun available in this script session
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Verify
bun --version

# ============================================================================
# 4. INSTALL NGINX + CERTBOT
# ============================================================================
echo "=== [4/8] Installing Nginx & Certbot ==="
sudo apt install -y nginx certbot python3-certbot-nginx

# ============================================================================
# 5. INSTALL POSTGRESQL CLIENT (for running schema on Neon)
# ============================================================================
echo "=== [5/8] Installing psql client ==="
sudo apt install -y postgresql-client

# ============================================================================
# 6. START REDIS VIA DOCKER
# ============================================================================
echo "=== [6/8] Starting Redis ==="

mkdir -p ~/holonet-infra

cat > ~/holonet-infra/docker-compose.yml << 'COMPOSE_EOF'
services:
  redis:
    image: redis:7-alpine
    container_name: holonet_redis
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis_data:
COMPOSE_EOF

# Use sudo since docker group hasn't taken effect yet in this session
sudo docker compose -f ~/holonet-infra/docker-compose.yml up -d

# Wait for Redis to be ready
echo "Waiting for Redis..."
until sudo docker exec holonet_redis redis-cli ping 2>/dev/null | grep -q PONG; do
  sleep 1
done
echo "Redis is ready!"

# ============================================================================
# 7. CLONE HOLONET & INSTALL DEPENDENCIES
# ============================================================================
echo "=== [7/8] Cloning Holonet & installing dependencies ==="

cd ~
git clone "$GITHUB_REPO" holonet
cd ~/holonet/server

bun install

# ============================================================================
# 8. CREATE PRODUCTION .env
# ============================================================================
echo "=== [8/8] Creating production .env ==="

# Generate secure secrets
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
WEBHOOK_SECRET=$(openssl rand -hex 20)

cat > ~/holonet/server/.env << ENV_EOF
# Server Configuration
PORT=3000
NODE_ENV=production
BASE_URL=https://${DOMAIN}
CORS_ORIGIN=https://${DOMAIN}

# Database (Neon DB - cloud Postgres)
PG_CONNECTION_STRING=${PG_CONNECTION_STRING}
PG_SSL=true

# Redis Configuration (local Docker)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Security & Sessions
SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# GitHub OAuth (fill these in from github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://${DOMAIN}/api/auth/github/callback

# GitHub Webhooks
WEBHOOK_SECRET=${WEBHOOK_SECRET}

# AWS Configuration (for Builder & Deployer)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
ECR_REGISTRY=your-account-id.dkr.ecr.us-east-1.amazonaws.com
ECR_REPOSITORY=holonet
ENV_EOF

# ============================================================================
# 9. PUSH SCHEMA TO NEON DB
# ============================================================================
echo "=== [BONUS] Pushing schema to Neon DB ==="
echo "Running schema.sql against Neon..."
psql "${PG_CONNECTION_STRING}" -f ~/holonet/server/schema.sql || {
  echo "⚠️  Schema push failed (maybe already exists). You can run manually:"
  echo "   psql \"\$PG_CONNECTION_STRING\" -f ~/holonet/server/schema.sql"
}

# ============================================================================
# 10. SETUP NGINX REVERSE PROXY
# ============================================================================
echo "=== [BONUS] Configuring Nginx ==="

sudo tee /etc/nginx/sites-available/holonet << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Holonet API
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # SSE log streaming — disable buffering
    location ~* /logs/stream$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/holonet /etc/nginx/sites-enabled/holonet
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# ============================================================================
# 11. CREATE SYSTEMD SERVICE (auto-start on reboot)
# ============================================================================
echo "=== [BONUS] Creating systemd service ==="

sudo tee /etc/systemd/system/holonet.service << SERVICE_EOF
[Unit]
Description=Holonet Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/holonet/server
Environment=PATH=/home/$USER/.bun/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/$USER/.bun/bin/bun run server.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo systemctl daemon-reload
sudo systemctl enable holonet

# ============================================================================
# DONE!
# ============================================================================
echo ""
echo "=============================================="
echo "  ✅ HOLONET EC2 SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "  📦 Services:"
echo "     Redis:    127.0.0.1:6379 (Docker)"
echo "     Postgres: Neon DB (cloud)"
echo "     Nginx:    port 80 → Bun:3000"
echo ""
echo "  📁 Project:  ~/holonet/server"
echo "  📄 Env:      ~/holonet/server/.env"
echo "  🔧 Infra:    ~/holonet-infra/docker-compose.yml"
echo ""
echo "  ⚠️  BEFORE STARTING — you must:"
echo "     1. Edit .env with your real GitHub OAuth credentials"
echo "     2. Edit .env with your real AWS credentials"
echo "     3. Point your domain DNS to this EC2's public IP"
echo "     4. Log out and back in (for docker group)"
echo ""
echo "  🚀 TO START:"
echo "     sudo systemctl start holonet"
echo ""
echo "  🔒 TO ADD SSL (after DNS is pointing here):"
echo "     sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo "  📋 USEFUL COMMANDS:"
echo "     sudo systemctl status holonet    # check status"
echo "     sudo journalctl -u holonet -f    # view logs"
echo "     sudo docker ps                   # check Redis"
echo "=============================================="
