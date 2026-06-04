/* Imported into Workbox service worker (next-pwa). Handles Web Push display + click. */

self.addEventListener('push', event => {
  const fallback = { title: 'Selbstwirksamkeit', body: '', url: '/' }
  let payload = fallback
  try {
    if (event.data) payload = { ...fallback, ...event.data.json() }
  } catch {
    /* ignore */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || fallback.title, {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    }),
  )
})
