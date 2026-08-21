import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function normalizeDevApiTarget(value) {
  const raw = String(value || '').trim() || 'http://127.0.0.1:5000'
  // Windows often resolves "localhost" to ::1 first; the backend binds IPv4.
  const withIpv4 = raw.replace('://localhost', '://127.0.0.1')
  try {
    return new URL(withIpv4).origin
  } catch {
    return withIpv4.replace(/\/api(\/health)?\/?$/i, '').replace(/\/+$/, '')
  }
}

const proxyFor = (apiTarget) => {
  let lastRefusedLog = 0
  const onError = (err, _req, res) => {
    const refused = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
    if (refused) {
      const now = Date.now()
      if (now - lastRefusedLog > 8000) {
        lastRefusedLog = now
        console.warn(`[vite] backend not running at ${apiTarget} — start npm run dev in backend/`)
      }
      if (res && typeof res.writeHead === 'function' && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, message: 'Backend is not running' }))
      }
      return
    }
    console.error('[vite] http proxy error:', err.message || err)
  }

  const entry = (timeout) => ({
    target: apiTarget,
    changeOrigin: true,
    timeout,
    configure: (proxy) => {
      proxy.on('error', onError)
    },
  })

  return {
    '/api': entry(30000),
    '/uploads': entry(30000),
    '/health': entry(10000),
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = normalizeDevApiTarget(env.VITE_DEV_API_TARGET)
  if (command === 'serve') {
    console.log(`Vite dev server proxying API requests to: ${apiTarget}`)
  }
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react-vendor', test: /[\\/]node_modules[\\/](?:react|react-dom|react-router|scheduler)[\\/]/ },
              { name: 'motion', test: /[\\/]node_modules[\\/](?:framer-motion|motion-dom|motion-utils)[\\/]/ },
              { name: 'icons', test: /[\\/]node_modules[\\/](?:lucide-react|react-icons)[\\/]/ },
              { name: 'swiper', test: /[\\/]node_modules[\\/]swiper[\\/]/ },
            ],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: proxyFor(apiTarget),
    },
    preview: {
      port: 4173,
      strictPort: true,
      proxy: proxyFor(apiTarget),
    },
  }
})
