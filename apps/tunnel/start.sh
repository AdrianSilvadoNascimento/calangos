#!/usr/bin/env bash
set -e

# Finds system ngrok (v3), bypassing the ngrok v2 binary installed by @expo/ngrok in node_modules
NGROK_BIN=$(which -a ngrok 2>/dev/null | grep -v "node_modules" | head -1)

if [ -z "$NGROK_BIN" ]; then
  echo "ERROR: System ngrok not found. Install ngrok v3 from https://ngrok.com/download"
  exit 1
fi

ENV_FILE="$(dirname "$0")/../mobile/.env"
if [ -f "$ENV_FILE" ]; then
  NGROK_AUTHTOKEN=$(grep -E '^NGROK_AUTHTOKEN=' "$ENV_FILE" | tail -1 | cut -d= -f2-)
fi

if [ -z "$NGROK_AUTHTOKEN" ]; then
  echo "ERROR: NGROK_AUTHTOKEN not set in $ENV_FILE"
  exit 1
fi

exec "$NGROK_BIN" http --authtoken="$NGROK_AUTHTOKEN" --url=growing-hedgehog-yearly.ngrok-free.app 3004
