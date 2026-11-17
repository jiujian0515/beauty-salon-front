import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: 'hidden',
    // antd 5 + rc-* 的基线体积即接近 600KB（≈190KB gzip），据此设定告警阈值
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // 与 BTD §4.6 分包约定一致；用函数形式只归组真实进入依赖图的模块，
        // 避免把整个包入口拉进 chunk 而破坏 tree-shaking
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (
            /node_modules\/(react|react-dom|react-router|scheduler)\//.test(id) ||
            id.includes('@remix-run/')
          ) {
            return 'react'
          }
          if (
            /node_modules\/(antd|@ant-design)\//.test(id) ||
            id.includes('node_modules/@ant-design/')
          ) {
            return 'antd'
          }
          if (id.includes('@tanstack/') || /node_modules\/zustand\//.test(id)) {
            return 'query'
          }
          if (/node_modules\/(dayjs)\//.test(id)) {
            return 'dayjs'
          }
          return undefined
        },
      },
    },
  },
})
