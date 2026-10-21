import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        /*
          如果和后端路径不一致，则用下面的
          等价于 /api/users  →  http://localhost:3000/users
        */
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 10000,
          groups: [
            {
              name: 'vendor-react-dom',
              test: /node_modules[/]react-dom/,
              priority: 40,
            },
            {
              name: 'vendor-react',
              test: /node_modules[/]react(?!-dom)/,
              priority: 35,
            },
            {
              name: 'vendor-router',
              test: /node_modules[/]@tanstack[/]react-router/,
              priority: 30,
            },
            {
              name: 'vendor-query',
              test: /node_modules[/]@tanstack[/]react-query/,
              priority: 25,
            },
            {
              name: 'vendor-tanstack',
              test: /node_modules[/]@tanstack/,
              priority: 22,
            },
            {
              name: 'vendor-ui',
              test: /node_modules[/]@base-ui/,
              priority: 20,
            },
            {
              name: 'vendor-state',
              test: /node_modules[/]jotai/,
              priority: 18,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
