// @ts-nocheck
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { translate } from "@/utils/translations";
import { useLoginGoogle } from "@/utils/auth";

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Reusable "sign in with Google" dialog gate. The caller decides what
 * happens on success (onLoginSuccess receives the freshly authenticated
 * google user) — this component only handles the dialog UI and sign-in flow.
 */
export default function GoogleSignInDialog({
  open,
  onOpenChange,
  message,
  onLoginSuccess,
}) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  const { login, loading: loggingIn, error: loginError } = useLoginGoogle({
    redirectOnSuccess: false,
    onLoginSuccess: (user) => {
      onOpenChange(false);
      onLoginSuccess?.(user);
    },
  });

  const handleGoogleSignIn = async () => {
    setSignInError("");
    setIsSigningIn(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } =
        await import("firebase/auth");
      const { auth } = await import("@/firebase/firebase");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseIdToken = await result.user.getIdToken();
      login(firebaseIdToken);
    } catch (e) {
      const cancelled =
        e?.code === "auth/popup-closed-by-user" ||
        e?.code === "auth/cancelled-popup-request";
      if (!cancelled) setSignInError(e?.message || String(e));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{translate("Sign in required")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <button
          type="button"
          disabled={loggingIn || isSigningIn}
          onClick={handleGoogleSignIn}
          className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
        >
          <GoogleIcon className="w-4 h-4" />
          {loggingIn || isSigningIn
            ? translate("Logging in") + "..."
            : translate("Sign in with Google")}
        </button>
        {(signInError || loginError) && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-2.5">
            {signInError || loginError}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
