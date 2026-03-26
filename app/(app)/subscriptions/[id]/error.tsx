"use client"

// Route: /subscriptions/[id] — 에러 바운더리
// Next.js App Router 요구사항: error.tsx는 반드시 "use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

interface SubscriptionDetailErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SubscriptionDetailError({ error, reset }: SubscriptionDetailErrorProps) {
  // 에러를 콘솔에 기록 — 서버 로그와 연계하기 위해 digest 함께 출력
  useEffect(() => {
    console.error("[SubscriptionDetail Error]", error)
  }, [error])

  return (
    // 모바일 중앙 정렬 레이아웃 — 앱 전체 max-w-md 컨테이너와 통일
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">구독 정보를 불러오지 못했습니다</h2>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요.
          {error.digest && (
            <span className="mt-1 block text-xs text-muted-foreground/60">
              오류 코드: {error.digest}
            </span>
          )}
        </p>
      </div>
      {/* reset: Next.js가 제공하는 에러 경계 재시도 함수 */}
      <Button variant="outline" onClick={reset}>
        다시 시도
      </Button>
    </div>
  )
}
