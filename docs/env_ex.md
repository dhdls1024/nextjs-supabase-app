# 환경 변수 설정 가이드

SubTracker 앱 배포 시 필요한 환경 변수 목록입니다.

---

## 로컬 개발 (`.env.local`)

```env
# ───────────────────────────────────────────
# Supabase 연동 (필수)
# ───────────────────────────────────────────

# Supabase 프로젝트 URL (대시보드 > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Supabase anon/public 키 (대시보드 > Settings > API)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service_role 키 — 절대 클라이언트에 노출 금지
# Cron Route Handler에서 RLS 우회용으로만 사용
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ───────────────────────────────────────────
# Web Push 알림 (VAPID) — 알림 기능 사용 시 필수
# ───────────────────────────────────────────

# VAPID 키 생성 방법 (최초 1회):
#   npx web-push generate-vapid-keys

# VAPID 공개 키 — 브라우저 PushManager.subscribe()에 전달
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BExamplePublicKey...

# VAPID 공개 키 — 서버 측 webpush 라이브러리 인증용
VAPID_PUBLIC_KEY=BExamplePublicKey...

# VAPID 비공개 키 — 서버 측 webpush 서명용, 절대 노출 금지
VAPID_PRIVATE_KEY=ExamplePrivateKey...

# VAPID 연락처 이메일 — 푸시 서비스가 문제 발생 시 연락하는 이메일
VAPID_EMAIL=mailto:admin@subtracker.app

# ───────────────────────────────────────────
# Vercel Cron 보안 (Cron 기능 사용 시 필수)
# ───────────────────────────────────────────

# Cron Route Handler 인증 토큰 — 무단 호출 방지
# 생성 방법: openssl rand -base64 32
CRON_SECRET=your-random-secret-token
```

---

## Vercel 프로덕션 환경 변수

Vercel 대시보드 > Project > Settings > Environment Variables 에서 아래 8개를 등록합니다.

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Supabase anon/public 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Cron Route Handler 서비스 역할 키 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production, Preview, Development | 클라이언트 Push 구독 등록용 |
| `VAPID_PUBLIC_KEY` | Production, Preview | 서버 측 webpush 인증용 |
| `VAPID_PRIVATE_KEY` | Production, Preview | 서버 측 webpush 서명용 |
| `VAPID_EMAIL` | Production, Preview | VAPID 연락처 이메일 |
| `CRON_SECRET` | Production, Preview | Vercel Cron 요청 인증 토큰 |

---

## 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`은 서버 전용 변수입니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`와 `VAPID_PUBLIC_KEY`는 동일한 값입니다.
- `.env.local` 파일은 `.gitignore`에 포함되어 있으므로 절대 커밋하지 마세요.
