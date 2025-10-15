# backend (Nx wrapper for the Python FastAPI backend)

This project is an Nx wrapper that exposes the existing Python FastAPI backend located in `../default` as an Nx application named `backend`.

Why this wrapper?
- The backend is already developed under the `default/` folder. To avoid duplicating files and to keep the source of truth, this project provides Nx targets that run the backend's existing scripts and commands.

Available targets (via `nx`):

- `NX_DAEMON=false nx run backend:bootstrap` — Run the bootstrap script to create a virtualenv and install dependencies.
- `NX_DAEMON=false nx run backend:serve` — Start the FastAPI development server (calls `./scripts/run_server.sh` in `default/`).
- `NX_DAEMON=false nx run backend:test` — Run backend tests (calls `pytest` in `default/`).
- `NX_DAEMON=false nx run backend:lint` — Lint the backend with `ruff`.
- `NX_DAEMON=false nx run backend:typecheck` — Run `mypy` type checks.

Notes
- The wrapper runs commands with `cwd` set to `../default`, so commands are executed from the backend folder.
- The `default/frontend` folder is intentionally not included in the Nx app; the React frontend remains in place and can still be run independently.
- If you prefer the backend to be fully copied into `apps/backend/src`, I can create a copy instead. That approach will duplicate files and require keeping them in sync.

How to run locally (recommended):

1. Bootstrap the environment (creates virtualenv):

```bash
cd mono-repo-nx
npx nx run backend:bootstrap
```

2. Start the API:

```bash
npx nx run backend:serve
```

This will execute the existing scripts inside the `default` folder so you keep the current structure and setup.
