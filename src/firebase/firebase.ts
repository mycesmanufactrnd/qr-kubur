import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

export { getToken };

const firebaseConfig = {
  apiKey: "AIzaSyA1mnqTzd0xkTcuQeKCmKfxne86agVcfRw",
  authDomain: "myces-qr-kubur.firebaseapp.com",
  projectId: "myces-qr-kubur",
  storageBucket: "myces-qr-kubur.firebasestorage.app",
  messagingSenderId: "681335807437",
  appId: "1:681335807437:web:2093110bbc258bd706f884",
  measurementId: "G-M201KH668N",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

/**
 * Requests notification permission, registers the service worker,
 * and returns the FCM token. Works on both localhost and production (HTTPS).
 * Returns null if permission denied, SW not supported, or VAPID key missing.
 */
export const initFCM = async (): Promise<string | null> => {
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("[FCM] VITE_FIREBASE_VAPID_KEY is not set");
      return null;
    }

    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      console.warn("[FCM] Service workers or Notifications not supported");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] Notification permission:", permission);
      return null;
    }

    // Register the SW, then wait for it to be active before calling getToken.
    // navigator.serviceWorker.ready resolves only once a SW is fully active.
    await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      localStorage.setItem("fcmToken", token);
      return token;
    }

    console.warn("[FCM] No token returned — check VAPID key and Firebase Console settings");
    return null;
  } catch (e) {
    console.error("[FCM] initFCM error:", e);
    return null;
  }
};
