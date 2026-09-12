import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";

/**
 * Biometric unlock never stores the account password. It stores the refresh
 * token (7-day JWT, same one auth.refresh already accepts) in the device's
 * secure storage (Android Keystore-backed), gated behind fingerprint/face.
 * A revoked/expired refresh token just falls back to the password form —
 * no long-lived secret sits on the device.
 */
const BIOMETRIC_SERVER = "qr-kubur-admin";
const BIOMETRIC_ENABLED_KEY = "biometricLoginEnabled";
const BIOMETRIC_USERNAME_KEY = "biometricLoginUsername";

export function isBiometricNative() {
  return Capacitor.isNativePlatform();
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isBiometricNative()) return false;
  try {
    const result = await NativeBiometric.isAvailable();
    return !!result.isAvailable;
  } catch {
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "1";
}

export function getBiometricUsername(): string | null {
  return localStorage.getItem(BIOMETRIC_USERNAME_KEY);
}

/**
 * Call after a successful password login (when the user opts in) to save the
 * refresh token behind a biometric prompt, so next time they can skip the password.
 */
export async function enableBiometricLogin(
  username: string,
  refreshToken: string,
): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;

  try {
    await NativeBiometric.verifyIdentity({
      reason: "Confirm your identity to enable fingerprint/face login",
      title: "Enable biometric login",
    });

    await NativeBiometric.setCredentials({
      username,
      password: refreshToken,
      server: BIOMETRIC_SERVER,
    });

    localStorage.setItem(BIOMETRIC_ENABLED_KEY, "1");
    localStorage.setItem(BIOMETRIC_USERNAME_KEY, username);
    return true;
  } catch {
    return false;
  }
}

export async function disableBiometricLogin(): Promise<void> {
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_USERNAME_KEY);
  if (!isBiometricNative()) return;
  try {
    await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
  } catch {
    // Nothing stored / already cleared — fine to ignore.
  }
}

/**
 * Prompts the fingerprint/face verification, then returns the stored refresh
 * token so the caller can exchange it via auth.refresh (same as a normal
 * session refresh — no password ever leaves the device).
 */
export async function getBiometricRefreshToken(): Promise<string | null> {
  if (!isBiometricEnabled() || !(await isBiometricAvailable())) return null;

  try {
    await NativeBiometric.verifyIdentity({
      reason: "Log in with fingerprint or face",
      title: "Biometric login",
    });

    const credentials = await NativeBiometric.getCredentials({
      server: BIOMETRIC_SERVER,
    });

    return credentials.password || null;
  } catch {
    return null;
  }
}
