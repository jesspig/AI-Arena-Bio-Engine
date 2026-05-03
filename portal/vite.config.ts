import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORTAL_ROOT = path.resolve(__dirname)
const PUBLIC_ROOT = path.join(PORTAL_ROOT, 'public')
const MODEL_PATHS = ['kimi-k2.6', 'glm-5.1', 'deepseek-v4', 'mimo-v2.5-pro']

function serveSubProjects() {
  return {
    name: 'serve-sub-projects',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        for (const modelId of MODEL_PATHS) {
          if (url.startsWith(`/${modelId}/`) || url === `/${modelId}`) {
            let suffix = url.slice(`/${modelId}`.length)
            if (!suffix || suffix === '/') suffix = 'index.html'
            else if (suffix.startsWith('/')) suffix = suffix.slice(1)
            const publicPath = path.join(PUBLIC_ROOT, modelId, suffix)

            if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
              const ext = path.extname(publicPath)
              const mimeTypes: Record<string, string> = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.woff2': 'font/woff2',
              }
              res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream')
              fs.createReadStream(publicPath).pipe(res)
              return
            }
          }
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), serveSubProjects()],
  root: path.join(__dirname, 'src'),
  base: '/',
  build: {
    outDir: path.join(__dirname, 'public'),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: false
  }
})
