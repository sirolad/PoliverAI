#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}"
# Load .env so backend and UI environment vars are available
if [ -f ./.env ]; then
  set -a
  . ./.env
  set +a
fi

# If a project venv exists at /app/.venv, use its python to run uvicorn to avoid
# entrypoint script shebang issues inside some Docker base images.
if [ -x "/app/.venv/bin/python" ]; then
  exec "/app/.venv/bin/python" -m uvicorn poliverai.app.main:app --reload --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}"
else
  exec uvicorn poliverai.app.main:app --reload --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}"
fi
