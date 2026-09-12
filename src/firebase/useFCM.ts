/// <reference types="vite/client" />
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { getStoredGoogleUser } from "../utils/auth";
import { trpcClient } from "../utils/trpc";
import { initFCM, messaging } from "./firebase";

const saveToken = (token: string) => {
  const googleUser = getStoredGoogleUser();
  if (googleUser?.id) {
    trpcClient.google.saveDeviceToken
      .mutate({ googleUserId: googleUser.id, fcmGoogleToken: token })
      .catch((e) => console.error("[FCM] saveDeviceToken (google) failed:", e));
  }

  const appUserAuth = sessionStorage.getItem("appUserAuth");
  if (appUserAuth) {
    trpcClient.auth.saveUserDeviceToken
      .mutate({ fcmToken: token })
      .catch((e) => console.error("[FCM] saveUserDeviceToken failed:", e));
  }
};

export const useFCM = () => {
  useEffect(() => {
    // Register token on mount
    initFCM().then((token) => { if (token) saveToken(token); });

    // Re-register on visibility — Firebase silently rotates tokens on mobile.
    // Each time the user opens the tab/app we sync the latest token to the DB.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        initFCM().then((token) => { if (token) saveToken(token); });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Foreground message handler — fires when the tab is open and visible.
    // Uses SW registration.showNotification() so the notificationclick handler
    // (tap-to-navigate) works the same as background notifications.
    if (Capacitor.isNativePlatform()) {
      let receivedHandle: { remove: () => void } | undefined;
      let actionHandle: { remove: () => void } | undefined;

      import("@capacitor/push-notifications").then(({ PushNotifications }) => {
        // Foreground — Android doesn't auto-show a system notification while the
        // app is open (that's normal FCM behavior), so best-effort surface it here.
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          const data = notification.data ?? {};
          const title = data.title || notification.title || "Notifikasi Baru";
          const body = data.body || notification.body || "";
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(title, { body }); } catch { /* not supported in this WebView */ }
          }
        }).then((handle) => { receivedHandle = handle; });

        // Tap on a notification in the system tray — mirrors the web
        // notificationclick handler below (navigate to data.url).
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const url = action.notification?.data?.url;
          if (url) window.location.assign(url);
        }).then((handle) => { actionHandle = handle; });
      });

      return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        receivedHandle?.remove();
        actionHandle?.remove();
      };
    }

    const unsubscribe = onMessage(messaging, async (payload) => {
      if (Notification.permission !== "granted") return;
      const title = payload.data?.title ?? "Notifikasi Baru";
      const body = payload.data?.body ?? "";
      const data = payload.data ?? {};
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, { body, icon: "/favicon.ico", data });
      } catch {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      unsubscribe();
    };
  }, []);
};
