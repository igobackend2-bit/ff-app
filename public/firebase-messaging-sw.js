// Firebase Cloud Messaging Service Worker
// Skill #10 — PWA push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config is injected at runtime via postMessage
// to avoid exposing keys in static files
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon, data } = payload.notification ?? {};

      self.registration.showNotification(title ?? 'Farmers Factory', {
        body: body ?? 'Your order is on its way!',
        icon: icon ?? '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: data?.orderId ?? 'ff-notification',
        data: data ?? {},
        actions: [
          { action: 'view', title: 'View Order' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' && event.notification.data?.orderId) {
    const url = `/account/orders/${event.notification.data.orderId}`;
    event.waitUntil(clients.openWindow(url));
  }
});
