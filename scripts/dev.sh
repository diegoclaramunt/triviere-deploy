#!/usr/bin/env sh
set -eu

export APP_NAME="${APP_NAME:-cat}"
export CLIENT_NAME="${CLIENT_NAME:-acme}"
export MONGO_COLLECTION="${MONGO_COLLECTION:-$CLIENT_NAME}"
export PORT="${API_PORT:-3000}"
WEB_PORT="${WEB_PORT:-4200}"
started_mongo=0
api_pid=''

cleanup() {
  if [ -n "$api_pid" ]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  if [ "$started_mongo" -eq 1 ]; then
    docker compose stop mongo >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if [ -z "${MONGO_URI:-}" ]; then
  export MONGO_URI='mongodb://127.0.0.1:27017/triviere'
  docker compose up -d mongo
  started_mongo=1
fi

node --watch server/index.mjs &
api_pid=$!

npx ng serve \
  --host 0.0.0.0 \
  --port "$WEB_PORT" \
  --serve-path "/$CLIENT_NAME" \
  --proxy-config proxy.conf.cjs
