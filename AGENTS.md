# AGENTS.md — Internal Task Portal

Next.js app (frontend + API routes). Users register, log in/out and manage **their own** tasks:
list, create, edit, delete, change status.

## Tech stack
- Next.js 16 (App Router, Turbopack, no `src/`, Cache Components off), React 19, TypeScript strict
- Neon Postgres + Prisma 7 (`prisma-client` generator, `@prisma/adapter-neon`, `prisma.config.ts`)
- Custom auth: `bcryptjs` + `jose` (HS256 JWT) in an httpOnly cookie
- Zod 4 (shared by forms and API)
- Tailwind CSS v4 (via `@tailwindcss/turbopack` loader in `next.config.ts`, no PostCSS config),
  shadcn/ui (base-ui, `base-nova` style), react-hook-form, sonner, lucide-react
- Vitest · Vercel

## Pages
| Route | Access | Content |
|---|---|---|
| `/` | all | Redirect to `/tasks` or `/login` |
| `/login` | guests only | Email + password form |
| `/register` | guests only | Name, email, password, confirm password |
| `/tasks` | logged in | Header (user name, logout), task list, status select, create/edit dialog, delete confirm, empty state |

## API
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create user + session |
| POST | `/api/auth/login` | Verify credentials + session |
| POST | `/api/auth/logout` | Delete session |
| GET | `/api/auth/me` | Current user |
| GET, POST | `/api/tasks` | List / create own tasks |
| GET, PATCH, DELETE | `/api/tasks/[id]` | Read / edit / delete own task |
| PATCH | `/api/tasks/[id]/status` | Change status |

## Structure
```
app/(auth)/, app/(portal)/, app/api/   routes
components/ui/                         shadcn (don't hand-edit)
components/{auth,tasks}/               feature components
lib/db.ts                              Prisma singleton
lib/auth/{password,session,dal}.ts     hashing, cookie/JWT, session checks
lib/validation/{auth,task}.ts          Zod schemas
lib/http.ts                            JSON responses, ApiError, error mapping, origin check
test/stubs/                            test-only stubs (e.g. `server-only`), vitest.config.mts
server/tasks/task.service.ts           business logic
generated/prisma/                      Prisma client (gitignored)
prisma/schema.prisma, prisma/seed.ts
proxy.ts
.env.example                           env template (committed)
docs/                                  Part 2 sources (flow map, sprint plan)
Task_2.pdf                             Part 2 deliverable (repo root)
```

## Data model
- `User`: id (cuid), name, email (unique, lowercased), passwordHash, role `USER|ADMIN` (default USER), createdAt, updatedAt
- `Task`: id, title (1–120), description? (≤2000), status `TODO|IN_PROGRESS|DONE` (default TODO),
  priority `LOW|MEDIUM|HIGH` (default MEDIUM), dueDate?, createdById (cascade delete), assigneeId?, createdAt, updatedAt
- Password: min 8 chars, at least one letter and one number
- Seed users: `demo@portal.dev` (USER), `admin@portal.dev` (ADMIN), password `Password123!`

## Rules
1. Request flow: route handler → session check → Zod validation → service → Prisma. No Prisma in components or handlers.
2. Every task query is scoped by `createdById: userId`. Not found or not owned → **404**.
3. Never return `passwordHash`; use Prisma `select`.
4. `import 'server-only'` in `lib/db.ts`, `lib/auth/*`, `server/*`.
5. Pages use `verifySession()` (redirects to `/login`). API routes use `requireApiSession()` (returns 401 JSON).
6. `proxy.ts` only redirects for UX; it is never the security check.
7. Cookie `session`: httpOnly, secure in production, sameSite lax, path `/`, 7 days. JWT holds only `userId` and `role`.
8. Login returns the same 401 "Invalid email or password" for unknown email or wrong password. Hash with bcrypt cost 12.
9. Error shape: `{ error: { code, message, details? } }`. Use 400/401/403/404/409/422/500
   (400 bad JSON, 403 cross-origin, 409 unique violation, 422 Zod). Handlers throw `ApiError` and
   return `handleRouteError(err)` from `catch`; `requireApiSession()` throws a 401 `ApiError`.
10. Server Components read via services. Client components mutate via `fetch('/api/...')`, then `router.refresh()` + toast.
11. Next 16: `params` and `cookies()` are async.
12. Prisma 7: import from `@/generated/prisma/client`; `prisma.config.ts` loads `dotenv/config`,
    uses `DATABASE_URL_UNPOOLED`, and sets `migrations.seed = "tsx prisma/seed.ts"`.
13. Mutating API routes call `assertSameOrigin(request)`: missing or mismatched `Origin` (vs
    `x-forwarded-host`/`Host`) → **403** `FORBIDDEN`.
14. Throw at startup if `SESSION_SECRET` is missing.
15. Keep components small; no `any`; handle loading, empty and error states.
16. Unit tests sit next to the code as `*.test.ts` (schemas, session, task service).

## Environment
```
DATABASE_URL=            # Neon pooled URL (app)
DATABASE_URL_UNPOOLED=   # Neon direct URL (Prisma CLI)
SESSION_SECRET=          # openssl rand -base64 32
```

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run test`
`npx prisma migrate dev` · `npx prisma db seed` · `npx prisma studio`

## Out of scope
Filters, task details page, file uploads, admin UI, email verification, password reset, OAuth.