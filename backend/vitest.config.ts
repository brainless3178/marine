import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/migrate-products.ts'],
      reporter: ['text'],
      thresholds: {
        statements: 50,
        branches: 60,
        functions: 45,
        lines: 50,
      },
    },
    // Increase test timeout for integration tests that hit the DB
    testTimeout: 30000,
  },
})
