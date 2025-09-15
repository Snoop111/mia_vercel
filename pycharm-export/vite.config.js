import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@tokens': path.resolve(__dirname, './design-tokens'),
      '@assets': path.resolve(__dirname, './assets')
    }
  },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `@import "./components/shared/tokens.css";`
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tokens: ['./components/shared/tokens.css']
        }
      }
    }
  }
})
