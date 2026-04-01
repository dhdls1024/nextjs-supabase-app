import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    // 전체 화면 중앙 정렬 — 배경 그라데이션 + 노이즈 텍스처 효과
    <div
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
      style={{
        background: "hsl(var(--background))",
        // 상단 보라색 광원 효과
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 50% -10%, hsl(var(--primary) / 0.2) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 90% 90%, hsl(215 80% 50% / 0.08) 0%, transparent 50%)
        `,
      }}
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
