PoliverAI React Web → NX React Native Porting Plan

Goal
----
Port the existing web frontend at `frontend/src` into the NX monorepo React Native app at
`mono-repo-nx/apps/poliverai/src`, centralizing shared pieces into `mono-repo-nx/libs/*` and `mono-repo-nx/shared-ui` so the codebase can run and evolve in a single mono-repo.

High-level approach
-------------------
1. Create shims to let the RN app import existing web modules during the porting process.
   - `mono-repo-nx/libs/intl` already exists and exposes `useTranslation`.
   - `mono-repo-nx/shared-ui` should re-export tokens and a small set of UI primitives while you incrementally replace them with RN-native components.
2. Port utilities, services and domain logic first (these are platform-agnostic).
3. Port components incrementally, prioritizing high-impact views (PolicyAnalysis, Dashboard, Auth pages).
4. Replace Tailwind-based styling with RN-friendly style objects mapped from `styleTokens` or a small runtime helper.
5. Add platform-specific variants when necessary (e.g., file upload flows, iframe preview replaced by native viewers).

Initial artifacts created
-------------------------
- `mono-repo-nx/shared-ui/src/lib/index.ts` — a temporary shim re-exporting `styleTokens` and a few UI primitives from the web frontend so imports like `@poliverai/shared-ui` work during porting.

Recommended library layout
--------------------------
- mono-repo-nx/libs/
  - intl/        -> localization (already present)
  - services/    -> shared services wrappers (api clients, auth)
  - ui/          -> RN-native shared primitives (buttons, headers, toasts)
- mono-repo-nx/shared-ui/
  - src/lib/     -> compatibility shims and transitional re-exports

Practical steps
---------------
1. Add `@poliverai/shared-ui` and `@poliverai/intl` package aliases to the RN app tsconfig/webpack so imports resolve correctly.
2. Start porting domain logic (services under `frontend/src/services`) into `mono-repo-nx/libs/services`.
3. Port `styleTokens` into `mono-repo-nx/shared-ui` or reference it via the shim and implement `rnStyleFromTokens` mapping for RN.
4. Convert pages incrementally. For each page:
   - Move the component file into `apps/poliverai/src/screens/...`
   - Replace web-only APIs (DOM, window, iframe) with RN alternatives or guarded code paths.
   - Replace Tailwind composition (`twFromTokens`) with a small runtime function that maps tokens to style objects for RN.
5. Replace the transitional shim exports with RN-native implementations inside `shared-ui` once stable.

Testing and validation
----------------------
- Use the existing NX tooling to run the RN app in Expo or React Native CLI.
- Add a small smoke-screen that renders a handful of ported screens.
- Create unit tests for library functions where practical.

Notes
-----
This initial step provides compatibility shims and a plan. If you want, I can:
- Create `mono-repo-nx/libs/services` and scaffold a few services (api client, auth) mapped from `frontend/src/services`.
- Implement a simple `rnStyleFromTokens` inside `shared-ui` that converts the minimal token set to RN style objects.

Tell me which piece to prioritize next (services, style-token RN mapping, port of specific screens like `PolicyAnalysis` or `Dashboard`).
