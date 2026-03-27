"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

// className prop으로 외부에서 스타일 주입 가능 (w-full 등)
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  const logout = async () => {
    // SW의 RSC 캐시를 삭제하여 공용 기기에서 다음 사용자에게 데이터가 노출되지 않도록 함
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_USER_CACHE" })
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Button onClick={logout} variant="destructive" size="sm" className={className}>
      로그아웃
    </Button>
  )
}
