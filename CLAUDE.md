# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Sub Code" (cvs) — a Next.js 16 (App Router) job board / recruitment platform (cv.subcodeco.com) with three user roles: job seeker (`user`), employer (`company`), and `admin`. Frontend talks to an external Laravel-style REST API; this repo is purely the Next.js frontend/BFF layer.

## Commands

```bash
npm run dev      # start dev server (next dev)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test runner configured in this repo (no jest/vitest/playwright) — don't assume one exists.

## Architecture

### Routing & i18n
- Locale-prefixed routes live under `app/[locale]/` (`en`, `ar`, `de`; **`ar` is the default locale**). Non-locale API routes live under `app/api/`.
- `next-intl` handles i18n; config is in `i18n/routing.ts` (locale list) and `i18n/request.ts` (message loading from `messages/{locale}.json`).
- `app/[locale]/layout.tsx` sets `dir="rtl"`/`"ltr"` based on locale and loads the session server-side via `getSession()` — it's the single source of truth for auth state passed into `SiteChrome`; don't re-fetch the profile elsewhere in the tree.

### Auth — important quirk
- Auth is **not** actually NextAuth despite `next-auth` being a dependency and an `app/api/auth/[...nextauth]/route.ts` file existing. That route is wired to a stub `handlers` object in `lib/auth-token.ts` that always 404s. Real auth is custom, cookie-based:
  - Cookies: `access_token`, `user_role`, `user_meta` (all in `lib/auth-token.ts`).
  - Login/logout/register/etc. are plain route handlers under `app/api/auth/*` that call the upstream API via `callBackend()` and set/clear cookies with `setAuthCookies()` / `clearAuthCookies()`.
  - `getSession()` (cached per-request via React `cache`) reads the cookie, calls the upstream `/auth/profile`, and falls back to the cookie-derived `user_meta` snapshot on transient upstream failures.
- **`proxy.ts` at the repo root contains the actual route-protection/i18n middleware logic (locale redirects, dashboard role gating, security headers) but is not named `middleware.ts`, so Next.js does not load it as middleware.** It is effectively dead code as it stands — nothing imports it. Treat any request to "fix" or "wire up" this logic as needing a rename/move to `middleware.ts`, not a bug in the logic itself.

### API layer — two tiers, don't confuse them
- `lib/api/services/*.service.ts` — the real typed data layer. Each calls the upstream API via `lib/api/client.ts`'s `api.get/post/put/patch/delete`, and normalizes/localizes the response shape (upstream fields vary: `name` may be a string or `{en, ar, de}`, dates may be unix seconds/ms/SQL strings, list payloads may be nested under `data.data`, etc. — see `jobs.service.ts` for the normalization patterns to follow).
- `features/*/services/*.service.ts` — feature-local, UI-facing helpers (e.g. static filter option lists). These are a different, much thinner thing than `lib/api/services` despite the similar filename — check which one you're editing.
- `lib/api/config.ts` exports `API_BASE_URL` (from `NEXT_PUBLIC_API_URL`, default `https://dashboardtalent.talent-sc.de/api/v1`) — the single source of truth for the backend origin. Don't hardcode the URL elsewhere.
- `lib/api/client.ts`'s `fetchApi` refuses to call external origins directly from the browser (`ensureBrowserSafeRequest`) — browser code must go through a local `/api/...` route, not the upstream API directly.
- `app/api/proxy/[...path]/route.ts` is a generic authenticated pass-through proxy to the upstream API for arbitrary paths (used by things like the tickets/profile-update flows in `lib/api-client.ts`). Prefer adding a dedicated `lib/api/services/*` + route handler over routing more logic through the generic proxy.

### Feature modules
- Business logic is organized under `features/<name>/` with a consistent internal shape: `components/`, `hooks/`, `services/`, `lib/`, sometimes `types/`, and an `index.ts` barrel re-exporting the public surface. Import feature code via its barrel (`@/features/jobs`) where one exists rather than deep-importing internal files.
- `app/[locale]/dashboard/{admin,company,user}/*` pages are role-scoped; route protection for these is intended to happen in middleware (see the `proxy.ts` note above) based on the `user_role` cookie normalized via `normalizeRole()`/`resolveUserRole()` in `lib/auth-token.ts`.

### UI
- shadcn/ui components live in `components/ui` (style: `radix-nova`, base color `neutral`, icon library `lucide`, no class prefix — see `components.json`). `components/motion` holds animation wrapper components (built on `motion`/Framer Motion).
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).

### Real-time (tickets/notifications)
- `lib/echo.ts`'s `getEcho()` lazily creates a single shared Laravel Echo/Pusher connection (browser-only). Channel authorization goes through the local `/api/broadcasting/auth` route (cookie-based), not a bearer token in JS, because `access_token` is httpOnly — never wire a Pusher authorizer directly to the upstream API.
- Requires `NEXT_PUBLIC_PUSHER_APP_KEY` / `NEXT_PUBLIC_PUSHER_APP_CLUSTER` env vars.
