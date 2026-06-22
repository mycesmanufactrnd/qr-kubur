/// <reference types="vite/client" />
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { getStoredGoogleUser } from "../utils/auth";
import { trpcClient } from "../utils/trpc";
import { initFCM, messaging } from "./firebase";

export const useFCM = () => {
  useEffect(() => {
    initFCM().then((token) => {
      if (!token) return;

      // Register for public Google users
      const googleUser = getStoredGoogleUser();
      if (googleUser?.id) {
        trpcClient.google.saveDeviceToken
          .mutate({ googleUserId: googleUser.id, fcmToken: token })
          .catch((e) => console.error("[FCM] saveDeviceToken (google) failed:", e));
      }

      // Register for admin/employee users
      const appUserAuth = sessionStorage.getItem("appUserAuth");
      if (appUserAuth) {
        trpcClient.auth.saveUserDeviceToken
          .mutate({ fcmToken: token })
          .catch((e) => console.error("[FCM] saveUserDeviceToken failed:", e));
      }
    });

    // Foreground message handler — fires when the tab is open and visible.
    // The service worker onBackgroundMessage only fires when the tab is closed/hidden.
    if (Capacitor.isNativePlatform()) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "Notifikasi Baru";
      const body = payload.notification?.body ?? "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    });

    return () => unsubscribe();
  }, []);
};
