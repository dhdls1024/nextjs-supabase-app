-- 브라우저 PushSubscription 저장 테이블
-- Web Push API로 받은 endpoint, keys를 저장하여 서버에서 알림 발송 시 사용
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- 사용자별 알림 설정 (1인 1행)
-- enabled: 알림 수신 여부, dday_offset: 결제일 며칠 전 알림 (0=당일, 1=1일전 등)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT false,
  dday_offset INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 본인의 push_subscriptions만 CRUD 가능
CREATE POLICY "본인 push_subscriptions만 관리" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 본인의 notification_preferences만 CRUD 가능
CREATE POLICY "본인 notification_preferences만 관리" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- pg_cron 설정 (Supabase Pro 플랜에서만 지원)
-- 매일 00:00 UTC (09:00 KST)에 Edge Function 호출
-- SELECT cron.schedule(
--   'notify-upcoming-payments',
--   '0 0 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/notify-upcoming-payments',
--     headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
