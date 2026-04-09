#!/usr/bin/env bash
set -euo pipefail

python3 -m venv .venv
# shellcheck source=/dev/null
source .venv/bin/activate
python -m pip install --upgrade pip wheel

# Install core + dev tools
pip install -e ".[dev]"
# Optional RAG dependencies (best-effort)
pip install -e ".[rag]" || true

# Install pre-commit hooks
pre-commit install || true

echo "Environment ready. To activate: source .venv/bin/activate"
echo "Run API: ./scripts/run_server.sh"
