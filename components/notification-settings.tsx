"use client"

// 알림 설정 섹션 — 결제일 알림 토글 + D-day 알림 시점 선택
// 현재는 UI 상태만 관리 (Phase 3에서 Supabase 연동 예정)
import { useState } from "react"

import { Switch } from "@/components/ui/switch"

// D-day 알림 시점 옵션 상수
const DDAY_OPTIONS = [
  { label: "당일", value: 0 },
  { label: "1일", value: 1 },
  { label: "3일", value: 3 },
  { label: "5일", value: 5 },
]

export default function NotificationSettings() {
  // 결제일 알림 on/off
  const [enabled, setEnabled] = useState(false)
  // D-day 알림 시점 (기본값: 당일)
  const [selectedDday, setSelectedDday] = useState(0)

  return (
    <section>
      <p className="mb-2 text-sm text-muted-foreground">알림설정</p>
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          결제일(만료일) 하루 전, 당일 알림을 보내드립니다.
        </p>

        {/* 결제일 알림 토글 */}
        <div className="flex items-center justify-between">
          <span className="text-sm">결제일 알림</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* D-day 알림 시점 선택 — 알림 활성화 시에만 표시 */}
        {enabled && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">D-day 알림 시점</p>
            <div className="flex gap-2">
              {DDAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDday(opt.value)}
                  // 선택된 버튼은 primary 색상, 나머지는 기본 border
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedDday === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              * 결제일 당일 아침 9시에 알림을 받습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
