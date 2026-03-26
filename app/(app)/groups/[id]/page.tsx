// Route: /groups/[id]
// Features: F005, F006
// 공유 그룹 상세 페이지 — Server Component
// 그룹장/멤버 권한 분기: isOwner 여부로 관리 기능(해산, 구독 연결/해제, 멤버 퇴출) 노출 제어
// cacheComponents 환경: 데이터 조회를 Suspense 경계 안에서 처리

import { notFound } from "next/navigation"
import { Suspense } from "react"

import {
  getAvailableSubscriptions,
  getGroup,
  getGroupMembers,
  getGroupSubscriptions,
} from "@/app/actions/group"
import { getReceipts } from "@/app/actions/storage"
import { DisbandGroupButton } from "@/components/disband-group-button"
import { GroupRealtimeSync } from "@/components/group-realtime-sync"
import { GroupSubscriptionTable } from "@/components/group-subscription-table"
import { InviteLinkButton } from "@/components/invite-link-button"
import { MemberList } from "@/components/member-list"
import { PageHeader } from "@/components/page-header"
import { ReceiptSection } from "@/components/receipt-section"
import { RenameGroupModal } from "@/components/rename-group-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"

// 그룹 상세 데이터를 조회하고 렌더링하는 내부 Server Component
// Suspense 경계 안에서 실행되어 cacheComponents와 호환됨
async function GroupDetailContent({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15 async params — await로 처리
  const { id } = await params

  // 현재 로그인 사용자 ID 조회
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // 그룹 정보, 멤버, 공유 구독, 연결 가능한 구독을 병렬 조회
  const [group, members, groupSubs, availableSubscriptions] = await Promise.all([
    getGroup(id),
    getGroupMembers(id),
    getGroupSubscriptions(id),
    getAvailableSubscriptions(id),
  ])

  if (!group) notFound()

  // 그룹장 여부 판별 — owner_id와 현재 사용자 ID 비교
  const isOwner = group.owner_id === user.id

  // 각 공유 구독의 영수증 목록을 병렬 조회
  const receiptsPerSub = await Promise.all(groupSubs.map((gs) => getReceipts(gs.subscription_id)))

  return (
    <div className="space-y-8">
      {/* Realtime 동기화 — 결제 상태 변경 시 자동으로 페이지 데이터 갱신 */}
      <GroupRealtimeSync groupId={id} />

      {/* 페이지 헤더 — 초대 링크 + 그룹장 전용 이름 수정/해산 버튼 */}
      <PageHeader title={group.name} description="공유 그룹 상세 정보">
        {/* 멤버 초대, 이름 수정, 해산 — 그룹장만 표시 */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <InviteLinkButton inviteCode={group.invite_code} />
            <RenameGroupModal groupId={group.id} currentName={group.name} />
            <DisbandGroupButton groupId={group.id} groupName={group.name} />
          </div>
        )}
      </PageHeader>

      {/* 공유 구독 테이블 — 서비스명/총금액/결제일/최종상태 */}
      <GroupSubscriptionTable
        groupId={id}
        groupSubs={groupSubs}
        isOwner={isOwner}
        availableSubscriptions={availableSubscriptions}
      />

      <Separator />

      {/* 멤버 + 정산 현황 통합 — 그룹장: 전체 멤버+정산, 멤버: 본인만 */}
      {/* initialSplitAmounts, initialPaymentStatuses: DB에서 읽은 JSONB 값으로 초기화 */}
      <MemberList
        members={members}
        isOwner={isOwner}
        currentUserId={user.id}
        groupId={id}
        groupSubId={groupSubs[0]?.id}
        totalAmount={groupSubs[0]?.subscription?.amount}
        initialSplitAmounts={groupSubs[0]?.member_split_amounts ?? {}}
        initialPaymentStatuses={groupSubs[0]?.member_payment_statuses ?? {}}
      />

      <Separator />

      {/* 영수증 / 인보이스 — 전체 열람, 그룹장만 삭제 가능 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">영수증 / 인보이스</h2>

        {groupSubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">공유 구독이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {groupSubs.map((gs, index) => (
              <Card key={gs.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    {gs.subscription?.name ?? "-"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReceiptSection
                    subscriptionId={gs.subscription_id}
                    initialReceipts={receiptsPerSub[index] ?? []}
                    isOwner={isOwner}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
      }
    >
      <GroupDetailContent params={params} />
    </Suspense>
  )
}
