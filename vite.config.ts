import { HttpProxy, ProxyOptions, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { ClientRequest, IncomingMessage, ServerResponse } from 'http'
import svgr from 'vite-plugin-svgr'
import dotenv from 'dotenv'

dotenv.config()

function proxyDebug(proxy: HttpProxy.Server, _options: ProxyOptions) {
  proxy.on(
    'error',
    (err: Error, _req: IncomingMessage, _res: ServerResponse<IncomingMessage>, _target?: HttpProxy.ProxyTargetUrl) => {
      console.log('proxy error', err)
    }
  )
  proxy.on('proxyReq', (proxyReq: ClientRequest, req: IncomingMessage, _res: ServerResponse<IncomingMessage>) => {
    console.log(
      '[Request]:',
      req.method,
      req.url,
      ' => ',
      `${proxyReq.method} ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`
    )
  })
  proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage, _res: ServerResponse<IncomingMessage>) => {
    console.log('[Response]:', proxyRes.statusCode, req.url)
  })
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.CDN_ASSETS_PATH ? `https://s.codatta.io/${process.env.CDN_ASSETS_PATH}` : undefined,
  assetsInclude: ['**/*.md'],
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5175,
    host: '0.0.0.0',
    proxy: {
      '^/api': {
        // target: 'https://app-test.b18a.io/',
        target: 'https://app.codatta.io/',
        changeOrigin: true,
        configure: proxyDebug
      }
    }
  }
})
