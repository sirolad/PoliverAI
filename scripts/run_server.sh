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
PYTHON_CMD="uvicorn"
if [ -x "/opt/venv/bin/python" ]; then
  PYTHON_CMD="/opt/venv/bin/python -m uvicorn"
elif [ -x "/app/.venv/bin/python" ]; then
  PYTHON_CMD="/app/.venv/bin/python -m uvicorn"
fi

# Default host inside container should be 0.0.0.0 so other containers can reach it
exec $PYTHON_CMD poliverai.app.main:app --reload --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"
