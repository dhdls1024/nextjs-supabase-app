import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
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
