# Production deploy prerequisites for IP-based country detection

This storefront reads the visitor's country from the **`CF-IPCountry`** request
header set by Cloudflare. The header is only safe to trust if the request is
known to have come from Cloudflare's edge — i.e. the VPS does **not** accept
direct internet traffic on `:80` / `:443`.

## Required Nginx change (apply on the VPS)

In the storefront's `server { }` block (typically
`/etc/nginx/sites-enabled/infinytree.conf` or similar), **before** any
`location` rules, paste the contents of `deploy/nginx/cloudflare-only.conf`
from this repo. The block lists Cloudflare's published IPv4 and IPv6 ranges
followed by `deny all;`.

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Required Nginx check (apply on the VPS)

Verify no rule strips `CF-IPCountry` before it reaches Node:

```bash
sudo grep -rn -E 'more_clear_input_headers|proxy_set_header.*CF-IPCountry' /etc/nginx/
```

You should see no `more_clear_input_headers CF-IPCountry` line. A custom
`proxy_set_header` is fine; only `more_clear_input_headers` would remove the
header (and only with the `headers-more` Nginx module loaded).

## Production verification (run after the Nginx change)

```bash
# 1. Cloudflare headers reach origin
curl -sI https://infinytree.com/ | grep -iE 'cf-|cf_ipcountry'

# 2. Direct origin is now blocked
curl -sI -H "CF-IPCountry: HU" https://212.227.28.191/ \
  --resolve infinytree.com:443:212.227.28.191
# Expect: HTTP/1.1 403

# 3. Legitimate visitor flow still works
curl -sI https://infinytree.com/
# Expect: 307 to /<region>/ + Set-Cookie: selected-country=<region>
#          Cache-Control: no-store
#          Vary: Cookie, CF-IPCountry

# 4. XX / unknown values fall through
curl -sI -H "CF-IPCountry: XX" https://infinytree.com/
# Expect: 307 to /hu/ (DEFAULT_REGION)
```

## Maintenance

Cloudflare rarely changes its published IP ranges, but they do occasionally.
Refresh `deploy/nginx/cloudflare-only.conf` from
<https://www.cloudflare.com/ips-v4/> and
<https://www.cloudflare.com/ips-v6/> on a weekly cadence and redeploy.
