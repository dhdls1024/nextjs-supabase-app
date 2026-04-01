"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // 구글 OAuth 로그인 시작 - 브라우저를 구글 동의 화면으로 리다이렉트
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // 구글 인증 완료 후 돌아올 콜백 URL
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-0", className)} {...props}>
      {/* 앱 로고 & 타이틀 영역 */}
      <div className="mb-8 text-center">
        {/* 로고 아이콘 */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "var(--glow-primary)",
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Sora', sans-serif", color: "hsl(var(--foreground))" }}
        >
          OTT관리
        </h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          구독 서비스를 한 곳에서 관리하세요
        </p>
      </div>

      {/* 로그인 폼 카드 */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  비밀번호
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  비밀번호 찾기
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            {error && (
              <p
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  background: "hsl(var(--destructive) / 0.1)",
                  color: "hsl(var(--destructive))",
                }}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-semibold"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </div>

          <div
            className="mt-4 text-center text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            계정이 없으신가요?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold hover:underline"
              style={{ color: "hsl(var(--primary))" }}
            >
              회원가입
            </Link>
          </div>
        </form>

        {/* OR 구분선 */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full" style={{ borderTop: "1px solid hsl(var(--border))" }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span
              className="px-3 text-xs"
              style={{ background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))" }}
            >
              또는 소셜 로그인
            </span>
          </div>
        </div>

        {/* 구글 로그인 버튼 */}
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl font-medium"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          구글로 계속하기
        </Button>
      </div>
    </div>
  )
}
