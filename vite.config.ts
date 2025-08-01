import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePluginForArco } from '@arco-plugins/vite-react'
import eslint from 'vite-plugin-eslint2'
import path from 'path'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async() => ({
  envDir: path.resolve(__dirname, './env'),
  envPrefix: ['VITE_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    vitePluginForArco(),
    eslint({
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
      cache: false, // 禁用缓存以确保实时检查
      fix: false, // 开发时不自动修复，避免意外修改
      emitWarning: true, // 在终端显示警告
      emitError: true, // 在终端显示错误
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}))
