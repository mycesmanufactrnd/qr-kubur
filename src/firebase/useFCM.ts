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
      .mutate({ googleUserId: googleUser.id, fcmToken: token })
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
      return () => document.removeEventListener("visibilitychange", handleVisibility);
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
