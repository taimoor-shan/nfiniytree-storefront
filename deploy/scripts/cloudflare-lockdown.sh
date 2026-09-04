#!/usr/bin/env bash
#
# cloudflare-lockdown.sh
#
# Locks Nginx (both the :443 and :80 server blocks for infinytree.com) to
# Cloudflare-only ingress, without breaking Certbot HTTP-01 renewal.
#
# What it does, in order:
#   1. Detects your Certbot authenticator (nginx / webroot / dns) from the
#      renewal conf, so it knows whether the ACME exception is needed.
#   2. Backs up /etc/nginx/sites-enabled/medusa with a timestamp.
#   3. Writes the Cloudflare IP allowlist to /etc/nginx/conf.d/cloudflare-only.conf
#   4. Parses the actual server {} blocks (brace-depth aware, not line-guessing)
#      and inserts:
#        - the Cloudflare allowlist include into the :443 block
#        - the Cloudflare allowlist include AND an ACME-challenge exception
#          into the :80 block (unless you're on dns-01)
#   5. Validates with `nginx -t`; rolls back automatically on failure.
#   6. Reloads nginx only if validation passed.
#
# Idempotent: re-running it will not duplicate the includes.
#
# Usage:
#   sudo bash cloudflare-lockdown.sh
#
set -euo pipefail

NGINX_CONF="/etc/nginx/sites-enabled/medusa"
ALLOWLIST_CONF="/etc/nginx/conf.d/cloudflare-only.conf"
RENEWAL_CONF="/etc/letsencrypt/renewal/infinytree.com.conf"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root (sudo bash cloudflare-lockdown.sh)." >&2
  exit 1
fi

if [[ ! -f "$NGINX_CONF" ]]; then
  echo "Expected config not found at $NGINX_CONF — aborting, nothing changed." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required and was not found on this host — aborting." >&2
  exit 1
fi

echo "== 1. Checking Certbot renewal method =="
CHALLENGE_METHOD="unknown"
if [[ -f "$RENEWAL_CONF" ]]; then
  if grep -qE '^authenticator *= *nginx' "$RENEWAL_CONF"; then
    CHALLENGE_METHOD="http-01-nginx-plugin"
  elif grep -qE '^authenticator *= *webroot' "$RENEWAL_CONF"; then
    CHALLENGE_METHOD="http-01-webroot"
  elif grep -qiE 'dns' "$RENEWAL_CONF"; then
    CHALLENGE_METHOD="dns-01"
  fi
  echo "Detected: $CHALLENGE_METHOD"
else
  echo "[Unverified] $RENEWAL_CONF not found. Assuming HTTP-01 and adding the ACME exception to be safe."
fi

echo "== 2. Backing up $NGINX_CONF -> $BACKUP =="
cp -a "$NGINX_CONF" "$BACKUP"

echo "== 3. Writing Cloudflare allowlist to $ALLOWLIST_CONF =="
mkdir -p "$(dirname "$ALLOWLIST_CONF")"
cat > "$ALLOWLIST_CONF" <<'EOF'
# Cloudflare-only ingress allowlist.
# Source: https://www.cloudflare.com/ips-v4/ and /ips-v6/
# [Unverified vs. live source] Snapshot below — re-fetch periodically,
# Cloudflare does occasionally change these ranges.

# IPv4
allow 173.245.48.0/20;
allow 103.21.244.0/22;
allow 103.22.200.0/22;
allow 103.31.4.0/22;
allow 141.101.64.0/18;
allow 108.162.192.0/18;
allow 190.93.240.0/20;
allow 188.114.96.0/20;
allow 197.234.240.0/22;
allow 198.41.128.0/17;
allow 162.158.0.0/15;
allow 104.16.0.0/13;
allow 104.24.0.0/14;
allow 172.64.0.0/13;
allow 131.0.72.0/22;

# IPv6
allow 2400:cb00::/32;
allow 2606:4700::/32;
allow 2803:f800::/32;
allow 2405:b500::/32;
allow 2405:8100::/32;
allow 2a06:98c0::/29;
allow 2c0f:f248::/32;

deny all;
EOF
chmod 644 "$ALLOWLIST_CONF"

echo "== 4. Patching $NGINX_CONF (block-aware, idempotent) =="
python3 - "$NGINX_CONF" "$ALLOWLIST_CONF" "$CHALLENGE_METHOD" <<'PYEOF'
import re, sys

conf_path, allowlist_path, challenge_method = sys.argv[1], sys.argv[2], sys.argv[3]
with open(conf_path) as f:
    text = f.read()

include_line = f'    include {allowlist_path};'
acme_location = (
    '    location ^~ /.well-known/acme-challenge/ {\n'
    '        allow all;\n'
    '    }'
)

# Find top-level server {...} blocks via brace-depth tracking.
blocks = []
i, n = 0, len(text)
while i < n:
    if text[i:i+7] == 'server ' and (i == 0 or text[i-1] in '\n\t '):
        brace_start = text.index('{', i)
        depth = 1
        k = brace_start + 1
        while depth > 0 and k < n:
            if text[k] == '{':
                depth += 1
            elif text[k] == '}':
                depth -= 1
            k += 1
        blocks.append((i, k, text[i:k]))
        i = k
    else:
        i += 1

if not blocks:
    print("No server {} blocks found — check the file manually.", file=sys.stderr)
    sys.exit(1)

# Apply edits back-to-front so earlier offsets stay valid.
new_text = text
for start, end, block in reversed(blocks):
    is_https = re.search(r'listen\s+443\s+ssl', block) is not None
    is_http = (not is_https) and re.search(r'listen\s+80\b', block) is not None

    if not (is_https or is_http):
        continue
    if include_line.strip() in block:
        continue  # already patched, leave alone

    new_block = block
    if is_https:
        m = re.search(r'(client_max_body_size[^\n]*\n)', new_block)
        insertion = (
            '\n    # Cloudflare-only ingress. Required for CF-IPCountry to be trustworthy.\n'
            f'{include_line}\n'
        )
        if m:
            new_block = new_block[:m.end()] + insertion + new_block[m.end():]
        else:
            brace = new_block.index('{') + 1
            new_block = new_block[:brace] + insertion + new_block[brace:]

    elif is_http:
        parts = []
        if 'well-known/acme-challenge' not in new_block and challenge_method != 'dns-01':
            parts.append(
                '\n    # Let ACME HTTP-01 validation through regardless of source IP —\n'
                "    # Let's Encrypt validators do not connect via Cloudflare.\n"
                f'{acme_location}\n'
            )
        parts.append(
            '\n    # Cloudflare-only ingress. Required for CF-IPCountry to be trustworthy.\n'
            f'{include_line}\n'
        )
        brace = new_block.index('{') + 1
        new_block = new_block[:brace] + ''.join(parts) + new_block[brace:]

    new_text = new_text[:start] + new_block + new_text[end:]

with open(conf_path, 'w') as f:
    f.write(new_text)

print("Patch applied (blocks already containing the include were left untouched).")
PYEOF

echo "== 5. Validating Nginx config =="
if ! nginx -t; then
  echo "nginx -t FAILED. Restoring backup and aborting reload." >&2
  cp -a "$BACKUP" "$NGINX_CONF"
  nginx -t || true
  exit 1
fi

echo "== 6. Reloading Nginx =="
systemctl reload nginx

echo "== Done =="
echo "Backup kept at: $BACKUP"
echo ""
echo "Next steps (do these before you rely on this):"
echo "  1. sudo certbot renew --dry-run     # confirm renewal still works"
echo "  2. Run the curl verification checks from the analysis doc"
