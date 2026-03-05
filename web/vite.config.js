import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const kakaoKey = env.VITE_KAKAO_MAP_API_KEY || ''
  return {
  plugins: [
    react(),
    {
      name: 'inject-kakao-script',
      transformIndexHtml(html) {
        const scriptTag = kakaoKey
          ? `<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services,clusterer&autoload=false" defer></script>`
          : ''
        return html.replace('<!-- KAKAO_MAP_SCRIPT -->', scriptTag)
      },
    },
  ],
  publicDir: 'public',
  // GitHub Pages 배포용 base 설정은 제거 (Vercel에서는 루트 사용)
  // base: '/livejourney.co.kr/',
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
  }
})





