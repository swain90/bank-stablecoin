#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  if [[ -n "${DAML_PID:-}" ]]; then
    kill "${DAML_PID}" 2>/dev/null || true
  fi
  if [[ -n "${PROXY_PID:-}" ]]; then
    kill "${PROXY_PID}" 2>/dev/null || true
  fi
}

trap cleanup SIGINT SIGTERM EXIT

cd "${ROOT_DIR}/daml"
daml build
daml start &
DAML_PID=$!

cd "${ROOT_DIR}"
node cors-proxy.js &
PROXY_PID=$!

wait "${DAML_PID}"
