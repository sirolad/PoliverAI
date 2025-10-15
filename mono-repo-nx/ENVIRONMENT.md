# Environment variables (monorepo guidance)

This repository uses dotenv-style environment variables. This file documents conventions and how to access variables from different runtimes.

Files added

- `.env` — repo-level defaults for local development (committed). Keep secrets out of this file.
- `.env.example` — example keys to copy for local development.
- `apps/poliverai/.env` — app-level variables (used by Expo and Vite when running the app).

Conventions

- Variables prefixed with `VITE_` are exposed to Vite's client bundle (web).
- Variables prefixed with `EXPO_PUBLIC_` are exposed to Expo's JS runtime when using `expo/config` or `expo-constants`.
- Server-side code or node scripts should read `API_URL`, `WS_URL`, etc., directly from process.env.

Using variables in code

- Web (Vite):
  - Access `import.meta.env.POLIVERAI_API_URL`

- Expo / React Native (JS runtime):
  - Access `process.env.EXPO_PUBLIC_API_URL` if using a bundler that injects env vars or `Constants.manifest.extra` configured via `app.json`/`app.config.js`.

Notes

- For production or CI, provide env vars via your CI/CD provider or native environment configuration. Do not commit secrets into the repo.
- If you want runtime config for native apps (iOS/Android) consider using Expo's `app.config.js` to read from env and embed into build-time constants.
