import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    proxy: {
      // 老设备只读页 /lite 由 Go 后端直出 HTML。
      // 本地联调时经 dev server 转发一次，好处是 Kindle 只需访问前端端口：
      
      // 生产环境不用这段 —— 由 nginx 把 /lite/ 反代到后端（注意排除 SPA 的
      // try_files 回退，否则刷新 /lite/articles/1 会被打回 index.html）。
      '/lite': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      // 上传图片：public_base_url 留空时后端返回相对路径 /static/uploads/…，
      // 需要一并转发，否则本地看不到正文图。
      '/static': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
