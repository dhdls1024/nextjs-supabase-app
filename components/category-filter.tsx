"use client"

// 카테고리 탭 필터 + 구독 목록 카드를 결합한 클라이언트 컴포넌트
// 탭 클릭 시 해당 카테고리로 목록을 필터링하여 표시
// useRouter().push()를 통해 각 카드 클릭 시 상세 페이지로 이동

import { ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { AmountDisplay } from "@/components/amount-display"
import { StatusBadge } from "@/components/status-badge"
import { UrgentBadge } from "@/components/urgent-badge"
import type { Subscription } from "@/lib/types/database"
import { CATEGORIES, BILLING_CYCLES } from "@/lib/types/index"

// 전체 탭 value 상수
const ALL_TAB_VALUE = "ALL"
// 결제 임박 기준 일수 상수
const URGENT_DAYS_THRESHOLD = 3

// 카테고리별 색상 매핑 (인디고/남색 계열 기반)
const CATEGORY_COLORS: Record<string, { bg: string; dot: string; ring: string }> = {
  OTT: { bg: "rgba(79, 108, 220, 0.12)", dot: "#4f6cdc", ring: "rgba(79, 108, 220, 0.3)" },
  MUSIC: { bg: "rgba(236, 72, 153, 0.12)", dot: "#ec4899", ring: "rgba(236, 72, 153, 0.3)" },
  GAME: { bg: "rgba(34, 197, 94, 0.12)", dot: "#22c55e", ring: "rgba(34, 197, 94, 0.3)" },
  NEWS: { bg: "rgba(14, 165, 233, 0.12)", dot: "#0ea5e9", ring: "rgba(14, 165, 233, 0.3)" },
  SOFTWARE: { bg: "rgba(234, 179, 8, 0.12)", dot: "#eab308", ring: "rgba(234, 179, 8, 0.3)" },
  OTHER: { bg: "rgba(148, 163, 184, 0.12)", dot: "#94a3b8", ring: "rgba(148, 163, 184, 0.3)" },
}

// CategoryFilter 컴포넌트 Props 타입
type CategoryFilterProps = {
  subscriptions: Subscription[]
  initialCategory?: string
}

// 결제 주기 코드를 한국어 레이블로 변환
function getBillingCycleLabel(cycle: Subscription["billing_cycle"]): string {
  return BILLING_CYCLES.find((c) => c.value === cycle)?.label ?? cycle
}

// D-day 계산 - 결제일까지 남은 일수 반환
function getDday(nextBillingDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const billing = new Date(nextBillingDate)
  billing.setHours(0, 0, 0, 0)
  return Math.ceil((billing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// 결제 임박 여부 판단
function isUrgent(nextBillingDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const billingDate = new Date(nextBillingDate)
  billingDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 && diff <= URGENT_DAYS_THRESHOLD
}

// 카테고리 탭 선택에 따라 구독 목록을 필터링하고 카드로 표시하는 컴포넌트
export function CategoryFilter({ subscriptions, initialCategory }: CategoryFilterProps) {
  const validInitial =
    initialCategory && CATEGORIES.some((c) => c.value === initialCategory) ? initialCategory : null
  // 구독 목록 섹션 열림/닫힘 상태 (기본값: 열림)
  const [isOpen, setIsOpen] = useState<boolean>(true)
  // 현재 선택된 카테고리 탭 상태
  const [activeCategory, setActiveCategory] = useState<string>(validInitial ?? ALL_TAB_VALUE)
  const router = useRouter()

  // 선택된 카테고리에 따라 구독 목록 필터링
  const filtered =
    activeCategory === ALL_TAB_VALUE
      ? subscriptions
      : subscriptions.filter((s) => s.category === activeCategory)

  // 카드 클릭 시 구독 상세 페이지로 이동
  function handleRowClick(id: string) {
    router.push(`/subscriptions/${id}`)
  }

  return (
    <div>
      {/* 구독 목록 토글 버튼 — 세련된 아웃라인 스타일 */}
      <button
        className="mb-5 flex h-12 w-full items-center justify-between rounded-xl px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.99]"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
          구독 목록
          <span
            className="ml-2 rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
          >
            {subscriptions.length}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        )}
      </button>

      {isOpen && (
        <div>
          {/* 카테고리 탭 필터 — 가로 스크롤 가능한 pill 스타일 */}
          <div className="scrollbar-hide -mx-1 mb-5 overflow-x-auto">
            <div className="flex gap-2 px-1 pb-1">
              {/* 전체 탭 */}
              <button
                onClick={() => setActiveCategory(ALL_TAB_VALUE)}
                className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                style={
                  activeCategory === ALL_TAB_VALUE
                    ? {
                        background: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                        boxShadow: "var(--glow-primary)",
                      }
                    : {
                        background: "hsl(var(--muted))",
                        color: "hsl(var(--muted-foreground))",
                      }
                }
              >
                전체
              </button>

              {/* 각 카테고리 탭 */}
              {CATEGORIES.map((cat) => {
                const colors = CATEGORY_COLORS[cat.value] ?? CATEGORY_COLORS.OTHER
                const isActiveCat = activeCategory === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                    style={
                      isActiveCat
                        ? {
                            background: colors.bg,
                            color: colors.dot,
                            boxShadow: `0 0 12px ${colors.ring}`,
                            border: `1px solid ${colors.ring}`,
                          }
                        : {
                            background: "hsl(var(--muted))",
                            color: "hsl(var(--muted-foreground))",
                          }
                    }
                  >
                    {/* 카테고리 색상 닷 */}
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: isActiveCat ? colors.dot : "currentColor",
                        opacity: isActiveCat ? 1 : 0.5,
                      }}
                    />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 필터링 결과에 따라 빈 상태 메시지 또는 카드 목록 표시 */}
          {filtered.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              해당 카테고리의 구독이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((sub, idx) => {
                const colors = CATEGORY_COLORS[sub.category] ?? CATEGORY_COLORS.OTHER
                const dday = getDday(sub.next_billing_date)
                const urgent = isUrgent(sub.next_billing_date)

                return (
                  <div
                    key={sub.id}
                    // 카드 클릭 시 상세 페이지 이동
                    onClick={() => handleRowClick(sub.id)}
                    className={`animate-fade-slide-up stagger-${Math.min(idx + 1, 5)} cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.98]`}
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <div className="p-4">
                      {/* 상단: 로고 + 서비스명 + 금액 */}
                      <div className="flex items-center gap-3">
                        {/* 로고 컨테이너 — 카테고리 색상 배경 */}
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                          style={{
                            background: colors.bg,
                            border: `1px solid ${colors.ring}`,
                            color: colors.dot,
                          }}
                        >
                          {sub.logo_url ? (
                            <Image
                              src={sub.logo_url}
                              alt={sub.name}
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-xl object-contain"
                              loading="lazy"
                            />
                          ) : (
                            // 이니셜 — Sora 폰트로 강조
                            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
                              {sub.name.slice(0, 1)}
                            </span>
                          )}
                        </div>

                        {/* 서비스명 + 결제 주기 */}
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ fontFamily: "'Sora', sans-serif" }}
                          >
                            {sub.name}
                          </p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {getBillingCycleLabel(sub.billing_cycle)}
                          </p>
                        </div>

                        {/* 금액 — 오른쪽 정렬 */}
                        <div className="shrink-0 text-right">
                          <p
                            className="display-number text-sm font-bold"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            <AmountDisplay amount={sub.amount} />
                          </p>
                          {/* D-day 표시 */}
                          <p
                            className="mt-0.5 text-[11px] font-medium"
                            style={{ color: urgent ? "#f97316" : "hsl(var(--muted-foreground))" }}
                          >
                            D-{dday}
                          </p>
                        </div>
                      </div>

                      {/* 하단: 다음 결제일 + 상태 배지 */}
                      <div
                        className="mt-3 flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: "hsl(var(--muted) / 0.6)" }}
                      >
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          다음 결제
                          <span
                            className="ml-1.5 font-medium"
                            style={{ color: urgent ? "#f97316" : "hsl(var(--foreground))" }}
                          >
                            {sub.next_billing_date}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={sub.status} />
                          {urgent && <UrgentBadge next_billing_date={sub.next_billing_date} />}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
