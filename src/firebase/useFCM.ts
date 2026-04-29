/// <reference types="vite/client" />
import { useEffect } from "react";
import { getStoredGoogleUser } from "../utils/auth";
import { trpcClient } from "../utils/trpc";
import { initFCM } from "./firebase";

export const useFCM = () => {
  useEffect(() => {
    const googleUser = getStoredGoogleUser();
    if (!googleUser?.id) return;

    // Always refresh — FCM tokens rotate; stale tokens silently stop receiving pushes.
    initFCM().then((token) => {
      if (!token) return;
      trpcClient.google.saveDeviceToken
        .mutate({ googleUserId: googleUser.id, fcmToken: token })
        .catch((e) => console.error("[FCM] saveDeviceToken failed:", e));
    });
  }, []);
};
