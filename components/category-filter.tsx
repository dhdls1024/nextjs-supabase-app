"use client"

// 카테고리 탭 필터 + 구독 목록 테이블을 결합한 클라이언트 컴포넌트
// 탭 클릭 시 해당 카테고리로 목록을 필터링하여 표시
// useRouter().push()를 통해 각 행 클릭 시 상세 페이지로 이동

import { ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { AmountDisplay } from "@/components/amount-display"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UrgentBadge } from "@/components/urgent-badge"
import type { Subscription } from "@/lib/types/database"
import { CATEGORIES, BILLING_CYCLES } from "@/lib/types/index"

// 전체 탭 value 상수
const ALL_TAB_VALUE = "ALL"
// 전체 탭 레이블 상수
const ALL_TAB_LABEL = "전체"
// 결제 임박 기준 일수 상수
const URGENT_DAYS_THRESHOLD = 3

// CategoryFilter 컴포넌트 Props 타입
type CategoryFilterProps = {
  subscriptions: Subscription[]
  // 분석 페이지에서 카테고리 클릭 시 URL 파라미터로 초기 카테고리 지정
  initialCategory?: string
}

// 결제 주기 코드를 한국어 레이블로 변환
function getBillingCycleLabel(cycle: Subscription["billing_cycle"]): string {
  // BILLING_CYCLES 상수에서 일치하는 label 반환
  return BILLING_CYCLES.find((c) => c.value === cycle)?.label ?? cycle
}

// 카테고리 코드를 한국어 레이블로 변환 (현재 카드 UI에서 미사용, 향후 확장용으로 유지)
function _getCategoryLabel(category: Subscription["category"]): string {
  // CATEGORIES 상수에서 일치하는 label 반환
  return CATEGORIES.find((c) => c.value === category)?.label ?? category
}

// D-day 계산 - 결제일까지 남은 일수 반환
function getDday(nextBillingDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const billing = new Date(nextBillingDate)
  billing.setHours(0, 0, 0, 0)
  return Math.ceil((billing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// 결제 임박 여부 판단 - UrgentBadge 표시 여부 결정에 사용
function isUrgent(nextBillingDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const billingDate = new Date(nextBillingDate)
  billingDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  // 0일 이상 3일 이하인 경우만 임박으로 판단
  return diff >= 0 && diff <= URGENT_DAYS_THRESHOLD
}

// 카테고리 탭 선택에 따라 구독 목록을 필터링하고 테이블로 표시하는 컴포넌트
export function CategoryFilter({ subscriptions, initialCategory }: CategoryFilterProps) {
  // initialCategory가 있으면 목록을 열고 해당 카테고리를 활성화
  const validInitial =
    initialCategory && CATEGORIES.some((c) => c.value === initialCategory) ? initialCategory : null
  // 구독 목록 섹션 열림/닫힘 상태 (기본값: 열림)
  const [isOpen, setIsOpen] = useState<boolean>(true)
  // 현재 선택된 카테고리 탭 상태 ('ALL' 또는 카테고리 value)
  const [activeCategory, setActiveCategory] = useState<string>(validInitial ?? ALL_TAB_VALUE)
  const router = useRouter()

  // 선택된 카테고리에 따라 구독 목록 필터링
  const filtered =
    activeCategory === ALL_TAB_VALUE
      ? subscriptions
      : subscriptions.filter((s) => s.category === activeCategory)

  // 테이블 행 클릭 시 구독 상세 페이지로 이동
  function handleRowClick(id: string) {
    router.push(`/subscriptions/${id}`)
  }

  return (
    <div>
      {/* 구독 목록 토글 버튼 - 클릭 시 카테고리 탭과 테이블 열기/닫기 */}
      <Button
        variant="outline"
        className="mb-4 flex h-14 w-full items-center justify-between px-5 text-base"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold">구독 목록</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {/* isOpen이 true일 때만 카테고리 탭과 테이블 표시 */}
      {isOpen && (
        <div>
          {/* 카테고리 탭 필터 */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4">
              {/* 전체 탭 */}
              <TabsTrigger value={ALL_TAB_VALUE}>{ALL_TAB_LABEL}</TabsTrigger>

              {/* 각 카테고리 탭 */}
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* 필터링 결과에 따라 빈 상태 메시지 또는 테이블 표시 */}
          {filtered.length === 0 ? (
            // 필터링 결과 없을 때 빈 상태 메시지 표시
            <div className="py-12 text-center text-sm text-muted-foreground">
              해당 카테고리의 구독이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((sub) => (
                <Card
                  key={sub.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleRowClick(sub.id)}
                >
                  <CardContent className="p-4">
                    {/* 상단: 로고 + 서비스명(좌) + 금액(우) */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* 로고: logo_url 있으면 이미지, 없으면 이니셜 fallback */}
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                          {sub.logo_url ? (
                            <Image
                              src={sub.logo_url}
                              alt={sub.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-contain"
                              // 뷰포트 밖 이미지는 lazy 로딩으로 초기 로드 개선
                              loading="lazy"
                            />
                          ) : (
                            sub.name.slice(0, 1)
                          )}
                        </div>
                        <span className="text-base font-semibold">{sub.name}</span>
                      </div>
                      <span className="text-base font-bold">
                        <AmountDisplay amount={sub.amount} />
                      </span>
                    </div>

                    {/* 중단: D-day + 결제주기 */}
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">
                        결제일까지 D-{getDday(sub.next_billing_date)}
                      </span>
                      <span>·</span>
                      <span>{getBillingCycleLabel(sub.billing_cycle)}</span>
                    </div>

                    {/* 하단: 다음 결제일(좌, 주황색) + 상태/임박 배지(우) */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-500">
                        다음 결제일 - {sub.next_billing_date}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={sub.status} />
                        {isUrgent(sub.next_billing_date) && (
                          <UrgentBadge next_billing_date={sub.next_billing_date} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
