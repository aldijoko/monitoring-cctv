# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend-only admin panel for a CCTV monitoring platform. SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 3 + TypeScript (strict). This repo is the frontend; it talks to a separate Go backend that is not part of this repo.

## Related repository

The backend lives in a sibling repo at `D:\Source Code\cctv\backend-monitoring` (Go/Gin/GORM API, also has its own `CLAUDE.md`). It is not a subdirectory of this repo — access it via its own absolute path. When a change here requires a matching backend change (new endpoint, DTO/response shape change, RBAC rule), read/edit that repo directly rather than guessing at the contract; both repos are local and safe to access for development without asking for confirmation first.

## Commands

```bash
npm run dev          # vite dev server on :5173, proxies /api/* to http://localhost:8000
npm run build         # production build
npm run preview       # preview production build
npm run check          # svelte-kit sync && svelte-check (type checking)
npm run check:watch    # svelte-check in watch mode
npm run format          # prettier --write .
npm run lint             # prettier --check . && eslint .
```

There is no test suite/runner configured in this repo. `npm run lint`'s eslint step will fail unless eslint is installed and configured — there is no eslint config file present, so prefer `npm run check` and `prettier --check .` when verifying changes.

## Environment variables

Two separate API base variables exist, easy to confuse:
- `PUBLIC_API_BASE` (`.env.example`, client-visible) — used implicitly via `/api/v1` + Vite's dev proxy (`vite.config.ts`) for browser-side calls in `src/lib/api/*`.
- `API_BASE_URL` (server-only, in `.env.example` as `http://localhost:8000/api/v1`) — read via `$env/static/private` in `src/lib/server/api.ts` and `src/routes/login/+page.server.ts`. Must point at the running backend (full URL including `/api/v1`, not proxied by Vite) for server-side loads/actions to work; SvelteKit will fail to build/start without it once those modules are imported.

See the backend's [CLAUDE.md](../backend-monitoring/CLAUDE.md#docker-dev) for how to actually get something listening on `:8000` (Docker Compose, recommended) — this repo has no backend of its own.

## Architecture

### Dual client/server API layers

Because SvelteKit runs both in the browser and on the server, there are two parallel HTTP client wrappers with the same response contract (raw JSON from the Go backend, no `{success, data}` envelope):

- `src/lib/api/client.ts` — browser-side `request()`/`apiGet`/`apiPost`/etc. Reads the bearer token from the `auth` store (`getAccessToken()`), calls `/api/v1/*` (proxied by Vite in dev), and on a 401 clears the session + shows a toast.
- `src/lib/server/api.ts` — `serverApiFetch(event, path, options)`, used from `+page.server.ts`/`+layout.server.ts` load functions and form actions. Can't read `localStorage`, so it pulls the token from `event.locals.session.accessToken` and calls `API_BASE_URL` directly (not proxied).

Per-resource endpoint modules (`src/lib/api/{auth,cameras,dashboard,edges,recordings,users}.ts`) wrap the client-side `client.ts` functions.

### Auth: cookie/localStorage bridge

Auth state exists in three places that must stay in sync — this is the trickiest part of the codebase:

1. **Cookies** (`src/lib/auth-cookie.ts` defines the names: `cctv_access_token`, `cctv_refresh_token`, `cctv_user`) — set server-side by the login form action (`src/routes/login/+page.server.ts`) with `httpOnly: false`. They must stay non-httpOnly: client code (`stores/auth.ts`, `client.ts`) needs to read the access token via `document.cookie` because the Go backend's `AuthMiddleware` only checks the `Authorization` header, not cookies.
2. **`event.locals.session`** — populated on every request by `src/hooks.server.ts` from those cookies. It does *not* verify the JWT; that's the Go backend's job on each real API call. This is what `serverApiFetch` and `(app)/+layout.server.ts`'s auth guard rely on.
3. **The `auth` Svelte store + `localStorage`** (`src/lib/stores/auth.ts`, key `cctv.auth`) — used by all existing client-side code (mutations, `StreamPlayer` polling, etc). Since login now happens entirely server-side (setting cookies, no localStorage access), `hydrateFromServer()` — called from `(app)/+layout.svelte` with the `user` from `+layout.server.ts`'s load — reads the cookies and syncs them into this store/localStorage on navigation.

Auth is enforced twice by design: `(app)/+layout.server.ts` redirects to `/login` server-side (so SSR'd data isn't fetched for logged-out users and initial HTML isn't empty), and there's also a client-side `isAuthenticated` guard in `(app)/+layout.svelte`. When touching auth, keep all of: `auth-cookie.ts` names, `hooks.server.ts`, `stores/auth.ts`, and both layout guards in sync.

### Routing

- `(app)/` route group = everything requiring auth (dashboard, edges, cameras, live, recordings, users, profile). Guarded per above.
- `/login` and the root `/` (redirects to `/login` or `/dashboard`) sit outside the group.
- Most list/detail pages follow the pattern: `+page.server.ts` loads data via `serverApiFetch` (reading filters/sort/pagination from `url.searchParams`), `+page.svelte` renders it, mutations go through form actions or client-side `src/lib/api/*` calls.

### Other notable pieces

- `src/lib/components/StreamPlayer.svelte` — HLS live view via `hls.js`; camera `source_url` (RTSP) is never sent to the browser, only the transcoded `stream_url` (HLS via mediamtx) is (see `src/lib/types/api.ts`'s `LiveCamera`). Also runs a `currentTime`-polling stall watchdog (`startStallWatchdog`, every 4s once playback starts) alongside the native `waiting`/`playing` events — camera sources are pulled public feeds that can freeze mid-playback without ever firing `waiting` (the video element still has *a* frame, it just stops advancing), which otherwise silently looks identical to a healthy tile in a monitoring grid. Backend-side mitigation for the same flakiness (mediamtx's `alwaysAvailable`) is documented in the backend's [CLAUDE.md](../backend-monitoring/CLAUDE.md#streaming-pipeline-mediamtx) — that covers the source going fully offline, this watchdog covers it staying "online" but stuck.
- `src/lib/components/{BarChart,LineChart,Sparkline}.svelte` — Chart.js wrappers used on the dashboard.
- Brand colors (`brand-50`...`brand-700`) are defined in `tailwind.config.ts`; rename the `brand` token if white-labeling for a different tenant.
- Prettier: tabs, single quotes, no trailing commas, printWidth 100 (`.prettierrc`).
