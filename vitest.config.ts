import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'playground',
          environment: 'node',
          include: ['tests/playground/{config,src}/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['tests/server/**/*.test.ts'],
        },
      },
      {
        esbuild: { jsx: 'automatic' },
        optimizeDeps: { include: ['react/jsx-dev-runtime', 'vitest-browser-react'] },
        test: {
          name: 'admin',
          include: ['tests/admin/**/*.test.{ts,tsx}'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/src/**/*.ts', 'admin/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts'],
    },
  },
})
