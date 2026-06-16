# Google Sign-In Flow

## Overview

Sign-in is Firebase-based end-to-end. The frontend gets a **Firebase ID token** (not a raw Google OAuth token) and the backend verifies it with Firebase Admin SDK.

Two entry paths share the same backend:
- **Web browser** — `signInWithPopup` via Firebase Web SDK
- **Native / Capacitor** — `FirebaseAuthentication` Capacitor plugin

---

## Entry Points (UI)

| View | File |
|------|------|
| Mobile | `src/pages/Mobile/SettingsPage.jsx` |
| Desktop | `src/pages/SettingsPage.jsx` |

Both pages render a "Sign in with Google" button only when `authMode === "guest"`.

---

## Step-by-Step Flow

### Step 1 — User clicks "Sign in with Google"

**File:** `src/pages/Mobile/SettingsPage.jsx` or `src/pages/SettingsPage.jsx`

**Function:** `handleGoogleSignIn()`

```js
const handleGoogleSignIn = async () => { ... }
```

Branches on `isWebView` (mobile only):
```js
const isWebView = /wv/i.test(navigator.userAgent) || !!window.Capacitor?.isNativePlatform?.();
```

---

### Step 2a — Web browser path

**Dynamic imports (lazy, not in initial bundle):**
```js
const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
const { auth } = await import("@/firebase/firebase");
```

**File:** `src/firebase/firebase.ts`

**Imports used in firebase.ts:**
```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
```

**Exported:**
```ts
export const auth = getAuth(app);
```

**Config (hardcoded in firebase.ts — no env):**
```ts
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "myces-qr-kubur.firebaseapp.com",
  projectId: "myces-qr-kubur",
  ...
};
```

**Firebase popup opens:**
```js
const result = await signInWithPopup(auth, new GoogleAuthProvider());
```

Firebase handles the Google OAuth popup internally. On success, result contains the signed-in Firebase user.

**Get Firebase ID token:**
```js
const firebaseIdToken = await result.user.getIdToken();
```

This is a short-lived JWT issued by Firebase (not Google directly). `aud` = Firebase project ID.

---

### Step 2b — Native / Capacitor path (mobile only)

```js
const FirebaseAuth = window.Capacitor?.Plugins?.FirebaseAuthentication;
const result = await FirebaseAuth.signInWithGoogle();
const firebaseIdToken = result?.credential?.idToken;
```

Uses the `@capacitor-firebase/authentication` native plugin. The token format is identical to 2a — a Firebase ID token.

---

### Step 3 — Call `login(firebaseIdToken)`

**File:** `src/utils/auth.ts`

**Hook:** `useLoginGoogle()`

**Imports:**
```ts
import { trpc } from "./trpc";
import { useNavigate } from "react-router-dom";
```

**Function:**
```ts
export function useLoginGoogle() {
  const loginGoogleMutation = trpc.auth.loginGoogle.useMutation({
    onSuccess: (data) => {
      setStoredGoogleAuth(data.user);
      navigate(createPageUrl("UserDashboard"));
    },
    onError: (err) => { setError(err.message); },
  });

  const login = (credential: any) => {
    loginGoogleMutation.mutate({ credential });
  };

  return { login, loading, error };
}
```

Sends the Firebase ID token to the backend via tRPC.

---

### Step 4 — Backend: verify Firebase ID token

**File:** `backend/src/routers/authRouter.ts`

**Imports:**
```ts
import { verifyFirebaseIdToken } from "../services/firebase.service.js";
```

**Mutation:**
```ts
loginGoogle: publicProcedure
  .input(z.object({ credential: z.string() }))
  .mutation(async ({ input }) => {
    const decoded = await verifyFirebaseIdToken(input.credential);
    if (!decoded?.email) throw new Error("Invalid Google token");
    const { email, name, picture } = decoded;
    // look up or create GoogleUser in DB
    return { user, message: "Public login successful - no token required" };
  })
```

---

### Step 5 — Firebase Admin verification

**File:** `backend/src/services/firebase.service.ts`

**Imports:**
```ts
import admin from "firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";
```

**Initialisation (runs at module load):**
```ts
const initFirebase = () => {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
};
initFirebase();
```

**Function:**
```ts
export const verifyFirebaseIdToken = async (idToken: string): Promise<DecodedIdToken> => {
  return admin.auth().verifyIdToken(idToken);
};
```

Verifies signature, expiry, and that the token belongs to the Firebase project.
Returns `{ email, name, picture, uid, ... }`.

---

### Step 6 — Store user, navigate

Back in `useLoginGoogle.onSuccess`:

**File:** `src/utils/auth.ts`

**Function:**
```ts
export function setStoredGoogleAuth(user: any, token?: string | null) {
  localStorage.setItem("googleAuth", JSON.stringify(user));
  sessionStorage.setItem("googleAuth", JSON.stringify(user));
  localStorage.removeItem("googleSignedOut");
}
```

User is stored in `localStorage` and `sessionStorage` under key `googleAuth`.

Navigate → `UserDashboard`.

---

## Environment Variables Used

| Variable | Where | Purpose |
|----------|-------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | `backend/src/services/firebase.service.ts` | Firebase Admin SDK init — used to verify ID tokens AND send FCM push notifications |
| `VITE_FIREBASE_VAPID_KEY` | `src/firebase/firebase.ts` → `initFCM()` | FCM push notification registration (unrelated to sign-in) |

---

## Files Involved

```
src/
  pages/
    SettingsPage.jsx               ← desktop sign-in UI + handleGoogleSignIn
    Mobile/SettingsPage.jsx        ← mobile sign-in UI + handleGoogleSignIn (+ native branch)
  firebase/
    firebase.ts                    ← Firebase app init, exports auth + messaging
  utils/
    auth.ts                        ← useLoginGoogle hook, setStoredGoogleAuth, getStoredGoogleUser

backend/src/
  routers/authRouter.ts            ← loginGoogle tRPC mutation
  services/firebase.service.ts     ← verifyFirebaseIdToken, Firebase Admin init + FCM
```

---

## Auth State Storage

| Key | Storage | Value |
|-----|---------|-------|
| `googleAuth` | `localStorage` + `sessionStorage` | `{ email, name, picture, id }` |
| `googleSignedOut` | `localStorage` | `"1"` when explicitly signed out |

Read via `getStoredGoogleUser()` in `src/utils/auth.ts`.
