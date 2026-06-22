import { Capacitor } from '@capacitor/core';

/**
 * Opens a payment gateway URL.
 * - Native (Capacitor): uses @capacitor/browser in-app overlay so the user never
 *   leaves the app. Calls `onBrowserFinished` when the overlay is closed.
 * - Web: standard window.location navigation (existing behaviour).
 */
export async function openPaymentUrl(
  url: string,
  onBrowserFinished?: () => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.href = url;
    return;
  }

  const { Browser } = await import('@capacitor/browser');

  if (onBrowserFinished) {
    Browser.addListener('browserFinished', () => {
      Browser.removeAllListeners('browserFinished');
      onBrowserFinished();
    });
  }

  await Browser.open({ url });
}
