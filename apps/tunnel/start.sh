#!/usr/bin/env bash
# Finds system ngrok (v3), bypassing the ngrok v2 binary installed by @expo/ngrok in node_modules
NGROK_BIN=$(which -a ngrok 2>/dev/null | grep -v "node_modules" | head -1)

if [ -z "$NGROK_BIN" ]; then
  echo "ERROR: System ngrok not found. Install ngrok v3 from https://ngrok.com/download"
  exit 1
fi

exec "$NGROK_BIN" http --url=growing-hedgehog-yearly.ngrok-free.app 3004
