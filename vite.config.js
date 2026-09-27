import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { apiMiddleware } from './server/apiMiddleware.js'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'afterlife-backend-api',
      configureServer(server) {
        server.middlewares.use(apiMiddleware);
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})

