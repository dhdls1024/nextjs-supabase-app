-- SubTracker 전체 스키마 DDL
-- 테이블 생성 순서: 외래키 의존성 순으로 작성

-- ============================================================
-- 1. subscriptions 테이블
--    user_id → auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('OTT', 'AI', 'SHOPPING', 'MUSIC', 'OTHER')),
  amount NUMERIC(10, 2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
  next_billing_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED')),
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. receipts 테이블
--    subscription_id → subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. groups 테이블
--    owner_id → auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. group_members 테이블
--    group_id → groups, user_id → auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'MEMBER')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- ============================================================
-- 5. group_subscriptions 테이블
--    group_id → groups, subscription_id → subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS group_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  split_amount NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID')),
  UNIQUE (group_id, subscription_id)
);

-- ============================================================
-- Views
-- ============================================================

-- category_monthly_stats: 카테고리별 월 총 지출 집계
-- 사용자별 구독 금액을 카테고리·월 단위로 집계하여 분석에 활용
CREATE OR REPLACE VIEW category_monthly_stats AS
SELECT
  s.user_id,
  s.category,
  TO_CHAR(s.next_billing_date, 'YYYY-MM') AS month,
  SUM(s.amount) AS total_amount
FROM subscriptions s
WHERE s.status = 'ACTIVE'
GROUP BY s.user_id, s.category, TO_CHAR(s.next_billing_date, 'YYYY-MM');

-- monthly_trend_stats: 최근 6개월 월별 지출 트렌드
-- 사용자별 최근 6개월간 월 총 지출을 집계하여 트렌드 차트에 활용
CREATE OR REPLACE VIEW monthly_trend_stats AS
SELECT
  s.user_id,
  TO_CHAR(s.next_billing_date, 'YYYY-MM') AS month,
  SUM(s.amount) AS total_amount
FROM subscriptions s
WHERE
  s.status = 'ACTIVE'
  AND s.next_billing_date >= (CURRENT_DATE - INTERVAL '6 months')
GROUP BY s.user_id, TO_CHAR(s.next_billing_date, 'YYYY-MM')
ORDER BY month;

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인 구독이거나, group_subscriptions를 통해 같은 그룹 멤버인 경우 조회 가능
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_subscriptions gs
      WHERE gs.subscription_id = subscriptions.id
        AND is_group_member(gs.group_id)
    )
  );

CREATE POLICY "subscriptions_insert" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- receipts RLS
-- receipt의 subscription이 현재 사용자 소유인지 확인
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select" ON receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = receipts.subscription_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "receipts_insert" ON receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = receipts.subscription_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "receipts_delete" ON receipts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = receipts.subscription_id AND s.user_id = auth.uid()
    )
  );

-- groups RLS
-- 오너이거나 멤버인 경우, 또는 초대 코드로 참여하려는 로그인 사용자 접근 허용
-- is_group_member SECURITY DEFINER 함수로 group_members 직접 조회 (재귀 방지)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER 함수: RLS 정책 내 재귀 없이 그룹 멤버 여부 확인
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

-- SECURITY DEFINER 함수: RLS 정책 내 재귀 없이 그룹 오너 여부 확인
CREATE OR REPLACE FUNCTION is_group_owner(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups
    WHERE id = p_group_id AND owner_id = auth.uid()
  );
$$;

CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    auth.uid() = owner_id
    OR is_group_member(id)
    OR (auth.uid() IS NOT NULL AND invite_code IS NOT NULL)
  );

CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (auth.uid() = owner_id);

-- group_members RLS
-- 자기 자신이거나, 같은 그룹의 오너/멤버인 경우 조회 가능
-- is_group_owner/is_group_member SECURITY DEFINER 함수로 재귀 방지
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_group_owner(group_id)
    OR is_group_member(group_id)
  );

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
    OR auth.uid() = group_members.user_id
  );

CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
    OR auth.uid() = group_members.user_id
  );

-- group_subscriptions RLS
-- 해당 그룹의 멤버만 접근 가능
ALTER TABLE group_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_subscriptions_select" ON group_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_subscriptions.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_subscriptions_insert" ON group_subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_subscriptions.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_subscriptions_update" ON group_subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_subscriptions.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_subscriptions_delete" ON group_subscriptions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_subscriptions.group_id AND g.owner_id = auth.uid()
    )
  );
