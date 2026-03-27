"use client"

// 지출 분석 차트 컴포넌트 - recharts 기반 (클라이언트 전용)
// recharts는 브라우저 DOM에 의존하므로 반드시 'use client' 선언 필요
// Props:
//   categoryStats: { category: string; total: number }[]  → 카테고리별 월 지출 합계

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// 카테고리별 지출 집계 타입
type CategoryStat = {
  category: string
  total: number
}

// 컴포넌트 Props 타입
type AnalyticsChartsProps = {
  categoryStats: CategoryStat[]
}

// Y축 금액 축약 포맷터 - 만 단위로 표시 (예: 17000 → '1.7만')
function formatYAxis(value: number): string {
  if (value === 0) return "0"
  return `${(value / 10000).toFixed(1)}만`
}

// 툴팁 금액 포맷터 - 한국어 통화 형식으로 표시
// recharts Tooltip formatter의 value는 ValueType(number|string|readonly array|undefined)이므로
// unknown으로 받아 타입 가드로 number만 처리
function formatTooltipValue(value: unknown): string {
  if (typeof value !== "number") return "-"
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(value)
}

// 카테고리별 월 지출 바 차트
function CategoryBarChart({ data }: { data: CategoryStat[] }) {
  return (
    <div>
      {/* 차트 소제목 */}
      <h3 className="mb-4 text-base font-semibold">카테고리별 월 지출</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          {/* 격자선 - 가로선만 표시하여 가독성 향상 */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="category" tick={{ fontSize: 13 }} />
          {/* Y축: 만 단위 축약 표시 */}
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} width={48} />
          {/* contentStyle: 다크모드에서 배경/글자색 명시 — Recharts 툴팁은 CSS 변수를 읽지 못해 인라인 스타일 필요 */}
          {/* cursor={false}: 터치 시 흰 박스 오버레이 및 반투명 막대 넘침 현상 완전 제거 */}
          <Tooltip
            formatter={(value) => [formatTooltipValue(value), "월 지출"]}
            cursor={false}
            contentStyle={{
              backgroundColor: "#1a1a1a",
              borderColor: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            labelStyle={{ color: "#ffffff", fontWeight: 600 }}
            itemStyle={{ color: "#e0e0e0" }}
          />
          <Legend />
          {/* 바 색상: CSS 변수로 테마 연동 */}
          <Bar dataKey="total" name="월 지출" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 분석 차트 컴포넌트
export function AnalyticsCharts({ categoryStats }: AnalyticsChartsProps) {
  return (
    <div className="space-y-8">
      {/* 카테고리별 바 차트 */}
      <CategoryBarChart data={categoryStats} />
    </div>
  )
}
