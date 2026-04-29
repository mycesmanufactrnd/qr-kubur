importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA1mnqTzd0xkTcuQeKCmKfxne86agVcfRw",
  authDomain: "myces-qr-kubur.firebaseapp.com",
  projectId: "myces-qr-kubur",
  storageBucket: "myces-qr-kubur.firebasestorage.app",
  messagingSenderId: "681335807437",
  appId: "1:681335807437:web:2093110bbc258bd706f884",
});

const messaging = firebase.messaging();

// Handle background push notifications (app not in foreground)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Notifikasi Baru";
  const options = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

// When user taps the notification, navigate to the URL set by the backend (data.url)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickPath = event.notification.data?.url;
  const url = clickPath
    ? `${self.location.origin}${clickPath}`
    : self.location.origin;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus and navigate it
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.focus();
            return client.navigate(url);
          }
        }
        // Otherwise open a new tab
        return clients.openWindow(url);
      })
  );
});
