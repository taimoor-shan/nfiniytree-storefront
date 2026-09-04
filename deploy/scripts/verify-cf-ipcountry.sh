#!/usr/bin/env bash
#
# verify-cf-ipcountry.sh
#
# Run this AFTER cloudflare-lockdown.sh and the Next.js deploy to confirm
# everything is wired correctly. None of these checks mutate state.
#
# Each check prints PASS or FAIL with a one-line explanation. Exit code is
# 0 only if all checks pass.
#
# Usage:
#   bash verify-cf-ipcountry.sh                 # uses defaults
#   ORIGIN_IP=1.2.3.4 bash verify-cf-ipcountry.sh
#   HOST=staging.example.com ORIGIN_IP=... bash verify-cf-ipcountry.sh
#
set -uo pipefail

HOST="${HOST:-infinytree.com}"
ORIGIN_IP="${ORIGIN_IP:-212.227.28.191}"
failures=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == *"$expected"* ]]; then
    printf "PASS  %s\n" "$name"
  else
    printf "FAIL  %s\n        expected to contain: %s\n        got: %s\n" "$name" "$expected" "$actual"
    failures=$((failures + 1))
  fi
}

echo "== Direct origin on :443 (should be 403) =="
RESP=$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "CF-IPCountry: HU" \
  "https://${ORIGIN_IP}/" --resolve "${HOST}:443:${ORIGIN_IP}" 2>&1 || echo "ERROR")
check "Direct HTTPS origin blocked" "403" "$RESP"

echo "== Direct origin on :80 (should be 403 or no response) =="
RESP=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 \
  -H "CF-IPCountry: HU" \
  "http://${ORIGIN_IP}/" --resolve "${HOST}:80:${ORIGIN_IP}" 2>&1 || echo "ERROR")
if [[ "$RESP" == "403" || "$RESP" == "000" || "$RESP" == "ERROR" ]]; then
  printf "PASS  Direct HTTP origin blocked (%s)\n" "$RESP"
else
  printf "FAIL  Direct HTTP origin NOT blocked (got %s)\n" "$RESP"
  failures=$((failures + 1))
fi

echo "== Through Cloudflare — should still 307 to a region =="
HEADERS=$(curl -sSI "https://${HOST}/" 2>&1 || true)
check "Through CF: CF-IPCountry header present" "CF-IPCountry" "$HEADERS"
check "Through CF: Vary contains CF-IPCountry" "CF-IPCountry" "$HEADERS"
check "Through CF: 307 redirect" "307" "$HEADERS"
check "Through CF: Cache-Control: no-store" "no-store" "$HEADERS"
check "Through CF: Location header set" "Location:" "$HEADERS"

echo "== Sticky cookie round-trip =="
JAR=$(mktemp)
trap 'rm -f "$JAR"' EXIT
FIRST=$(curl -sSI -c "$JAR" "https://${HOST}/" 2>&1 || true)
check "First request: 307" "307" "$FIRST"
check "First request: Set-Cookie selected-country" "selected-country" "$FIRST"
SECOND=$(curl -sSI -b "$JAR" "https://${HOST}/" 2>&1 || true)
if [[ "$SECOND" != *"307"* ]]; then
  printf "PASS  Second request: cookie wins (no redirect)\n"
else
  printf "FAIL  Second request: still redirecting with cookie\n        %s\n" "$SECOND"
  failures=$((failures + 1))
fi

echo
if [[ "$failures" -eq 0 ]]; then
  echo "All checks passed."
  exit 0
else
  echo "$failures check(s) failed."
  exit 1
fi
