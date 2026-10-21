import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      // 'server-only' throws outside a React Server bundle; stub it in tests.
      { find: /^server-only$/, replacement: `${root}test/stubs/server-only.ts` },
    ],
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'generated/**'],
    env: {
      SESSION_SECRET: 'test-secret-at-least-32-characters-long!!',
    },
  },
})
