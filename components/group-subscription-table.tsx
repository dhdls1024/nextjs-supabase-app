// 그룹 공유 구독 컴포넌트
// 1그룹 1구독 정책: 구독이 없을 때만 "구독 연결" 버튼 표시
// 컬럼: 서비스명 | 총 금액 | 최종 상태
// 멤버별 정산금은 MemberList에서 개별 표시하므로 분담 금액 컬럼 제거
"use client"

import { Plus } from "lucide-react"
import Image from "next/image"

import { AmountDisplay } from "@/components/amount-display"
import { LinkSubscriptionModal } from "@/components/link-subscription-modal"
import { PaymentStatusCell } from "@/components/payment-status-cell"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// 그룹 구독 항목 타입
// subscription은 null 가능 (연결된 구독이 조회 실패한 경우)
interface GroupSubItem {
  id: string
  subscription_id: string
  payment_status: "PENDING" | "PAID"
  subscription?: {
    id: string
    name: string
    amount: number
    next_billing_date: string
    logo_url?: string | null
  } | null
}

// GroupSubscriptionTable Props
interface GroupSubscriptionTableProps {
  groupId: string
  // 1그룹 1구독 — 최대 1개 항목
  groupSubs: GroupSubItem[]
  isOwner: boolean
  // 구독 연결 모달에서 선택 가능한 구독 목록 (구독 미연결 상태일 때만 사용)
  availableSubscriptions: Array<{ id: string; name: string; amount: number }>
}

// GroupSubscriptionTable: 그룹의 공유 구독을 표시
// 1그룹 1구독 정책: 구독이 없을 때만 그룹장에게 "구독 연결" 버튼 표시
// 구독이 있으면 연결 버튼 숨김 (추가 연결 불가)
export function GroupSubscriptionTable({
  groupId,
  groupSubs,
  isOwner,
  availableSubscriptions,
}: GroupSubscriptionTableProps) {
  // 1구독 이상이면 연결 버튼 숨김 — 1그룹 1구독 정책
  const canLink = isOwner && groupSubs.length === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">공유 구독</h2>
        {/* 그룹장이고 구독이 없을 때만 연결 버튼 표시 */}
        {canLink && (
          <LinkSubscriptionModal
            groupId={groupId}
            availableSubscriptions={availableSubscriptions}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                구독 연결
              </Button>
            }
          />
        )}
      </div>

      {groupSubs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {isOwner ? "구독을 연결하여 멤버와 함께 관리하세요." : "공유 구독이 없습니다."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>서비스명</TableHead>
              <TableHead>총 금액</TableHead>
              <TableHead>결제일</TableHead>
              {/* 최종 상태: 그룹장만 토글, 멤버는 읽기 전용 */}
              <TableHead>최종 상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupSubs.map((gs) => (
              <TableRow key={gs.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* 서비스 로고 — next/image로 최적화된 이미지 렌더링 */}
                    {gs.subscription?.logo_url && (
                      <Image
                        src={gs.subscription.logo_url}
                        alt={gs.subscription.name ?? ""}
                        width={16}
                        height={16}
                        className="h-4 w-4 shrink-0 rounded object-contain"
                        loading="lazy"
                      />
                    )}
                    {gs.subscription?.name ?? "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <AmountDisplay amount={gs.subscription?.amount ?? 0} />
                </TableCell>
                {/* YYYY-MM-DD → MM/DD 형식으로 표시 */}
                <TableCell className="text-sm">
                  {gs.subscription?.next_billing_date
                    ? gs.subscription.next_billing_date.slice(5).replace("-", "/")
                    : "-"}
                </TableCell>
                <TableCell>
                  <PaymentStatusCell
                    groupSubId={gs.id}
                    groupId={groupId}
                    currentStatus={gs.payment_status}
                    isOwner={isOwner}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
