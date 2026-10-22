// Service worker da Agência LBC: só recebe notificações push (sem cache, pra nunca servir tela velha).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const d = event.data ? event.data.json() : { title: "Agência LBC", body: "" };
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: d.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          w.navigate(url).catch(() => {});
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
