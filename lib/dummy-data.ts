// Phase 2 개발용 더미 데이터 모음
// 실제 Supabase 연동 전 UI 테스트 및 레이아웃 검증에 사용
// UrgentBadge 테스트를 위해 날짜는 new Date() 기반으로 동적 계산

import type {
  Group,
  GroupMember,
  GroupSubscription,
  Receipt,
  Subscription,
} from "@/lib/types/database"

// 오늘 날짜 기준으로 N일 후의 날짜를 YYYY-MM-DD 문자열로 반환
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

// 과거 N일 전 날짜를 YYYY-MM-DD 문자열로 반환
function subtractDays(days: number): string {
  return addDays(-days)
}

// --- 구독 더미 데이터 (6개) ---
// 카테고리: OTT 2개, AI 1개, SHOPPING 1개, MUSIC 1개, OTHER 1개
// 상태: ACTIVE 4개, PAUSED 1개, CANCELLED 1개
// 결제 임박: sub-001(1일 후), sub-002(2일 후) → UrgentBadge 테스트용
export const DUMMY_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-001",
    user_id: "user-dummy-001",
    name: "Netflix",
    category: "OTT",
    amount: 17000,
    billing_cycle: "MONTHLY",
    next_billing_date: addDays(1), // 결제 임박 (1일 후)
    status: "ACTIVE",
    logo_url: "https://www.google.com/s2/favicons?domain=netflix.com&sz=64",
    notes: "가족 공유 플랜",
    created_at: subtractDays(90),
  },
  {
    id: "sub-002",
    user_id: "user-dummy-001",
    name: "Disney+",
    category: "OTT",
    amount: 9900,
    billing_cycle: "MONTHLY",
    next_billing_date: addDays(2), // 결제 임박 (2일 후)
    status: "ACTIVE",
    logo_url: "https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64",
    notes: null,
    created_at: subtractDays(60),
  },
  {
    id: "sub-003",
    user_id: "user-dummy-001",
    name: "ChatGPT Plus",
    category: "AI",
    amount: 27000,
    billing_cycle: "MONTHLY",
    next_billing_date: addDays(15),
    status: "ACTIVE",
    logo_url: "https://www.google.com/s2/favicons?domain=openai.com&sz=64",
    notes: "GPT-4 플랜",
    created_at: subtractDays(180),
  },
  {
    id: "sub-004",
    user_id: "user-dummy-001",
    name: "쿠팡 로켓와우",
    category: "SHOPPING",
    amount: 7890,
    billing_cycle: "MONTHLY",
    next_billing_date: addDays(20),
    status: "ACTIVE",
    logo_url: "https://www.google.com/s2/favicons?domain=coupang.com&sz=64",
    notes: null,
    created_at: subtractDays(120),
  },
  {
    id: "sub-005",
    user_id: "user-dummy-001",
    name: "Spotify",
    category: "MUSIC",
    amount: 10900,
    billing_cycle: "MONTHLY",
    next_billing_date: addDays(200),
    status: "PAUSED",
    logo_url: "https://www.google.com/s2/favicons?domain=spotify.com&sz=64",
    notes: "일시정지 중",
    created_at: subtractDays(365),
  },
  {
    id: "sub-006",
    user_id: "user-dummy-001",
    name: "Adobe CC",
    category: "OTHER",
    amount: 29000,
    billing_cycle: "MONTHLY",
    next_billing_date: addDays(30),
    status: "CANCELLED",
    logo_url: "https://www.google.com/s2/favicons?domain=adobe.com&sz=64",
    notes: "해지 완료",
    created_at: subtractDays(240),
  },
]

// --- 영수증 더미 데이터 (3개) ---
// sub-001(Netflix) 영수증 3개
export const DUMMY_RECEIPTS: Receipt[] = [
  {
    id: "receipt-001",
    subscription_id: DUMMY_SUBSCRIPTIONS[0].id, // sub-001
    file_url: "/dummy/receipts/netflix-2024-01.pdf",
    file_name: "영수증_2024년1월.pdf",
    uploaded_at: subtractDays(60),
  },
  {
    id: "receipt-002",
    subscription_id: DUMMY_SUBSCRIPTIONS[0].id, // sub-001
    file_url: "/dummy/receipts/netflix-2024-02.pdf",
    file_name: "영수증_2024년2월.pdf",
    uploaded_at: subtractDays(30),
  },
  {
    id: "receipt-003",
    subscription_id: DUMMY_SUBSCRIPTIONS[0].id, // sub-001
    file_url: "/dummy/receipts/netflix-invoice.pdf",
    file_name: "인보이스.pdf",
    uploaded_at: subtractDays(10),
  },
]

// --- 그룹 더미 데이터 (1개) ---
export const DUMMY_GROUPS: Group[] = [
  {
    id: "group-001",
    name: "구독 그룹",
    owner_id: "user-dummy-001",
    invite_code: "INV-001",
    created_at: subtractDays(30),
  },
]

// --- 그룹 멤버 더미 데이터 (3개) ---
// group-001: user-dummy-001(OWNER), user-dummy-002(MEMBER), user-dummy-003(MEMBER)
export const DUMMY_GROUP_MEMBERS: GroupMember[] = [
  {
    id: "gm-001",
    group_id: "group-001",
    user_id: "user-dummy-001",
    role: "OWNER",
    joined_at: subtractDays(30),
  },
  {
    id: "gm-002",
    group_id: "group-001",
    user_id: "user-dummy-002",
    role: "MEMBER",
    joined_at: subtractDays(28),
  },
  {
    id: "gm-003",
    group_id: "group-001",
    user_id: "user-dummy-003",
    role: "MEMBER",
    joined_at: subtractDays(12),
  },
]

// --- 그룹 구독 더미 데이터 (1개) ---
// 1그룹 1구독 정책 — 그룹당 하나의 공유 구독만 허용
export const DUMMY_GROUP_SUBSCRIPTIONS: GroupSubscription[] = [
  {
    id: "gs-001",
    group_id: "group-001",
    subscription_id: DUMMY_SUBSCRIPTIONS[0].id, // sub-001 (Netflix)
    split_amount: 8500, // 17000 / 2 (멤버 2명 기준)
    payment_status: "PENDING",
    member_split_amounts: {}, // 더미 데이터: 멤버별 정산금 없음
    member_payment_statuses: {}, // 더미 데이터: 멤버별 납부 상태 없음
  },
]

// --- 헬퍼 함수 ---

// id로 특정 구독을 조회 (없으면 undefined 반환)
export function getDummySubscription(id: string): Subscription | undefined {
  return DUMMY_SUBSCRIPTIONS.find((s) => s.id === id)
}

// id로 특정 그룹을 조회 (없으면 undefined 반환)
export function getDummyGroup(id: string): Group | undefined {
  return DUMMY_GROUPS.find((g) => g.id === id)
}
