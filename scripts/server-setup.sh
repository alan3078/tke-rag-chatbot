#!/bin/bash
# ============================================================================
# server-setup.sh — One-time server bootstrap for TKE RAG Chatbot
#
# Run as root on your deployment server:
#   bash server-setup.sh
# ============================================================================
set -euo pipefail

DEPLOY_DIR="/opt/tke-rag-chatbot"
BACKUP_DIR="/opt/tke-rag-backup-$(date +%Y%m%d-%H%M%S)"

echo "=== Step 1: Backup existing files ==="
mkdir -p "$BACKUP_DIR"

# Backup nginx
cp /etc/nginx/nginx.conf "$BACKUP_DIR/nginx.conf" 2>/dev/null || true
cp -r /etc/nginx/sites-available "$BACKUP_DIR/sites-available" 2>/dev/null || true
cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/sites-enabled" 2>/dev/null || true
cp -r /etc/nginx/ssl "$BACKUP_DIR/ssl" 2>/dev/null || true
nginx -T > "$BACKUP_DIR/nginx-full-dump.txt" 2>/dev/null || true

# Backup web root
if [ -d /var/www/html ] && [ "$(ls -A /var/www/html 2>/dev/null)" ]; then
  cp -r /var/www/html "$BACKUP_DIR/html"
fi

echo "  Backup saved to: $BACKUP_DIR"

echo ""
echo "=== Step 2: Install Docker ==="
if command -v docker &> /dev/null; then
  echo "  Docker already installed: $(docker --version)"
else
  echo "  Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  echo "  Docker installed: $(docker --version)"
fi

echo ""
echo "=== Step 3: Create deployment directory ==="
mkdir -p "$DEPLOY_DIR"

echo ""
echo "=== Step 4: Verify SSL certs exist ==="
if [ -f /etc/nginx/ssl/fullchain.crt ] && [ -f /etc/nginx/ssl/server.key ]; then
  echo "  SSL certs found at /etc/nginx/ssl/"
else
  echo "  WARNING: SSL certs not found at /etc/nginx/ssl/"
  echo "  The existing nginx config expects them there."
fi

echo ""
echo "=== Step 5: Keep system nginx running ==="
echo "  System nginx stays as the reverse proxy."
echo "  Docker containers expose ports on 127.0.0.1 only."
echo "  Nginx proxies :8443 → 127.0.0.1:3000 (frontend) + 127.0.0.1:3001 (backend)"
nginx -t && echo "  nginx config OK" || echo "  WARNING: nginx config has errors"

echo ""
echo "============================================="
echo " Server setup complete!"
echo "============================================="
echo ""
echo " Backup:     $BACKUP_DIR"
echo " Deploy dir: $DEPLOY_DIR"
echo ""
echo " Required GitHub Secrets:"
echo "   SERVER_HOST     = <your-server-ip>"
echo "   SERVER_USER     = root"
echo "   SERVER_PASSWORD = <root SSH password>"
echo "   LLM_API_KEY     = <OpenRouter API key>"
echo "   AUTH_SECRET      = <random 32+ char string>"
echo "   ADMIN_PASSWORD   = <admin login password>"
echo ""
echo " Optional GitHub Variables (Settings → Variables):"
echo "   LLM_MODEL       = deepseek/deepseek-v4-flash"
echo "   ADMIN_USERNAME   = admin"
echo ""
echo " Next: push to main branch → GitHub Actions deploys automatically"
