"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

// className prop으로 외부에서 스타일 주입 가능 (w-full 등)
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  const logout = async () => {
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
