// @ts-nocheck
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocationContext } from "@/providers/LocationProvider";
import { initFCM } from "@/firebase/firebase";
import { saveToken } from "@/firebase/useFCM";
import { NativeExtras } from "@/utils/nativeExtras";
import {
  isOnboardingPermissionsDone,
  markOnboardingPermissionsDone,
} from "@/utils/onboarding";

// Module-level so a remount (or React StrictMode's double effect in dev)
// can't start a second, overlapping set of prompts.
let started = false;

/**
 * Fresh install only: once UserDashboard is on screen, ask for location, and
 * the moment the user answers that dialog, ask for notifications. Android can
 * only show one permission dialog at a time — a second request fired while
 * the first is still up gets silently dropped — so the second prompt waits
 * for the user's actual answer, not a timer or a GPS fix.
 *
 * Returning users skip all of this; whatever they chose is already decided.
 */
export function useFirstInstallPermissions() {
  const { requestLocation } = useLocationContext();

  useEffect(() => {
    if (started || isOnboardingPermissionsDone()) return;
    started = true;

    (async () => {
      if (Capacitor.isNativePlatform()) {
        // Resolves only after the user taps Allow / Deny.
        await NativeExtras.requestLocationPermission().catch((err) => {
          console.error("[onboarding] location permission request failed:", err);
        });
      }

      // Already answered above, so this won't prompt again on native — it
      // just starts the GPS lookup in the background. Not awaited: a GPS fix
      // can take many seconds and the notification prompt shouldn't wait on it.
      requestLocation({ forceRefresh: true });

      const token = await initFCM();
      if (token) saveToken(token);

      markOnboardingPermissionsDone();
    })();
  }, [requestLocation]);
}
