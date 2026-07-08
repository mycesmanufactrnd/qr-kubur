import { Capacitor } from '@capacitor/core';
import { trpcClient } from '@/utils/trpc';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // give up after 10 minutes

// Maps OnlineTransaction.gatewaystatus (set from ToyyibPay's server-to-server
// callback) to the same "Success" / "Pending" / "Unsuccessful" strings the
// pages already derive from `paymentToyyibStatus[status_id]` on web.
function mapGatewayStatus(gatewaystatus?: string | null): string | null {
  if (gatewaystatus === 'success') return 'Success';
  if (gatewaystatus === 'unsuccessful') return 'Unsuccessful';
  if (gatewaystatus === 'pending') return 'Pending';
  return null;
}

type OpenPaymentUrlOptions = {
  /** Our app's own reference number for the bill (e.g. "DON-2026-0001"). */
  orderNo?: string;
  /**
   * Native only: called once the payment reaches a terminal state ("Success"
   * / "Unsuccessful"), or with `null` if the user closed the in-app browser
   * before that happened (or polling timed out). Never called on web — on
   * web, ToyyibPay's redirect back to `returnUrl?status_id=...` reloads the
   * page instead, which pages already handle via `useSearchParams`.
   */
  onStatus?: (statusText: string | null) => void;
};

/**
 * Opens a payment gateway URL.
 * - Web: standard window.location navigation (existing behaviour).
 * - Native (Capacitor): opens the URL in an in-app browser overlay via
 *   @capacitor/browser. ToyyibPay's return redirect happens inside that
 *   separate overlay, not the app's own WebView, so the app can never see
 *   `status_id` in its own URL there. Instead, when `orderNo` + `onStatus`
 *   are provided, this polls the backend — which ToyyibPay always notifies
 *   server-to-server via the payment callback webhook, independent of the
 *   overlay — until the payment reaches a terminal status, then closes the
 *   overlay itself and reports the result.
 */
export async function openPaymentUrl(
  url: string,
  { orderNo, onStatus }: OpenPaymentUrlOptions = {},
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.href = url;
    return;
  }

  const { Browser } = await import('@capacitor/browser');

  let settled = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const finish = (statusText: string | null) => {
    if (settled) return;
    settled = true;
    if (pollTimer) clearInterval(pollTimer);
    Browser.removeAllListeners('browserFinished');
    onStatus?.(statusText);
  };

  Browser.addListener('browserFinished', () => finish(null));

  await Browser.open({ url });

  if (orderNo && onStatus) {
    const startedAt = Date.now();
    pollTimer = setInterval(async () => {
      if (settled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        finish(null);
        return;
      }
      try {
        const transaction =
          await trpcClient.toyyibPay.getTransactionStatusByOrderNo.query({
            orderNo,
          });
        const statusText = mapGatewayStatus(transaction?.gatewaystatus);
        if (statusText === 'Success' || statusText === 'Unsuccessful') {
          finish(statusText);
          await Browser.close();
        }
      } catch {
        // transient network error while polling — keep trying until timeout
      }
    }, POLL_INTERVAL_MS);
  }
}
