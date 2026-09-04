#!/usr/bin/env bash
#
# cloudflare-rollback.sh
#
# Reverts /etc/nginx/sites-enabled/medusa to the most recent timestamped
# backup created by cloudflare-lockdown.sh, then validates and reloads
# Nginx. Use this if the lockdown breaks something (e.g. Certbot renewal
# or a Cloudflare misconfiguration).
#
# Usage:
#   sudo bash cloudflare-rollback.sh
#
set -euo pipefail

NGINX_CONF="/etc/nginx/sites-enabled/medusa"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root (sudo bash cloudflare-rollback.sh)." >&2
  exit 1
fi

# Find the most recent backup (chronologically last by filename suffix).
LATEST=$(ls -1t "${NGINX_CONF}".bak.* 2>/dev/null | head -1 || true)

if [[ -z "$LATEST" ]]; then
  echo "No backup files matching ${NGINX_CONF}.bak.* found — nothing to roll back." >&2
  exit 1
fi

echo "Restoring $NGINX_CONF from $LATEST"
cp -a "$LATEST" "$NGINX_CONF"

echo "Validating Nginx config..."
if ! nginx -t; then
  echo "nginx -t FAILED on the restored config. Investigate manually." >&2
  exit 1
fi

echo "Reloading Nginx..."
systemctl reload nginx

echo "== Done =="
echo "Restored from: $LATEST"
