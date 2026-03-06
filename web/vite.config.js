import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드 시점에 Vercel/로컬 환경변수 사용 (loadEnv 제거로 배포 빌드 안정화)
const kakaoKey = typeof process !== 'undefined' && process.env && process.env.VITE_KAKAO_MAP_API_KEY
  ? String(process.env.VITE_KAKAO_MAP_API_KEY).trim()
  : ''

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-kakao-script',
      transformIndexHtml(html) {
        try {
          const scriptTag = kakaoKey
            ? `<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoKey)}&libraries=services,clusterer&autoload=false" defer></script>`
            : ''
          return html.replace('<!-- KAKAO_MAP_SCRIPT -->', scriptTag)
        } catch (_) {
          return html.replace('<!-- KAKAO_MAP_SCRIPT -->', '')
        }
      },
    },
  ],
  publicDir: 'public',
  // GitHub Pages: 서브경로 배포 시 필수 (CI에서 VITE_BASE_URL 주입). 로컬/Vercel은 기본 '/'
  base: process.env.VITE_BASE_URL || '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false
  }
})





