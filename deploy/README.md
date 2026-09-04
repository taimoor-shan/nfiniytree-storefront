# Production deploy prerequisites for IP-based country detection

This storefront reads the visitor's country from the **`CF-IPCountry`** request
header set by Cloudflare. The header is only safe to trust if the request is
known to have come from Cloudflare's edge — i.e. the VPS does **not** accept
direct internet traffic on `:80` / `:443`.

## Apply on the VPS

```bash
# 1. Copy the lockdown script to the VPS, then run it
sudo bash cloudflare-lockdown.sh

# 2. Confirm Certbot renewal still works
sudo certbot renew --dry-run

# 3. Run the verification script
bash verify-cf-ipcountry.sh
```

The lockdown script (`deploy/scripts/cloudflare-lockdown.sh`):

- Backs up `/etc/nginx/sites-enabled/medusa` to a timestamped file.
- Writes the Cloudflare IP allowlist to `/etc/nginx/conf.d/cloudflare-only.conf`.
- Inserts an `include` of that allowlist into the `:443` and `:80` server blocks
  (block-aware, idempotent — safe to re-run).
- For `:80`, also inserts an `allow all` exception for
  `/.well-known/acme-challenge/` *unless* Certbot is using `dns-01`.
- Validates with `nginx -t` and **automatically rolls back** the config change
  on validation failure.
- Reloads Nginx only if validation passed.

The verification script (`deploy/scripts/verify-cf-ipcountry.sh`):

- Asserts the direct origin is 403 on both `:443` and `:80`.
- Asserts the request through Cloudflare still returns 307 with
  `CF-IPCountry` and the right `Vary` / `Cache-Control`.
- Asserts the `selected-country` cookie round-trips (no second redirect).

The rollback script (`deploy/scripts/cloudflare-rollback.sh`):

- Restores the most recent `medusa.bak.*` file and reloads Nginx. Use this if
  the lockdown breaks something.

## Maintenance

Cloudflare rarely changes its published IP ranges, but they do occasionally.
Refresh `deploy/nginx/cloudflare-only.conf` from
<https://www.cloudflare.com/ips-v4/> and
<https://www.cloudflare.com/ips-v6/> on a weekly cadence and re-run
`cloudflare-lockdown.sh` (it is idempotent).

## What the Next.js side needs

- `src/proxy.ts` reads `CF-IPCountry` via `src/lib/geo/client-country.ts`.
- `x-dev-country` is honored only when `NODE_ENV !== "production"` — use
  `curl -H "x-dev-country: DE" http://localhost:8000/` to exercise the geo
  path during local development without Cloudflare in the loop.
