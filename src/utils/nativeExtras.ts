import { registerPlugin } from "@capacitor/core";

// App-local native plugin: capacitor/android/app/src/main/java/com/myces/qubur/NativeExtrasPlugin.java
type NativeExtrasPlugin = {
  requestLocationPermission(): Promise<{ granted: boolean }>;
  checkLocationPermission(): Promise<{ granted: boolean }>;
  saveToDownloads(options: {
    filename: string;
    data: string; // base64, no data: prefix
    mimeType: string;
    notificationBody: string;
    channelName: string;
  }): Promise<{ uri: string; filename: string }>;
};

export const NativeExtras = registerPlugin<NativeExtrasPlugin>("NativeExtras");
