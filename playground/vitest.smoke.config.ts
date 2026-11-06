import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  test: {
    name: 'playground-smoke',
    environment: 'node',
    // Strapi removes process listeners on shutdown, including fork workers' IPC handlers.
    pool: 'threads',
    include: ['tests/playground/smoke.test.ts'],
    testTimeout: 120_000,
  },
})
