// Route: /groups
// Features: F005, F006
// 공유 그룹 목록 페이지 — Server Component
// 현재 사용자의 그룹 목록을 Supabase에서 조회하여 렌더링
// cacheComponents 환경: 데이터 조회를 Suspense 경계 안에서 처리

import { Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

import { getAllGroupSubscriptionsForUser, getGroups } from "@/app/actions/group"
import { CreateGroupModal } from "@/components/create-group-modal"
import { JoinGroupModal } from "@/components/join-group-modal"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Group, GroupSubscription, Subscription } from "@/lib/types/database"

// 개별 그룹 카드 컴포넌트 — 상위에서 조회한 groupSubs를 props로 받아 N+1 쿼리 제거
function GroupCard({
  group,
  groupSubs,
}: {
  group: Group
  groupSubs: (GroupSubscription & { subscription: Subscription | null })[]
}) {
  const firstSub = groupSubs[0] ?? null

  // YYYY-MM-DD → MM/DD 형식 변환
  const billingDate = firstSub?.subscription?.next_billing_date
    ? firstSub.subscription.next_billing_date.slice(5).replace("-", "/")
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span>{group.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* 공유 구독 요약 — 서비스명 · 결제일 · 결제상태 */}
        {firstSub?.subscription ? (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
            {/* 서비스 로고 — logo_url 있으면 이미지, 없으면 미표시 */}
            {firstSub.subscription.logo_url && (
              <Image
                src={firstSub.subscription.logo_url}
                alt={firstSub.subscription.name}
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded object-contain"
              />
            )}
            <span className="flex-1 truncate text-sm font-medium">
              {firstSub.subscription.name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{billingDate}</span>
            <Badge
              variant={firstSub.payment_status === "PAID" ? "default" : "outline"}
              className="shrink-0 text-xs"
            >
              {firstSub.payment_status === "PAID" ? "납부완료" : "미납"}
            </Badge>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">공유 구독 없음</p>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/groups/${group.id}`}>상세 보기</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// 그룹 목록을 조회하고 렌더링하는 내부 Server Component
// Suspense 경계 안에서 실행되어 cacheComponents와 호환됨
// getGroups + getAllGroupSubscriptionsForUser를 병렬 조회하여 N+1 쿼리 제거
async function GroupsContent() {
  const [groups, allGroupSubs] = await Promise.all([getGroups(), getAllGroupSubscriptionsForUser()])

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 참여한 그룹이 없습니다. 그룹을 만들거나 초대 코드로 참여하세요.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          // 해당 그룹의 구독만 필터링하여 전달
          groupSubs={allGroupSubs.filter((s) => s.group_id === group.id)}
        />
      ))}
    </div>
  )
}

export default function GroupsPage() {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 — 우측에 그룹 참여 + 그룹 만들기 버튼 배치 */}
      <PageHeader title="공유 그룹" description="구독을 함께 관리하는 그룹">
        <div className="flex items-center gap-2">
          <JoinGroupModal />
          <CreateGroupModal />
        </div>
      </PageHeader>

      {/* Suspense 경계 — cacheComponents와 호환되도록 데이터 조회를 감쌈 */}
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
        }
      >
        <GroupsContent />
      </Suspense>
    </div>
  )
}
