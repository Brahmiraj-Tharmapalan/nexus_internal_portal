# Internal Task Portal

A Next.js app where users register, log in and manage their own tasks (create, edit, delete,
change status). Pages and JSON API routes live in one app, backed by Postgres (Neon) via Prisma.

**Stack:** Next.js 16 · React 19 · TypeScript · Prisma 7 + Neon Postgres · Zod · Tailwind CSS v4 +
shadcn/ui · Vitest

## Prerequisites

- Node.js 20.19+, 22.12+ or 24+
- A Postgres database (a free [Neon](https://neon.tech) project is easiest; any Postgres URL works)

## Setup

```bash
git clone https://github.com/Brahmiraj-Tharmapalan/nexus_internal_portal.git
cd nexus_internal_portal
cp .env.example .env          # fill in the values below
npm install                   # also generates the Prisma client
npx prisma migrate deploy     # create the tables
npx prisma db seed            # demo users + sample tasks
npm run dev                   # http://localhost:3000
```

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooled connection string (used by the app) |
| `DATABASE_URL_UNPOOLED` | Direct connection string (used by Prisma CLI). Outside Neon, use the same URL as above |
| `SESSION_SECRET` | At least 32 characters: `openssl rand -base64 32` |


## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run it |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (Vitest) |

Deployed link - https://nexus-internal-portal.vercel.app