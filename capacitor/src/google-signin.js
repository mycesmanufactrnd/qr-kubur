import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const LIVE_URL = 'https://qubur.mycesgroup.com';

function isCapacitor() {
  return typeof window !== 'undefined' && !!(window.Capacitor?.isNativePlatform?.());
}

export async function googleSignIn() {
  if (!isCapacitor()) {
    // Running in a normal browser — fall through to your existing web sign-in flow.
    return null;
  }

  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result.credential?.idToken;

  if (!idToken) {
    throw new Error('Google sign-in succeeded but no ID token was returned.');
  }

  // Hand the token to the live web app so it can exchange it server-side.
  const redirectUrl = new URL(LIVE_URL);
  redirectUrl.searchParams.set('google_credential', idToken);
  window.location.href = redirectUrl.toString();
}
