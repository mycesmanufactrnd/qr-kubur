/// <reference types="vite/client" />
import { useEffect } from "react";
import { getStoredGoogleUser } from "../utils/auth";
import { trpcClient } from "../utils/trpc";
import { initFCM } from "./firebase";

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
  }, []);
};
