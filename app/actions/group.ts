"use server"

// 공유 그룹 관련 Server Actions
// groups, group_members, group_subscriptions 테이블 CRUD

import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type {
  Group,
  GroupMember,
  GroupSubscription,
  GroupSubscriptionInsert,
  GroupSubscriptionUpdate,
  Subscription,
} from "@/lib/types/database"

import type { ActionResult } from "./types"

// =============================================
// 그룹 조회
// =============================================

// userId를 직접 받아 getUser() 호출 생략 — 페이지에서 이미 인증 확인된 경우 사용
// 내부적으로 group_members → group_subscriptions 2단계 쿼리를 실행함
// (Supabase 현재 스키마 구조상 단일 쿼리로 병합 불가)
export async function getAllGroupSubscriptionsForUserById(
  userId: string
): Promise<(GroupSubscription & { subscription: Subscription | null })[]> {
  const supabase = await createClient()

  // 사용자가 속한 그룹 ID 목록 조회
  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)

  if (!memberRows || memberRows.length === 0) return []

  const groupIds = memberRows.map((m) => m.group_id)

  // 해당 그룹들의 공유 구독을 한 번에 조회 (N+1 제거)
  const { data, error } = await supabase
    .from("group_subscriptions")
    .select("*, subscription:subscriptions(*)")
    .in("group_id", groupIds)

  if (error || !data) return []
  return data as (GroupSubscription & { subscription: Subscription | null })[]
}

// 현재 로그인 사용자가 속한 모든 그룹의 공유 구독을 한 번에 조회
// 그룹 목록 페이지 N+1 쿼리 제거용 — 각 GroupCard가 개별 조회하는 대신 일괄 조회
export async function getAllGroupSubscriptionsForUser(): Promise<
  (GroupSubscription & { subscription: Subscription | null })[]
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  return getAllGroupSubscriptionsForUserById(user.id)
}

// userId를 직접 받아 getUser() 호출 생략 — 페이지에서 이미 인증 확인된 경우 사용
// 여러 Action을 병렬 호출할 때 getUser() 중복 호출을 방지하여 성능 최적화
export async function getGroupsByUserId(userId: string): Promise<Group[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("group_members")
    .select("groups(*)")
    .eq("user_id", userId)

  if (error || !data) return []

  // group_members.groups 중첩 조회 결과를 Group[] 형태로 평탄화
  // Supabase join 결과는 배열 또는 단일 객체를 반환할 수 있어 Array.isArray로 분기
  const groups: Group[] = []
  for (const item of data) {
    const g = item.groups
    if (g && !Array.isArray(g)) {
      groups.push(g as Group)
    }
  }
  return groups
}

// 현재 로그인 사용자가 속한 그룹 목록 조회
// group_members를 경유해 groups JOIN
export async function getGroups(): Promise<Group[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  return getGroupsByUserId(user.id)
}

// 특정 그룹 단건 조회 (userId 인자 버전 — getUser() 중복 호출 방지)
// _userId: 사용되지 않지만 호출 시그니처 통일을 위해 유지 (RLS가 서버에서 인가 처리)
export async function getGroupById(groupId: string, _userId: string): Promise<Group | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).single()

  if (error || !data) return null
  return data as Group
}

// 특정 그룹 단건 조회
export async function getGroup(groupId: string): Promise<Group | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return getGroupById(groupId, user.id)
}

// 그룹 멤버 목록 조회 (userId 인자 버전 — getUser() 중복 호출 방지)
// displayName 우선순위: nickname > email > user_id
// _userId: 사용되지 않지만 호출 시그니처 통일을 위해 유지 (RLS가 서버에서 인가 처리)
export async function getGroupMembersById(
  groupId: string,
  _userId: string
): Promise<(GroupMember & { displayName: string })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("group_members")
    .select("*, profile:profiles(nickname, email)")
    .eq("group_id", groupId)

  if (error || !data) return []

  return data.map((m) => {
    const profile = m.profile as { nickname: string | null; email: string | null } | null
    const displayName = profile?.nickname || profile?.email || m.user_id
    return { ...m, displayName }
  })
}

// 그룹 멤버 목록 조회 — profiles JOIN으로 displayName 포함
// displayName 우선순위: nickname > email > user_id
export async function getGroupMembers(
  groupId: string
): Promise<(GroupMember & { displayName: string })[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  return getGroupMembersById(groupId, user.id)
}

// 그룹의 공유 구독 목록 조회 (userId 인자 버전 — getUser() 중복 호출 방지)
// _userId: 사용되지 않지만 호출 시그니처 통일을 위해 유지 (RLS가 서버에서 인가 처리)
export async function getGroupSubscriptionsById(
  groupId: string,
  _userId: string
): Promise<(GroupSubscription & { subscription: Subscription | null })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("group_subscriptions")
    .select("*, subscription:subscriptions(*)")
    .eq("group_id", groupId)

  if (error || !data) return []
  return data as (GroupSubscription & { subscription: Subscription | null })[]
}

// 그룹의 공유 구독 목록 조회 (구독 상세 포함)
export async function getGroupSubscriptions(
  groupId: string
): Promise<(GroupSubscription & { subscription: Subscription | null })[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  return getGroupSubscriptionsById(groupId, user.id)
}

// 현재 사용자가 연결 가능한 구독 목록 (userId 인자 버전 — getUser() 중복 호출 방지)
// 두 쿼리를 Promise.all로 병렬 실행 후 메모리에서 필터링 — waterfall 제거
export async function getAvailableSubscriptionsById(
  groupId: string,
  userId: string
): Promise<Subscription[]> {
  const supabase = await createClient()

  // 사용자 구독 전체 + 이미 연결된 구독 ID를 병렬 조회
  const [{ data: allSubs }, { data: linked }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("group_subscriptions").select("subscription_id").eq("group_id", groupId),
  ])

  const linkedIds = new Set((linked ?? []).map((l) => l.subscription_id))
  return (allSubs ?? []).filter((s) => !linkedIds.has(s.id)) as Subscription[]
}

// 현재 사용자가 연결 가능한 구독 목록 (그룹에 아직 연결되지 않은 것만)
// 두 쿼리를 Promise.all로 병렬 실행 후 메모리에서 필터링 — waterfall 제거
export async function getAvailableSubscriptions(groupId: string): Promise<Subscription[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  return getAvailableSubscriptionsById(groupId, user.id)
}

// =============================================
// 그룹 생성 / 수정 / 해산
// =============================================

// 그룹 생성 — 생성자를 OWNER로 자동 추가
// nanoid(8)로 고유 초대 코드 생성
export async function createGroup(name: string): Promise<ActionResult<Group>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // 8자리 고유 초대 코드 생성
  const inviteCode = nanoid(8)

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, owner_id: user.id, invite_code: inviteCode })
    .select()
    .single()

  if (groupError || !group) {
    return { success: false, error: groupError?.message ?? "그룹 생성에 실패했습니다." }
  }

  // 생성자를 OWNER 역할로 group_members에 자동 추가
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "OWNER" })

  if (memberError) {
    // 멤버 추가 실패 시 생성된 그룹도 롤백
    await supabase.from("groups").delete().eq("id", group.id)
    return { success: false, error: memberError.message ?? "그룹 멤버 추가에 실패했습니다." }
  }

  revalidatePath("/groups")
  return { success: true, data: group as Group }
}

// 그룹 이름 수정 — 그룹장만 가능
export async function renameGroup(groupId: string, name: string): Promise<ActionResult<Group>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId)
    .eq("owner_id", user.id) // RLS 대신 명시적 조건으로 그룹장 검증
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? "그룹 이름 수정에 실패했습니다." }
  }

  revalidatePath("/groups")
  revalidatePath(`/groups/${groupId}`)
  return { success: true, data: data as Group }
}

// 그룹 해산 — 그룹장만 가능, CASCADE로 관련 DB 레코드 자동 삭제
// Storage 영수증 파일은 CASCADE 대상이 아니므로 별도 정리
export async function disbandGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // 해산 전 그룹에 연결된 구독의 영수증 파일 경로 조회
  // group_subscriptions → subscriptions → receipts 경로를 따라 조회
  const { data: groupSubs } = await supabase
    .from("group_subscriptions")
    .select("subscription_id")
    .eq("group_id", groupId)

  const subIds = (groupSubs ?? []).map((gs) => gs.subscription_id).filter(Boolean)

  if (subIds.length > 0) {
    const { data: receipts } = await supabase
      .from("receipts")
      .select("file_url")
      .in("subscription_id", subIds)

    // Storage 영수증 파일 일괄 삭제
    const filePaths = (receipts ?? []).map((r) => r.file_url).filter(Boolean)
    if (filePaths.length > 0) {
      await supabase.storage.from("receipts").remove(filePaths)
    }
  }

  const { error } = await supabase.from("groups").delete().eq("id", groupId).eq("owner_id", user.id) // 그룹장만 해산 가능

  if (error) {
    return { success: false, error: error.message ?? "그룹 해산에 실패했습니다." }
  }

  revalidatePath("/groups")
  return { success: true, data: undefined }
}

// =============================================
// 그룹 참여 / 탈퇴
// =============================================

// 초대 코드로 그룹 참여 — MEMBER 역할로 추가
export async function joinGroup(inviteCode: string): Promise<ActionResult<Group>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // 초대 코드로 그룹 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode.trim())
    .single()

  if (groupError || !group) {
    return { success: false, error: "유효하지 않은 초대 코드입니다." }
  }

  // 이미 참여한 그룹인지 확인
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    return { success: false, error: "이미 참여 중인 그룹입니다." }
  }

  // MEMBER 역할로 추가
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "MEMBER" })

  if (memberError) {
    return { success: false, error: memberError.message ?? "그룹 참여에 실패했습니다." }
  }

  revalidatePath("/groups")
  return { success: true, data: group as Group }
}

// 멤버 퇴출 — 그룹장만 가능
// 퇴출 시 group_subscriptions의 JSONB(member_split_amounts, member_payment_statuses)에서
// 해당 멤버 키를 제거하여 재초대 시 이전 데이터가 남지 않도록 정리
export async function kickMember(groupId: string, memberId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // 그룹장 여부 확인
  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single()

  if (!group || group.owner_id !== user.id) {
    return { success: false, error: "그룹장만 멤버를 퇴출할 수 있습니다." }
  }

  // 퇴출할 멤버의 user_id 조회 — JSONB 키 삭제에 필요
  const { data: memberRecord } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("id", memberId)
    .single()

  // group_members에서 삭제
  const { error } = await supabase.from("group_members").delete().eq("id", memberId)

  if (error) {
    return { success: false, error: error.message ?? "멤버 퇴출에 실패했습니다." }
  }

  // 퇴출 멤버의 정산 데이터를 JSONB에서 제거 — SQL의 #- 연산자로 키 삭제
  // 실패해도 퇴출 자체는 성공이므로 에러를 무시하고 진행
  if (memberRecord?.user_id) {
    const userId = memberRecord.user_id
    await supabase.rpc("remove_member_from_group_subs", {
      p_group_id: groupId,
      p_user_id: userId,
    })
  }

  revalidatePath(`/groups/${groupId}`)
  return { success: true, data: undefined }
}

// =============================================
// 구독 연결 / 해제
// =============================================

// 그룹에 구독 연결
export async function linkSubscription(
  input: GroupSubscriptionInsert
): Promise<ActionResult<GroupSubscription>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase.from("group_subscriptions").insert(input).select().single()

  if (error || !data) {
    return { success: false, error: error?.message ?? "구독 연결에 실패했습니다." }
  }

  revalidatePath(`/groups/${input.group_id}`)
  return { success: true, data: data as GroupSubscription }
}

// 그룹 구독 해제
export async function unlinkSubscription(
  groupSubId: string,
  groupId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { error } = await supabase.from("group_subscriptions").delete().eq("id", groupSubId)

  if (error) {
    return { success: false, error: error.message ?? "구독 해제에 실패했습니다." }
  }

  revalidatePath(`/groups/${groupId}`)
  return { success: true, data: undefined }
}

// 그룹 구독 정보 업데이트 (분담금, 정산 상태)
export async function updateGroupSubscription(
  groupSubId: string,
  groupId: string,
  input: GroupSubscriptionUpdate
): Promise<ActionResult<GroupSubscription>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase
    .from("group_subscriptions")
    .update(input)
    .eq("id", groupSubId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? "업데이트에 실패했습니다." }
  }

  revalidatePath(`/groups/${groupId}`)
  return { success: true, data: data as GroupSubscription }
}
