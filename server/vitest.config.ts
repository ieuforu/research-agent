import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    // Every suite shares one Postgres database, so run files serially.
    fileParallelism: false,
    testTimeout: 15_000,
  },
})
