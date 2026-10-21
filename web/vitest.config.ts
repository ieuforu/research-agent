import { defineConfig } from 'vitest/config'

const nodeMajor = Number(process.versions.node.split('.')[0])

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    execArgv: nodeMajor >= 25 ? ['--no-webstorage'] : [],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/routeTree.gen.ts'],
    },
  },
})
