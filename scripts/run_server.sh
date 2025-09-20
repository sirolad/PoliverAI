#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}"
# Load .env so backend and UI environment vars are available
if [ -f ./.env ]; then
  set -a
  . ./.env
  set +a
fi
exec uvicorn poliverai.app.main:app --reload --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}"
