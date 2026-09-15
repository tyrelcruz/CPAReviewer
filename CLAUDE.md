# CLAUDE.md — KABIS CPA Reviewer

Reference doc for anyone (human or AI) developing this project. It codifies the
architecture, security, and responsiveness standards this codebase already
follows — keep new code consistent with it rather than introducing a
one-off pattern.

## 1. Project shape

Monorepo, two independently-run packages, no shared build tooling between them,
plus one root-level `docker-compose.yml` that can run the whole stack:

```
CPAReviewer/
├── docker-compose.yml   unified stack: mysql, backend, frontend, phpMyAdmin
├── frontend/   React 19 + Vite + TypeScript + Tailwind v4 + React Router
└── backend/    Express + TypeScript + MySQL (mysql2) + JWT auth
```

Commands (run from inside each package, not the repo root, except the
`docker:*` ones which target the root `docker-compose.yml`):

| Package  | Command          | Does |
|----------|------------------|------|
| frontend | `npm run dev`    | Vite dev server, default port 5173 |
| frontend | `npm run build`  | `tsc -b && vite build` |
| frontend | `npm run lint`   | `oxlint` (not eslint) |
| backend  | `npm run dev`    | `tsx watch src/index.ts`, port from `.env` (`PORT`, default 8001) |
| backend  | `npm run build`  | `tsc -b` |
| backend  | `npm run db:up`  | `docker compose up -d mysql phpmyadmin` — just the DB + admin UI, for running `backend`/`frontend` natively on the host |
| backend  | `npm run db:seed`| Seeds a demo user (`demo@cpareviewer.test` / `password123`) + sample quiz data |
| root     | `npm run docker:up` | `docker compose up -d --build` — the **one command** that builds and starts the whole stack: MySQL (3307), backend (8001), frontend (5173), phpMyAdmin (8081) |
| root     | `npm run docker:down` | Stops and removes all four containers |
| root     | `npm run docker:logs` | Tails logs from every container |

Both dev servers must be running (plus the DB container) to exercise anything
behind `ProtectedRoute` — the frontend calls the backend at
`VITE_API_BASE_URL` (defaults to `http://localhost:8001`). Either run
`frontend`/`backend` natively with `npm run dev` (plus `backend`'s
`npm run db:up` for just the DB), or skip all of that and run
`npm run docker:up` from the repo root to get everything in containers with
one command — both `backend` and `frontend` bind-mount their package
directory into the container for hot reload, so editing source on the host
still triggers `tsx watch` / Vite HMR inside the container.

## 2. Frontend architecture (`frontend/src/`)

```
assets/           images, fonts, logo — imported directly, never referenced by string path
components/
  auth/           ProtectedRoute, BrandIcons — cross-cutting auth UI
  dashboard/      Sidebar + one file per dashboard card (StatSummaryCards, StudyProgressCard, ...)
  landing/        marketing page sections (HeroSection, WhyKabisSection, ...) + Navbar/Logo
  mock-exams/     Mock Exams page sections
  quiz/           the exam-taking flow (Quiz, QuizResults, QuestionNavigator, popovers, charts)
  ui/             shadcn/ui primitives (button, card, chart, input) — generated, keep thin
context/          React context providers (AuthContext)
data/             static/seed data + localStorage-backed read helpers live in lib/, not here
lib/              framework-agnostic helpers: utils.ts (cn, shuffleArray), motion.ts (shared
                  framer-motion variants), quizShuffle.ts, examHistory.ts, streak.ts, score.ts, time.ts
pages/            one file per route, composes components/ — pages own layout, not markup detail
types/            shared TS interfaces (quiz.ts, etc.)
```

**Rules:**
- Import via the `@/*` path alias (`@/components/...`, `@/lib/...`), never deep
  relative paths (`../../../`).
- New components go in the `components/<domain>/` folder matching what they
  belong to. Only put something in `components/ui/` if it's a generic,
  content-agnostic primitive (that folder is treated as shadcn-generated —
  keep it thin and unopinionated).
- A page file (`pages/*.tsx`) wires components + data together; it should not
  contain large inline JSX blocks that could be their own component.
- Shared, reusable UI logic (animation variants, formatting, shuffling) goes in
  `lib/`, typed, with no React import unless it's a hook.
- Follow existing naming: PascalCase for components/files exporting a
  component, camelCase for utility modules.

### Design tokens (don't invent new ones without reason)

- Palette: cream `#FBF3EA`/`#F3ECDC` background, dark brown `#3A2A1A` text, maroon
  `#7A2323` primary accent, dark green `#3A5A40` secondary accent, gold
  `#E0AC48` tertiary accent. Reuse these hex values — the app has no
  `tailwind.config.js` (Tailwind v4 is configured CSS-first in
  `src/index.css` via `@theme inline`), so arbitrary-value classes
  (`bg-[#7A2323]`) are the established pattern for brand colors.
- Fonts: `font-display` (Cubao Free Wide) for blocky uppercase taglines only,
  `font-serif` for normal-case bold headings, `font-reading` (Montserrat) for
  body copy meant to be read, `font-baybayin` for the decorative "pasa" glyph.
  Don't reach for `font-display` for ordinary headings — it's reserved.
- Motion: reuse the shared variants in `lib/motion.ts`
  (`staggerContainer`/`fadeUpItem` for mount animations, `listStagger`/`listItem`
  for dense lists) instead of hand-rolling new `initial`/`animate` objects.
  Use `whileInView` only for scroll-reveal sections on long pages (landing
  page); use plain `initial`/`animate` for anything that should animate
  immediately on mount (app pages, modals, auth forms).
- shadcn/ui: `new-york` style, `lucide-react` icons, no prefix. Add new
  primitives via `npx shadcn add <name>` rather than hand-writing them.

## 3. Backend architecture (`backend/src/`)

```
db/         pool.ts (mysql2 pool, env-driven), schema.sql (source of truth for tables)
middleware/ asyncHandler.ts (wraps async route handlers), auth.ts (signToken, requireAuth)
routes/     one router per resource (auth.ts, quizSets.ts), mounted in index.ts
scripts/    one-off scripts run via `tsx` (seed.ts)
index.ts    app wiring: middleware, route mounting, error handler, listen
```

**Rules:**
- One `Router()` per resource in `routes/`; mount it in `index.ts` with
  `app.use('/api/<resource>', [requireAuth,] resourceRouter)`. Put the auth
  guard on the mount line, not scattered per-route, unless a router mixes
  public and protected endpoints (like `auth.ts` does with `/login` vs `/me`).
- Every async route handler goes through `asyncHandler` so thrown errors reach
  the central error middleware instead of hanging the request.
- Schema changes go in `schema.sql` (it's mounted as
  `docker-entrypoint-initdb.d/01-schema.sql`, so it only auto-applies to a
  **fresh** volume — for an existing dev DB, apply changes manually or via a
  migration, don't assume editing `schema.sql` alone updates a running
  container).

## 4. Responsiveness — the most important cross-cutting rule

**Every page must work at mobile (~375px), tablet (~768px), and desktop
(≥1024px) widths.** This app has genuinely shipped with real overflow bugs at
mobile width before — the patterns below are the actual fixes, not
theoretical advice. Follow them proactively for new UI rather than retrofitting.

- **Mobile-first, then override up.** Base classes target the smallest
  screen; add `sm:`/`lg:` to progressively enhance. Don't design desktop-first
  and hope small screens "just wrap."
- **The CSS grid/flex `min-width: auto` trap is real.** A grid or flex child
  containing something wide (a table, a fixed-column button grid) will refuse
  to shrink below that content's min-content size by default — the overflow
  silently blows out every ancestor up to the page, causing full-page
  horizontal scroll instead of a contained scrollbar. Fix: add `min-w-0` to
  the grid/flex item that contains the wide content, and give the grid/flex
  **container** column tracks `minmax(0, ...)` instead of a bare `1fr`
  (`grid-cols-[minmax(0,1fr)_20rem]`, not `grid-cols-[1fr_20rem]`). Pair this
  with `overflow-x-auto` on the actual wide element (tables especially) so it
  scrolls internally instead of pushing the layout wider.
- **Cap unbounded repeating grids.** Anything that renders N items in a fixed
  column grid (e.g. a question-navigator button grid) must have a
  `max-h-*` + `overflow-y-auto` cap — don't let it grow forever with the data
  size, and don't let its height stretch a sibling grid item taller than it
  needs to be.
- **Fixed-width popovers/dropdowns must not assume they have room.** An
  `absolute`-positioned popover anchored `right-0` to a small trigger button
  can render entirely off-screen on a narrow viewport if the button sits near
  the left edge. Pattern used here: `fixed inset-x-4 bottom-4` (or similar
  viewport-anchored positioning) below `sm:`, reverting to the normal
  `sm:absolute sm:top-full sm:right-0` anchored-to-button behavior at `sm:`
  and up, where there's actually room.
- **Headers/toolbars with many controls need `flex-wrap` + `gap-x/gap-y`,**
  not a fixed row that clips.
- **Shrink, don't just scroll, when you can.** Prefer responsive sizing
  (`size-8 sm:size-9`, `gap-1.5 sm:gap-2`) so content actually fits at small
  widths, and reserve internal scroll containers for content that's
  genuinely too information-dense to shrink (a wide comparison table), not as
  a first resort for everything.
- **Verify with real measurements, not just a screenshot.** The reliable check
  is `document.documentElement.scrollWidth === document.documentElement.clientWidth`
  at each target width (no horizontal overflow) — a screenshot can look fine
  while the page is still technically overflowing off-canvas. When testing
  full-page animations, remember Playwright's `--full-page` screenshot mode
  does not actually scroll the page first, so `whileInView` content below the
  fold will render in its pre-animation state in that capture — use a tall
  viewport (no scroll needed) or a real scroll step instead when verifying
  scroll-triggered animations.

## 5. Security — frontend/client

- **No secrets in client code.** Only `VITE_`-prefixed env vars are exposed to
  the browser bundle (currently just `VITE_API_BASE_URL`) — never put an API
  key, JWT secret, or DB credential behind a `VITE_` prefix or hardcode one in
  source.
- **Auth token:** stored in `localStorage` under `cpa-reviewer:token`
  (`api/client.ts`), attached as `Authorization: Bearer <token>` via an axios
  request interceptor. This is convenient but XSS-vulnerable in principle
  (any injected script can read `localStorage`) — if this app ever renders
  untrusted user-generated HTML, migrating the token to an httpOnly cookie
  should be reconsidered. Until then: never introduce
  `dangerouslySetInnerHTML` (or a Markdown renderer) fed with un-sanitized
  user input, since that's exactly the vector that would make the current
  storage choice exploitable.
- **`ProtectedRoute` is the only gate on client routes.** Any new authenticated
  page must be wrapped in it in `App.tsx`. It's a UX gate, not a security
  boundary by itself — the real enforcement is server-side (`requireAuth`);
  never assume hiding a route client-side is sufficient protection for
  sensitive data.
- **Validate on the client for UX, never trust it for security.** Client-side
  checks (password length, matching confirm-password, required fields) exist
  to give immediate feedback — the backend re-validates everything
  independently and is the actual source of truth.
- **Don't log tokens, passwords, or full API error bodies to the console** in
  code that ships (fine in throwaway debug scripts, not in committed code).

## 6. Security — backend/server

- **Passwords:** always hashed with `bcryptjs` (cost factor 10, see
  `routes/auth.ts`) — never store or log a plaintext password, and never
  compare passwords with `===` instead of `bcrypt.compare`.
- **SQL:** always parameterized via `mysql2` placeholders
  (`pool.query('... WHERE email = ?', [email])`). Never string-concatenate or
  template-literal user input into a SQL string.
- **JWT secret:** comes from `process.env.JWT_SECRET`, with a dev-only
  fallback string in `middleware/auth.ts`. That fallback must never be relied
  on outside local dev — production deployment must set a real `JWT_SECRET`.
  Tokens expire after 7 days (`signToken`); don't silently extend that without
  reconsidering the session-length tradeoff.
- **Route protection:** apply `requireAuth` at the router-mount level in
  `index.ts` for anything that isn't explicitly meant to be public. When
  adding a new resource router, default to protected and only skip
  `requireAuth` for routes that are genuinely public (registration, login,
  health check).
- **Never return sensitive columns.** Query only the columns you need
  (`SELECT id, name, email FROM users ...`, never `SELECT *` into an API
  response) — `password_hash` must never leave the server.
- **Error responses stay generic.** The central error handler in `index.ts`
  logs the real error server-side (`console.error`) but returns a flat
  `{ error: 'Internal server error' }` to the client — don't leak stack
  traces, SQL errors, or internal file paths in a response body. Route-level
  validation errors should return a short, specific, non-sensitive message
  (see the 400/401/409 responses in `routes/auth.ts` as the pattern).
- **CORS is currently wide open** (`app.use(cors())` with no origin
  allowlist) — acceptable for local dev, but flag this before any real
  deployment; it should be restricted to the actual frontend origin(s).
- **No rate limiting / brute-force protection yet** on `/api/auth/login` or
  `/register` — worth adding (e.g. a per-IP attempt limiter) before this ever
  faces the public internet; don't treat its current absence as "fine as-is"
  for production.
- **`.env` files are never committed** — `.env.example` documents required
  vars with placeholder values; real secrets only ever live in the untracked
  `.env`.

## 7. Code style

- TypeScript strict-ish config: `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch` are on — don't leave unused imports/params, and
  don't suppress these instead of fixing the actual issue.
- Function components with a typed `Props` interface
  (`interface FooProps { ... }`), not inline prop types, once there's more
  than one or two props.
- Comments explain *why*, not *what* — the code + good naming should carry
  the "what." Don't add a comment restating the line beneath it.
- No new abstractions/helpers for a single call site — three similar inline
  blocks beat a premature shared component, per this project's established
  style.
- Lint with `oxlint` (not eslint — there is no eslint config in this repo).

## 8. Before calling anything done

- `npx tsc -b --noEmit` and `npx oxlint` clean in the package(s) you touched.
- For UI changes: actually run the dev server(s) and drive the feature in a
  real (even if headless/automated) browser — click through it, don't just
  read the JSX and assume it renders correctly. Check both a mobile width
  (~375px) and a desktop width (~1440px) per §4.
- For anything touching auth or the database: test against the real backend +
  MySQL container, not just the UI in isolation — a login/signup/protected-route
  change is only verified once you've confirmed the actual request round-trip
  (including the failure cases: wrong password, duplicate email, missing
  token) still behaves correctly.
- Clean up anything you spun up for verification only (stray dev server
  processes, throwaway test scripts, test DB rows) before finishing.
