#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

UMAMI_URL="${UMAMI_URL:-http://localhost:3000}"
UMAMI_USER="${UMAMI_USER:-admin}"
UMAMI_PASSWORD="${UMAMI_PASSWORD:-umami}"
WEBSITE_NAME="${WEBSITE_NAME:-euroweekender.com}"
WEBSITE_DOMAIN="${WEBSITE_DOMAIN:-localhost}"

echo "Starting Umami..."
docker compose up -d umami-db umami

echo "Waiting for Umami..."
for _ in $(seq 1 60); do
  if curl -sf "$UMAMI_URL/api/heartbeat" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

TOKEN="$(curl -sf -X POST "$UMAMI_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$UMAMI_USER\",\"password\":\"$UMAMI_PASSWORD\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")"

WEBSITES="$(curl -sf "$UMAMI_URL/api/websites" -H "Authorization: Bearer $TOKEN")"
WEBSITE_ID="$(python3 - <<'PY' "$WEBSITES" "$WEBSITE_NAME"
import json, sys
payload = json.loads(sys.argv[1])
name = sys.argv[2]
for site in payload.get("data", []):
    if site.get("name") == name:
        print(site["id"])
        break
PY
)"

if [ -z "$WEBSITE_ID" ]; then
  echo "Creating website $WEBSITE_NAME..."
  CREATE_RESPONSE="$(curl -sf -X POST "$UMAMI_URL/api/websites" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$WEBSITE_NAME\",\"domain\":\"$WEBSITE_DOMAIN\"}")"
  WEBSITE_ID="$(python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" <<<"$CREATE_RESPONSE")"
fi

ENV_FILE="$ROOT_DIR/.env"
FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env"

touch "$ENV_FILE"
grep -q '^VITE_UMAMI_SCRIPT_URL=' "$ENV_FILE" \
  && sed -i '' "s|^VITE_UMAMI_SCRIPT_URL=.*|VITE_UMAMI_SCRIPT_URL=/umami/script.js|" "$ENV_FILE" \
  || echo 'VITE_UMAMI_SCRIPT_URL=/umami/script.js' >> "$ENV_FILE"

grep -q '^VITE_UMAMI_WEBSITE_ID=' "$ENV_FILE" \
  && sed -i '' "s|^VITE_UMAMI_WEBSITE_ID=.*|VITE_UMAMI_WEBSITE_ID=$WEBSITE_ID|" "$ENV_FILE" \
  || echo "VITE_UMAMI_WEBSITE_ID=$WEBSITE_ID" >> "$ENV_FILE"

grep -q '^UMAMI_DB_PASSWORD=' "$ENV_FILE" \
  || echo 'UMAMI_DB_PASSWORD=umami' >> "$ENV_FILE"

grep -q '^UMAMI_APP_SECRET=' "$ENV_FILE" \
  || echo "UMAMI_APP_SECRET=$(openssl rand -hex 32)" >> "$ENV_FILE"

cat > "$FRONTEND_ENV_FILE" <<EOF
VITE_UMAMI_SCRIPT_URL=/umami/script.js
VITE_UMAMI_WEBSITE_ID=$WEBSITE_ID
EOF

echo ""
echo "Umami is ready."
echo "  Dashboard:  $UMAMI_URL"
echo "  Login:      $UMAMI_USER / $UMAMI_PASSWORD  (change this in the dashboard)"
echo "  Website ID: $WEBSITE_ID"
echo ""
echo "Rebuilding frontend..."
docker compose build frontend
docker compose up -d frontend

echo "Done. Analytics script: http://localhost:4200/umami/script.js"
