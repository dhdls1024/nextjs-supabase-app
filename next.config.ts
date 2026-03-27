import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 컴포넌트 캐싱으로 서버 렌더링 성능 향상
  cacheComponents: true,

  // 번들 크기 분석 시 사용 (ANALYZE=true npm run build)
  // 모바일 성능 최적화를 위해 lucide-react 트리쉐이킹 명시적 활성화
  // Next.js 15는 기본으로 SWC를 사용하여 자동 트리쉐이킹 지원
  // 단, 명시적으로 패키지를 transpile 목록에 추가하면 번들 최적화 향상
  transpilePackages: ["lucide-react"],

  images: {
    // 외부 이미지를 WebP/AVIF로 자동 변환 — 모바일 대역폭 절약
    formats: ["image/avif", "image/webp"],
    // 디바이스 너비 최적화 — max-w-md(448px) 기반 모바일 앱에 맞게 설정
    deviceSizes: [375, 430, 448, 768, 1024],
    // 이미지 캐시 TTL — CDN에서 오래 캐시되도록 설정 (60일)
    minimumCacheTTL: 60 * 60 * 24 * 60,
    remotePatterns: [
      {
        // Google Favicon API — 서비스 로고 표시에 사용
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        // logo_url은 사용자 입력값이라 임의 도메인 허용
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

export default nextConfig
