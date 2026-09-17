import { Capacitor } from "@capacitor/core";

// Mirrors @capawesome/capacitor-app-update's AppUpdateAvailability enum.
export const AppUpdateAvailability = {
  UNKNOWN: 0,
  UPDATE_NOT_AVAILABLE: 1,
  UPDATE_AVAILABLE: 2,
  UPDATE_IN_PROGRESS: 3,
};

let appUpdatePlugin = null;
async function getAppUpdatePlugin() {
  if (!appUpdatePlugin) {
    ({ AppUpdate: appUpdatePlugin } = await import(
      "@capawesome/capacitor-app-update"
    ));
  }
  return appUpdatePlugin;
}

// android only for now
export async function checkForMandatoryUpdate() {
  if (Capacitor.getPlatform() !== "android") return null;

  try {
    const AppUpdate = await getAppUpdatePlugin();
    const info = await AppUpdate.getAppUpdateInfo();
    if (info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
      return info;
    }
    return null;
  } catch (err) {
    console.warn("[appUpdate] getAppUpdateInfo failed:", err);
    return null;
  }
}

export async function openAppStoreListing() {
  try {
    const AppUpdate = await getAppUpdatePlugin();
    await AppUpdate.openAppStore();
  } catch (err) {
    console.error("[appUpdate] openAppStore failed:", err);
  }
}
