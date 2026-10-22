# Internal Task Portal

A small internal portal where employees register, log in and manage **their own** tasks. Built as a
single Next.js app: pages and JSON API routes live together, backed by Postgres (Neon) through
Prisma.

**Features**

- Register, log in, log out (custom session auth, httpOnly cookie)
- Task list with create / edit (dialog), delete (confirm), inline status change, empty state
- Each task has title, description, status (To do / In progress / Done), priority, due date; overdue tasks are highlighted
- Users only ever see and change their own tasks — enforced on the server, not just hidden in the UI
- Loading skeleton, error boundary with retry, toasts for every mutation

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Neon Postgres + Prisma 7
(`@prisma/adapter-neon`) · `bcryptjs` + `jose` (HS256 JWT) · Zod 4 · Tailwind CSS v4 + shadcn/ui
(Base UI) · react-hook-form · sonner · Vitest

## Setup & run

**Prerequisites:** Node.js 20.19+, 22.12+ or 24+ (see `engines` in `package.json`), and a Postgres
database — a free [Neon](https://neon.tech) project is easiest, but any Postgres URL works.

```bash
cp .env.example .env          # then fill in the three values below
npm install                   # also runs `prisma generate`
npx prisma migrate deploy     # create tables (use `migrate dev` while changing the schema)
npx prisma db seed            # demo users + sample tasks
npm run dev                   # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Pooled connection string — used by the app |
| `DATABASE_URL_UNPOOLED` | Direct connection string — used by the Prisma CLI (migrate, seed, studio). Outside Neon, use the same URL twice |
| `SESSION_SECRET` | ≥ 32 chars, signs session JWTs. Generate with `openssl rand -base64 32`. The app refuses to start without it |

**Demo logins** (from the seed): `demo@portal.dev` (has 4 tasks) and `admin@portal.dev`, both with
password `Password123!`.

| Script | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run test` | Vitest unit tests (`npm run test:watch` to watch) |

**Deploying to Vercel:** import the repo, set the three env vars in the project settings, and
deploy — `postinstall` generates the Prisma client during the build. Run
`npx prisma migrate deploy` (and optionally `db seed`) against the production database once, from
your machine or a CI step, before the first request.

## Project structure

```
app/
  (auth)/login, register      guest-only pages (layout redirects logged-in users)
  (portal)/tasks              the task page + loading.tsx / error.tsx
  api/auth/*, api/tasks/*     JSON route handlers
components/
  auth/, tasks/               feature components (client components only where needed)
  ui/                         shadcn/ui primitives (generated)
lib/
  auth/                       password hashing, session (JWT + cookie), DAL (session checks)
  validation/                 Zod schemas shared by forms and API
  db.ts, http.ts              Prisma singleton; JSON responses, ApiError, origin check
  api-client.ts               browser fetch wrapper that turns error JSON into ApiRequestError
server/{auth,tasks}/          services: all business logic and Prisma queries
prisma/                       schema, migrations, seed
proxy.ts                      UX-only redirects (formerly middleware.ts)
```

## Architecture

```
Route handler → session check → Zod validation → service → Prisma
```

- **Route handlers stay thin**: `assertSameOrigin` (mutations) → `requireApiSession()` → parse the
  body with a Zod schema → call a service. Errors are thrown as `ApiError` / `ZodError` and mapped
  in one place (`handleRouteError`) to `{ error: { code, message, details? } }` with
  400 / 401 / 403 / 404 / 409 / 422 / 500. Unknown errors are logged, never leaked.
- **Services own the data access** (`server/*`). No Prisma in components or handlers. Task services
  take `userId` as their first argument, so ownership can't be forgotten at the call site.
- **Reads** happen in Server Components, which call `verifySession()` and the service directly — no
  extra HTTP hop. **Writes** come from client components via `fetch('/api/...')`, followed by
  `router.refresh()` and a toast. The status select uses `useOptimistic` and rolls back on failure.
- Services return a `TaskDTO` with ISO-string dates, so Server Components and the JSON API give the
  client the same shape.

## Security

- **Passwords**: bcrypt, cost 12. Policy: 8–72 chars, at least one letter and one number (72 is
  bcrypt's input limit).
- **Session**: HS256 JWT holding only `userId` and `role`, in a `session` cookie that is
  `httpOnly`, `SameSite=Lax`, `Secure` in production, 7-day expiry. Algorithm is pinned on verify;
  tampered, expired or malformed tokens are treated as logged-out.
- **Defense in depth**: `proxy.ts` only redirects for UX. The real checks are `verifySession()` in
  every protected page/layout (redirects to `/login`) and `requireApiSession()` in every API
  handler (401 JSON).
- **Ownership**: every task query is scoped by `createdById: userId` — reads use `findFirst`,
  writes use `updateManyAndReturn` / `deleteMany` with the owner in the `where`, so there is no
  check-then-act gap. Another user's task returns **404**, the same as a missing one, so ids can't
  be probed. Request schemas are strict objects: clients can't set `createdById`, `assigneeId` or
  any unknown field.
- **CSRF**: on top of `SameSite=Lax`, every mutating route requires an `Origin` header matching
  the host (`x-forwarded-host` behind a proxy), otherwise **403**.
- **No user enumeration**: login returns the same 401 "Invalid email or password" for an unknown
  email or a wrong password, and compares against a dummy bcrypt hash when the email is unknown so
  both paths take the same time. (Registration does reveal a taken email with a 409 — a deliberate
  UX trade-off for an internal tool.)
- **No secrets to the client**: `passwordHash` is never selected (explicit Prisma `select` objects);
  task responses omit owner/assignee ids. `lib/db.ts`, `lib/auth/*`, `lib/http.ts` and `server/*`
  import `server-only`, so they can't end up in a client bundle.
- **Fail fast**: the app throws at startup if `SESSION_SECRET` is missing or shorter than 32 chars.

## Key decisions & trade-offs

- **Custom auth instead of Auth.js / better-auth.** The scope is email + password only, and doing
  it by hand keeps every security property visible and unit-tested in a few small files. With OAuth, MFA or
  password reset on the roadmap I would switch to a library.
- **Stateless JWT sessions.** No DB lookup per request, but a token can't be revoked before it
  expires (7 days): logout only deletes the cookie, and changing a user's role isn't reflected
  until they log in again. The fix is a `Session` table (id, userId, expiresAt, revokedAt) with
  the session id in the JWT, checked in `getSession()` — needed before Part 2's admin features.
- **Neon + Prisma 7 driver adapter.** Neon's serverless driver suits Vercel's short-lived functions;
  the pooled URL serves the app and the direct URL serves migrations. Prisma 7's `prisma-client`
  generator writes the client into `generated/` (gitignored, regenerated on install).
- **API routes rather than Server Actions** for mutations, as the brief asks for API operations.
  This also gives a reusable JSON API with explicit status codes. Server Actions would cut some
  boilerplate (`api-client.ts`, the origin check) and are a reasonable alternative.
- **One set of Zod schemas** (`lib/validation/*`) used by react-hook-form on the client and by the
  route handlers on the server, so the rules can't drift. The server is still the authority.
- **Enums for status and priority** (Postgres enums, mirrored in Zod from the generated Prisma
  enums, with a test that they stay in sync). The list sorts open work first, then by due date.
- **Due dates are calendar dates** stored as UTC midnight and formatted in UTC, so server and
  client render the same day and there are no hydration mismatches.
- **Prepared for Part 2, unused in Part 1**: `User.role` (seeded `ADMIN`) and `Task.assigneeId`
  exist in the schema and the role is in the JWT, but no Part 1 UI or API uses them.
- **Not done, on purpose**: no pagination (a personal task list is small; I'd add cursor
  pagination on `(status, dueDate, createdAt)` when needed), no rate limiting on login/register (in
  production I'd add e.g. Upstash Ratelimit by IP + email), no filters or task details page (Part 2).

## Testing

```bash
npm run test
```

Unit tests (Vitest) sit next to the code as `*.test.ts`:

- `lib/validation/*` — auth and task schemas (trimming, limits, dates, strict keys, enum sync)
- `lib/auth/*` — bcrypt cost, JWT round-trip, only `userId`/`role` in the token, tampered /
  expired / wrong-secret tokens rejected
- `lib/http.ts` — error mapping, bad JSON, same-origin check
- `server/*` — auth and task services with Prisma mocked: owner scoping on every query, 404 for
  not-owned, generic login error, no `passwordHash` in results
- `components/tasks/task-meta.ts` — date formatting and overdue logic

Trade-off: Prisma is mocked, so there are no integration tests against a real database and no
end-to-end browser tests yet. Next step would be Playwright for the main flow (register → create →
edit → status → delete → logout) against a throwaway Neon branch in CI.

## Part 2

The process flow map and sprint plan (filters, task details page, evidence upload, admin
approval) are in [`Task_2.pdf`](./Task_2.pdf) — _to be added_.
