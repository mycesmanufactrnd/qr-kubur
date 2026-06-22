import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

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
export const auth = getAuth(app);

/**
 * Requests push notification permission and returns the device/FCM token.
 * - Native (Capacitor): uses @capacitor/push-notifications (no service worker needed).
 * - Web: uses Firebase Web SDK + service worker.
 * Returns null if permission denied or any step fails.
 */
export const initFCM = async (): Promise<string | null> => {
  try {
    if (Capacitor.isNativePlatform()) {
      return await initFCMNative();
    }
    return await initFCMWeb();
  } catch (e) {
    console.error("[FCM] initFCM error:", e);
    return null;
  }
};

async function initFCMNative(): Promise<string | null> {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") {
    console.log("[FCM] Native push permission not granted:", permResult.receive);
    return null;
  }

  await PushNotifications.register();

  return new Promise<string | null>((resolve) => {
    // Timeout so we don't hang forever if the OS never fires the event
    const timer = setTimeout(() => {
      PushNotifications.removeAllListeners();
      console.warn("[FCM] Native registration timed out");
      resolve(null);
    }, 10_000);

    PushNotifications.addListener("registration", (token) => {
      clearTimeout(timer);
      PushNotifications.removeAllListeners();
      localStorage.setItem("fcmToken", token.value);
      resolve(token.value);
    });

    PushNotifications.addListener("registrationError", (err) => {
      clearTimeout(timer);
      PushNotifications.removeAllListeners();
      console.error("[FCM] Native registration error:", err);
      resolve(null);
    });
  });
}

async function initFCMWeb(): Promise<string | null> {
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
}
