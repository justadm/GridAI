#!/bin/sh
set -eu

ALERT_TG_BOT_TOKEN="${ALERT_TG_BOT_TOKEN:-}"
ALERT_TG_CHAT_ID="${ALERT_TG_CHAT_ID:-}"
ALERT_URL="${ALERT_URL:-http://web:3000}"
INTERVAL="${ALERT_INTERVAL:-60}"

send_alert() {
  if [ -z "$ALERT_TG_BOT_TOKEN" ] || [ -z "$ALERT_TG_CHAT_ID" ]; then
    return 0
  fi
  curl -s -X POST "https://api.telegram.org/bot${ALERT_TG_BOT_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "{\"chat_id\":\"${ALERT_TG_CHAT_ID}\",\"text\":\"$1\"}" >/dev/null 2>&1 || true
}

while true; do
  if ! curl -fsS "$ALERT_URL" >/dev/null 2>&1; then
    send_alert "[SkillRadar] Web healthcheck failed: ${ALERT_URL}"
  fi
  sleep "$INTERVAL"
done
