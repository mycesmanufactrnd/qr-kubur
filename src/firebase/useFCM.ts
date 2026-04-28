/// <reference types="vite/client" />
import { useEffect } from "react";
import { getStoredGoogleUser } from "../utils/auth";
import { trpcClient } from "../utils/trpc";
import { messaging, getToken } from "./firebase";

export const useFCM = () => {
  useEffect(() => {
    const googleUser = getStoredGoogleUser();
    if (!googleUser?.id) return;

    const registeredKey = `fcmReg_${googleUser.id}`;
    if (localStorage.getItem(registeredKey)) return;

    const register = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (!token) return;

        localStorage.setItem("fcmToken", token);

        await trpcClient.google.saveDeviceToken.mutate({
          googleUserId: googleUser.id,
          fcmToken: token,
        });

        localStorage.setItem(registeredKey, "1");
      } catch (e) {
        console.error("[FCM] Registration failed:", e);
      }
    };

    register();
  }, []);
};
