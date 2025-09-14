#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="src${PYTHONPATH:+:$PYTHONPATH}"
exec uvicorn poliverai.app.main:app --reload --host 127.0.0.1 --port "${PORT:-8000}"