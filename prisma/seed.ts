import 'dotenv/config'

import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'
import {
  PrismaClient,
  Role,
  TaskPriority,
  TaskStatus,
} from '../generated/prisma/client'

// Own client: the app's `lib/db.ts` imports `server-only`, which can't run here.
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set')
}
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })

const PASSWORD = 'Password123!'
const BCRYPT_COST = 12

const DAY = 24 * 60 * 60 * 1000

const demoTasks = [
  {
    id: 'seed-task-1',
    title: 'Set up project repository',
    description: 'Create the repo, add CI and invite the team.',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    dueDate: new Date(Date.now() - 3 * DAY),
  },
  {
    id: 'seed-task-2',
    title: 'Write onboarding guide',
    description: 'Short guide for new joiners: tools, access, first week.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(Date.now() + 4 * DAY),
  },
  {
    id: 'seed-task-3',
    title: 'Review Q4 roadmap',
    description: null,
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: new Date(Date.now() + 10 * DAY),
  },
  {
    id: 'seed-task-4',
    title: 'Clean up old feature flags',
    description: 'Remove flags that have been fully rolled out.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: null,
  },
]

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST)

  const demo = await prisma.user.upsert({
    where: { email: 'demo@portal.dev' },
    update: { name: 'Demo User', passwordHash, role: Role.USER },
    create: { name: 'Demo User', email: 'demo@portal.dev', passwordHash, role: Role.USER },
    select: { id: true },
  })

  await prisma.user.upsert({
    where: { email: 'admin@portal.dev' },
    update: { name: 'Admin User', passwordHash, role: Role.ADMIN },
    create: { name: 'Admin User', email: 'admin@portal.dev', passwordHash, role: Role.ADMIN },
    select: { id: true },
  })

  // Fixed ids keep re-runs idempotent (no duplicate tasks).
  for (const { id, ...data } of demoTasks) {
    await prisma.task.upsert({
      where: { id },
      update: { ...data, createdById: demo.id },
      create: { id, ...data, createdById: demo.id },
    })
  }

  console.log(`Seeded 2 users and ${demoTasks.length} tasks for demo@portal.dev`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
