// 금액을 통화 형식으로 포맷하여 표시하는 컴포넌트
// Intl.NumberFormat을 활용해 한국어 통화 포맷 적용
// Server Component - 순수 포맷팅 로직만 포함

// AmountDisplay 컴포넌트 Props 타입
type AmountDisplayProps = {
  amount: number
  currency?: string // 기본값: 'KRW'
  className?: string
}

// 기본 통화 코드 상수
const DEFAULT_CURRENCY = "KRW"

// 금액을 지정된 통화 형식으로 변환
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
  }).format(amount)
}

// 금액을 통화 기호와 함께 포맷하여 렌더링
export function AmountDisplay({
  amount,
  currency = DEFAULT_CURRENCY,
  className,
}: AmountDisplayProps) {
  const formatted = formatAmount(amount, currency)

  return <span className={className}>{formatted}</span>
}
