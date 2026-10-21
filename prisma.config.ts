import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Direct (unpooled) Neon URL for the Prisma CLI (migrate, studio, seed).
    // Read without `env()` so `prisma generate` (postinstall) works before `.env` exists.
    url: process.env.DATABASE_URL_UNPOOLED ?? '',
  },
})
