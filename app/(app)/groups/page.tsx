// Route: /groups
// Features: F005, F006
// 공유 그룹 목록 페이지 — Server Component

import { Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

import { getAllGroupSubscriptionsForUserById, getGroupsByUserId } from "@/app/actions/group"
import { CreateGroupModal } from "@/components/create-group-modal"
import { JoinGroupModal } from "@/components/join-group-modal"
import { PageHeader } from "@/components/page-header"
import { createClient } from "@/lib/supabase/server"
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
    <div
      className="overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* 그룹 헤더 */}
      <div
        className="flex items-center gap-3 border-b px-4 py-4"
        style={{ borderColor: "hsl(var(--border) / 0.6)" }}
      >
        {/* 그룹 아이콘 */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
        >
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {group.name}
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {groupSubs.length}개 구독
          </p>
        </div>
      </div>

      {/* 공유 구독 미리보기 */}
      <div className="px-4 py-3">
        {firstSub?.subscription ? (
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "hsl(var(--muted) / 0.6)" }}
          >
            {/* 서비스 로고 */}
            {firstSub.subscription.logo_url && (
              <Image
                src={firstSub.subscription.logo_url}
                alt={firstSub.subscription.name}
                width={18}
                height={18}
                className="h-[18px] w-[18px] shrink-0 rounded object-contain"
                loading="lazy"
              />
            )}
            <span className="flex-1 truncate text-xs font-medium">
              {firstSub.subscription.name}
            </span>
            <span className="shrink-0 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {billingDate}
            </span>
            {/* 납부 상태 배지 */}
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={
                firstSub.payment_status === "PAID"
                  ? { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }
                  : { background: "rgba(249, 115, 22, 0.15)", color: "#f97316" }
              }
            >
              {firstSub.payment_status === "PAID" ? "납부완료" : "미납"}
            </span>
          </div>
        ) : (
          <p className="mb-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            공유 구독 없음
          </p>
        )}

        {/* 상세 보기 버튼 */}
        <Link
          href={`/groups/${group.id}`}
          className="flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          상세 보기
        </Link>
      </div>
    </div>
  )
}

// 그룹 목록을 조회하고 렌더링하는 내부 Server Component
async function GroupsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // userId를 공유하여 두 Action의 내부 getUser() 호출을 제거
  const [groups, allGroupSubs] = await Promise.all([
    getGroupsByUserId(user.id),
    getAllGroupSubscriptionsForUserById(user.id),
  ])

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <Users className="h-9 w-9" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <p className="text-base font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
          참여한 그룹이 없습니다
        </p>
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          그룹을 만들거나 초대 코드로 참여하세요.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
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
    <div>
      {/* 페이지 헤더 */}
      <PageHeader title="공유 그룹" description="구독을 함께 관리하는 그룹">
        <div className="flex items-center gap-2">
          <JoinGroupModal />
          <CreateGroupModal />
        </div>
      </PageHeader>

      {/* Suspense 경계 */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-[152px] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        }
      >
        <GroupsContent />
      </Suspense>
    </div>
  )
}
