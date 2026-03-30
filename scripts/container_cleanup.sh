#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
THRESHOLD="${DISK_THRESHOLD:-85}"
HOSTNAME_OVERRIDE="${HOSTNAME_OVERRIDE:-}"

usage() {
  cat <<'EOF'
Usage:
  container_cleanup.sh daily|weekly [threshold]

Modes:
  daily   Run docker builder prune only and send Telegram report.
  weekly  Run image/volume prune only if disk usage is >= threshold and send Telegram report.

Env:
  DISK_THRESHOLD   Disk usage percent for weekly aggressive prune (default: 85)
  TG_ENV_FILE      Optional explicit env source path
EOF
}

if [[ -z "$MODE" || "$MODE" == "-h" || "$MODE" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ge 2 ]]; then
  THRESHOLD="$2"
fi

if [[ ! "$THRESHOLD" =~ ^[0-9]+$ ]]; then
  echo "threshold must be integer" >&2
  exit 2
fi

if [[ "$MODE" != "daily" && "$MODE" != "weekly" ]]; then
  echo "unknown mode: $MODE" >&2
  exit 2
fi

load_env_file() {
  local file="$1"
  [[ -r "$file" ]] || return 0
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    [[ "${line:0:1}" != "#" ]] || continue
    if [[ "$line" == Environment=* ]]; then
      line="${line#Environment=}"
    fi
    [[ "$line" == *=* ]] || continue
    local key="${line%%=*}"
    local value="${line#*=}"
    export "$key=$value"
  done < "$file"
}

adopt_tg_aliases() {
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" && -n "${OPS_TG_BOT_TOKEN:-}" ]]; then
    export TELEGRAM_BOT_TOKEN="$OPS_TG_BOT_TOKEN"
  fi
  if [[ -z "${TELEGRAM_CHAT_ID:-}" && -n "${OPS_TG_CHAT_ID:-}" ]]; then
    export TELEGRAM_CHAT_ID="$OPS_TG_CHAT_ID"
  fi
}

load_telegram_env() {
  local sources=()
  if [[ -n "${TG_ENV_FILE:-}" ]]; then
    sources+=("$TG_ENV_FILE")
  fi
  sources+=(
    "/opt/GridAI/.env"
    "/etc/systemd/system/b24-remote-testing.service"
    "/opt/tg-notify/.env"
  )
  local src=""
  for src in "${sources[@]}"; do
    load_env_file "$src"
    adopt_tg_aliases
    if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
      return 0
    fi
  done
  return 0
}

human_bytes() {
  local bytes="$1"
  awk -v b="$bytes" 'BEGIN {
    split("B KB MB GB TB PB", u, " ");
    i = 1;
    while (b >= 1024 && i < 6) { b /= 1024; i++; }
    if (b >= 100 || i == 1) printf "%.0f%s", b, u[i];
    else printf "%.1f%s", b, u[i];
  }'
}

disk_use_pct() {
  df -P / | awk 'NR==2 { gsub(/%/, "", $5); print $5 }'
}

disk_used_bytes() {
  df -PB1 / | awk 'NR==2 { print $3 }'
}

disk_avail_bytes() {
  df -PB1 / | awk 'NR==2 { print $4 }'
}

send_tg() {
  local text="$1"
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    echo "[warn] telegram env missing, skip notify"
    return 0
  fi
  curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${text}" \
    -d "disable_web_page_preview=true" >/tmp/container_cleanup_tg.json
  echo "[ok] telegram report sent"
}

docker_df_line() {
  local type="$1"
  docker system df --format '{{.Type}}|{{.Size}}|{{.Reclaimable}}' | awk -F'|' -v t="$type" '$1 == t { printf "%s (reclaimable %s)", $2, $3 }'
}

load_telegram_env

HOSTNAME_VALUE="${HOSTNAME_OVERRIDE:-$(hostname)}"
STAMP="$(date -Iseconds)"
BEFORE_PCT="$(disk_use_pct)"
BEFORE_USED="$(disk_used_bytes)"
BEFORE_AVAIL="$(disk_avail_bytes)"

BUILD_BEFORE="$(docker_df_line Build\ Cache || true)"
IMAGES_BEFORE="$(docker_df_line Images || true)"
VOLUMES_BEFORE="$(docker_df_line Local\ Volumes || true)"

ACTION_SUMMARY=""
RECLAIM_BYTES=0

if [[ "$MODE" == "daily" ]]; then
  BUILDER_OUT="$(docker builder prune -af 2>&1)"
  ACTION_SUMMARY="builder prune"
  if grep -q 'Total:' <<<"$BUILDER_OUT"; then
    ACTION_SUMMARY="builder prune: $(awk '/^Total:/ {print $2}' <<<"$BUILDER_OUT" | tail -n1)"
  fi
else
  if (( BEFORE_PCT >= THRESHOLD )); then
    IMAGE_OUT="$(docker image prune -af 2>&1)"
    VOLUME_OUT="$(docker volume prune -f 2>&1)"
    ACTION_SUMMARY="weekly full prune"
    if grep -q 'Total reclaimed space:' <<<"$IMAGE_OUT"; then
      ACTION_SUMMARY+="; images $(awk -F': ' '/^Total reclaimed space:/ {print $2}' <<<"$IMAGE_OUT" | tail -n1)"
    fi
    if grep -q 'Total reclaimed space:' <<<"$VOLUME_OUT"; then
      ACTION_SUMMARY+="; volumes $(awk -F': ' '/^Total reclaimed space:/ {print $2}' <<<"$VOLUME_OUT" | tail -n1)"
    fi
  else
    ACTION_SUMMARY="weekly full prune skipped: usage ${BEFORE_PCT}% < threshold ${THRESHOLD}%"
  fi
fi

AFTER_PCT="$(disk_use_pct)"
AFTER_USED="$(disk_used_bytes)"
AFTER_AVAIL="$(disk_avail_bytes)"

if (( BEFORE_USED > AFTER_USED )); then
  RECLAIM_BYTES=$(( BEFORE_USED - AFTER_USED ))
fi

BUILD_AFTER="$(docker_df_line Build\ Cache || true)"
IMAGES_AFTER="$(docker_df_line Images || true)"
VOLUMES_AFTER="$(docker_df_line Local\ Volumes || true)"

MESSAGE=$(
  cat <<EOF
🧹 Container cleanup on ${HOSTNAME_VALUE}
Mode: ${MODE}
Time: ${STAMP}
Action: ${ACTION_SUMMARY}
Disk: ${BEFORE_PCT}% -> ${AFTER_PCT}%
Freed: $(human_bytes "$RECLAIM_BYTES")
Images: ${IMAGES_BEFORE:-n/a} -> ${IMAGES_AFTER:-n/a}
Build cache: ${BUILD_BEFORE:-n/a} -> ${BUILD_AFTER:-n/a}
Volumes: ${VOLUMES_BEFORE:-n/a} -> ${VOLUMES_AFTER:-n/a}
Avail: $(human_bytes "$BEFORE_AVAIL") -> $(human_bytes "$AFTER_AVAIL")
EOF
)

echo "$MESSAGE"
send_tg "$MESSAGE"
