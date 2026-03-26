// SubTracker Service Worker — Web Push 알림 수신 처리
// 브라우저가 백그라운드에서도 푸시 알림을 받을 수 있도록 처리

// push 이벤트: 서버에서 webpush.sendNotification()으로 알림이 전송될 때 호출
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

// notificationclick 이벤트: 사용자가 알림을 클릭했을 때
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
