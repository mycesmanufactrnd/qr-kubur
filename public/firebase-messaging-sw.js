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
