#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}"
# Load .env so backend and UI environment vars are available
if [ -f ./.env ]; then
  set -a
  . ./.env
  set +a
fi
<<<<<<< HEAD

# If a project venv exists at /app/.venv, use its python to run uvicorn to avoid
# entrypoint script shebang issues inside some Docker base images.
PYTHON_CMD="uvicorn"
if [ -x "/opt/venv/bin/python" ]; then
  PYTHON_CMD="/opt/venv/bin/python -m uvicorn"
elif [ -x "/app/.venv/bin/python" ]; then
  PYTHON_CMD="/app/.venv/bin/python -m uvicorn"
fi

# If the KEY_JSON env var is present (Secret Manager value injected as env), write it to disk
# so code expecting a credentials file (GOOGLE_APPLICATION_CREDENTIALS) continues to work.
if [ -n "${KEY_JSON:-}" ]; then
  echo "Writing KEY_JSON secret to /secrets/key.json"
  mkdir -p /secrets
  # Use printf to preserve newlines exactly
  printf '%s' "${KEY_JSON}" > /secrets/key.json
  chmod 600 /secrets/key.json || true
  export GOOGLE_APPLICATION_CREDENTIALS=/secrets/key.json
  # Also set the app-specific env var if the app expects the filename
  export POLIVERAI_GCS_CREDENTIALS_JSON=/secrets/key.json
fi

# Default host inside container should be 0.0.0.0 so other containers can reach it
exec $PYTHON_CMD poliverai.app.main:app --reload --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"
=======
exec uvicorn poliverai.app.main:app --reload --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}"
>>>>>>> main
