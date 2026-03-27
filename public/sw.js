// SubTracker Service Worker
// 역할:
//   1. Web Push 알림 수신 및 표시
//   2. 정적 자산 Cache-First 캐싱 (초기 로딩 속도 개선)
//   3. 페이지 요청 Stale-While-Revalidate (오프라인 대응)

// 캐시 버전 — 정적 자산 업데이트 시 이 값을 올려서 이전 캐시를 무효화
const CACHE_VERSION = "v1"

// App Shell 캐시 이름 — 정적 자산 (JS, CSS, 이미지, 폰트)
const STATIC_CACHE = `subtracker-static-${CACHE_VERSION}`

// 페이지 캐시 이름 — HTML 페이지 (Stale-While-Revalidate)
const PAGE_CACHE = `subtracker-pages-${CACHE_VERSION}`

// RSC 데이터 캐시 이름 — /_next/data/ 페이로드 (Stale-While-Revalidate)
// 인증된 사용자 데이터이므로 별도 캐시로 분리해 버전 관리
const RSC_CACHE = `subtracker-rsc-${CACHE_VERSION}`

// RSC 캐시 최대 항목 수 — 페이지마다 캐시가 누적되므로 상한을 둠
const RSC_CACHE_MAX_ENTRIES = 20

// 사전 캐싱할 App Shell 자산 목록
// 앱 최초 진입 시 오프라인에서도 기본 UI를 표시할 수 있도록 함
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
]

// 캐시 대상에서 제외할 경로 패턴
// Supabase API, Next.js 내부 API, 인증 경로는 항상 네트워크에서 가져옴
// /_next/data/ 는 별도 RSC 전략으로 처리하므로 이 목록에서 제외
const BYPASS_PATTERNS = [
  /supabase\.co/,   // Supabase API — 인증 토큰이 포함된 동적 요청
  /\/auth\//,       // 인증 흐름 — 세션 상태 변경이 빈번함
  /\/api\//,        // API 라우트 — 서버 사이드 로직 포함
]

// =============================================
// install 이벤트 — SW 설치 시 App Shell 사전 캐싱
// =============================================
self.addEventListener("install", (event) => {
  // skipWaiting: 기존 SW가 있어도 즉시 활성화 (사용자가 탭을 닫지 않아도 업데이트)
  self.skipWaiting()

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // App Shell 자산을 사전 캐싱 — 실패해도 설치는 진행
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] 사전 캐싱 일부 실패:", err)
      })
    })
  )
})

// =============================================
// activate 이벤트 — 구버전 캐시 정리
// =============================================
self.addEventListener("activate", (event) => {
  // clients.claim: 활성화 즉시 현재 열린 탭 제어권 획득 (새로고침 불필요)
  self.clients.claim()

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          // 현재 버전이 아닌 캐시는 모두 삭제 (RSC_CACHE 포함)
          .filter(
            (name) =>
              name !== STATIC_CACHE &&
              name !== PAGE_CACHE &&
              name !== RSC_CACHE
          )
          .map((name) => caches.delete(name))
      )
    })
  )
})

// =============================================
// fetch 이벤트 — 요청 유형에 따라 캐싱 전략 적용
// =============================================
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // GET 요청만 캐시 처리 (POST 등 변경 요청은 항상 네트워크)
  if (request.method !== "GET") return

  // 제외 패턴에 해당하는 요청은 캐시 없이 네트워크로 직접 전달
  const shouldBypass = BYPASS_PATTERNS.some((pattern) => pattern.test(url.href))
  if (shouldBypass) return

  // RSC 데이터 페이로드 — Stale-While-Revalidate 전략
  // Next.js 15 App Router는 /_next/data/ 대신 ?_rsc= 쿼리 파라미터로 RSC 페이로드 전송
  // 재방문 시 캐시된 데이터를 즉시 보여주고 백그라운드에서 최신 데이터로 갱신
  // GET 요청만 대상 (POST는 이미 위에서 return됨)
  if (url.searchParams.has("_rsc")) {
    event.respondWith(staleWhileRevalidateRsc(request, RSC_CACHE))
    return
  }

  // _next/static: 정적 자산 — Cache-First 전략
  // 한 번 캐시되면 버전이 바뀔 때까지 네트워크 요청 없음
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
    return
  }

  // 이미지, 폰트: Cache-First 전략 (변경 빈도 낮음)
  if (
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
    return
  }

  // HTML 페이지 요청: Stale-While-Revalidate 전략
  // 캐시된 HTML을 즉시 반환 후 백그라운드에서 최신 버전 갱신
  if (request.destination === "document") {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE))
    return
  }
})

// =============================================
// Cache-First 전략
// 캐시에 있으면 캐시 반환, 없으면 네트워크에서 가져와 캐시에 저장
// =============================================
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    // 캐시 히트 — 네트워크 요청 없이 즉시 반환
    return cached
  }

  // 캐시 미스 — 네트워크에서 가져와 캐시에 저장
  try {
    const response = await fetch(request)
    if (response.ok) {
      // 응답을 복제하여 캐시에 저장 (Response는 한 번만 소비 가능)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // 네트워크 실패 시 오프라인 폴백 없음 (정적 자산이므로 브라우저 기본 처리)
    return new Response("Network error", { status: 408 })
  }
}

// =============================================
// Stale-While-Revalidate 전략
// 캐시된 응답을 즉시 반환하고, 백그라운드에서 최신 버전으로 캐시 업데이트
// HTML 페이지에 적용 — 빠른 표시 + 최신성 균형
// =============================================
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // 백그라운드에서 최신 버전 갱신 (결과를 기다리지 않음)
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  // 캐시가 있으면 즉시 반환 (사용자는 이전 버전을 바로 봄)
  // 캐시가 없으면 네트워크 응답을 기다림 (최초 방문 또는 캐시 만료)
  return cached ?? networkPromise
}

// =============================================
// RSC 캐시 항목 수 제한 — 오래된 항목부터 삭제
// 인증된 사용자 데이터가 누적되는 것을 방지하기 위해 LRU 방식으로 상한 유지
// =============================================
async function trimRscCache(cache) {
  const keys = await cache.keys()
  if (keys.length <= RSC_CACHE_MAX_ENTRIES) return

  // 초과분만큼 가장 오래된 항목(앞쪽)을 삭제
  const deleteCount = keys.length - RSC_CACHE_MAX_ENTRIES
  await Promise.all(keys.slice(0, deleteCount).map((key) => cache.delete(key)))
}

// =============================================
// RSC 전용 Stale-While-Revalidate 전략
// 캐시된 RSC 페이로드를 즉시 반환 후 백그라운드에서 갱신
// HTML용 staleWhileRevalidate와 달리 캐시 항목 수 제한 로직 포함
// =============================================
async function staleWhileRevalidateRsc(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // 백그라운드에서 최신 RSC 데이터를 가져와 캐시 갱신
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        // 응답 저장 후 캐시 크기 제한 적용
        cache.put(request, response.clone()).then(() => trimRscCache(cache))
      }
      return response
    })
    .catch(() => cached) // 네트워크 실패 시 캐시 데이터로 폴백

  // 캐시 있으면 즉시 반환 (사용자는 이전 데이터를 바로 봄)
  // 캐시 없으면 네트워크 응답 대기 (최초 방문)
  return cached ?? fetchPromise
}

// =============================================
// push 이벤트 — 서버에서 webpush.sendNotification()으로 알림이 전송될 때 호출
// =============================================
self.addEventListener("push", (event) => {
  // 전송 데이터가 없으면 기본값 사용
  const data = event.data?.json() ?? {}

  // waitUntil로 알림 표시가 완료될 때까지 SW 종료 방지
  event.waitUntil(
    self.registration.showNotification(data.title ?? "SubTracker", {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      // tag으로 동일 알림 중복 방지
      tag: data.tag ?? "subtracker-notification",
      // 클릭 시 이동할 URL을 data에 저장
      data: { url: data.url ?? "/dashboard" },
    })
  )
})

// =============================================
// notificationclick 이벤트 — 사용자가 알림을 클릭했을 때
// =============================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? "/dashboard"

  // 이미 열려있는 탭이 있으면 포커스, 없으면 새 탭 열기
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 같은 origin의 탭이 있으면 해당 탭으로 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }
        // 열린 탭이 없으면 새 창으로 열기
        return clients.openWindow(url)
      })
  )
})
