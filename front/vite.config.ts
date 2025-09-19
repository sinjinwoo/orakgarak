import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-phaser',
      buildStart() {
        // Phaser 파일을 public으로 복사
        try {
          mkdirSync('public/assets/js', { recursive: true })
          copyFileSync(
            'node_modules/phaser/build/phaser.min.js',
            'public/assets/js/phaser.min.js'
          )
        } catch (error) {
          console.warn('Phaser 복사 실패:', error)
        }
      }
    },
    {
      name: 'copy-game-assets',
      buildStart() {
        // 게임 에셋들을 public으로 복사
        try {
          mkdirSync('public/assets/images', { recursive: true })
          // 이미 복사된 파일들이 있으므로 건너뜀
          console.log('게임 에셋 파일들이 이미 복사되어 있습니다.')
        } catch (error) {
          console.warn('게임 에셋 복사 실패:', error)
        }
      }
    }
  ],
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://https://j13c103.p.ssafy.io:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material']
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'node-fetch': 'isomorphic-fetch'
    }
  }
})
