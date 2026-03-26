"use client"
// PWA 설치 안내 배너 컴포넌트
// 모바일 브라우저에서 beforeinstallprompt 이벤트를 감지하여 설치 안내 팝업 표시
// iOS Safari는 beforeinstallprompt 미지원 → 별도 안내 메시지 표시

import { X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

// beforeinstallprompt 이벤트 타입 (브라우저 표준 미포함으로 직접 정의)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// iOS Safari 감지 — beforeinstallprompt 미지원
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// 모바일 환경 감지
function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

// PWA 이미 설치됨 감지 (standalone 모드로 실행 중인지 확인)
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // 이미 설치되어 있거나 모바일이 아니면 배너 미표시
    if (isStandalone() || !isMobile()) return

    // 이미 닫은 적 있으면 미표시 (sessionStorage 기준 — 세션마다 1회)
    if (sessionStorage.getItem("pwa-banner-dismissed")) return

    if (isIOS()) {
      // iOS Safari: beforeinstallprompt 미지원 → 수동 안내 표시
      setShowIOSGuide(true)
      return
    }

    // Android/Chrome: beforeinstallprompt 이벤트 대기
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // 배너 닫기 — sessionStorage에 기록하여 세션 내 재표시 방지
  function handleDismiss() {
    setShowBanner(false)
    setShowIOSGuide(false)
    sessionStorage.setItem("pwa-banner-dismissed", "1")
  }

  // Android/Chrome: 설치 프롬프트 실행
  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  // Android/Chrome 설치 배너
  if (showBanner) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border bg-background p-4 shadow-lg md:hidden">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            ST
          </div>
          <div>
            <p className="text-sm font-semibold">SubTracker 앱 설치</p>
            <p className="text-xs text-muted-foreground">홈 화면에 추가하여 앱처럼 사용하세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>
            나중에
          </Button>
          <Button size="sm" className="flex-1" onClick={handleInstall}>
            설치하기
          </Button>
        </div>
      </div>
    )
  }

  // iOS Safari 수동 안내 배너
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border bg-background p-4 shadow-lg md:hidden">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            ST
          </div>
          <p className="text-sm font-semibold">SubTracker 앱 설치</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          하단 공유 버튼(
          <span className="font-medium text-foreground">⎙</span>
          )을 탭한 후 <span className="font-medium text-foreground">홈 화면에 추가</span>를 선택하면
          앱처럼 사용할 수 있어요.
        </p>
      </div>
    )
  }

  return null
}
