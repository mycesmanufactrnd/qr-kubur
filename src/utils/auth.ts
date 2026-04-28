import { createPageUrl } from './index';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc, trpcClient } from './trpc';
import { STATES_MY } from './enums';
import { useNavigate } from 'react-router-dom';
import { captureError } from './helpers';

const GOOGLE_AUTH_KEY = "googleAuth";
const GOOGLE_SIGNED_OUT_KEY = "googleSignedOut";
// Updated token storage strategy - tokens now in httpOnly cookies by default
// These keys kept for backward compatibility and fallback
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * Primary auth is via httpOnly cookies (automatic)
 * This is backup for scenarios where cookies aren't available
 */
const storeTokensFallback = (accessToken: string, refreshToken: string) => {
  // Only store in sessionStorage as fallback, never expose in localStorage
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokensFallback = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

const getStoredTokensFallback = () => {
  return {
    accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY),
  };
};

export function getStoredGoogleUser(): any | null {
  try {
    const raw = localStorage.getItem(GOOGLE_AUTH_KEY) ?? sessionStorage.getItem(GOOGLE_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredGoogleAuth(user: any, token?: string | null) {
  localStorage.setItem(GOOGLE_AUTH_KEY, JSON.stringify(user));
  sessionStorage.setItem(GOOGLE_AUTH_KEY, JSON.stringify(user));
  localStorage.removeItem(GOOGLE_SIGNED_OUT_KEY);

  if (token) {
    // Keep token in both for backward compatibility; TRPC headers prefer sessionStorage first.
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function clearStoredGoogleAuth() {
  localStorage.removeItem(GOOGLE_AUTH_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_KEY);
  // Ensure Google sign-out is a complete app sign-out even when we fall back to Bearer tokens.
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearTokensFallback();
  localStorage.setItem(GOOGLE_SIGNED_OUT_KEY, "1");
}

export function isGoogleSignedOut() {
  return localStorage.getItem(GOOGLE_SIGNED_OUT_KEY) === "1";
}

export function handleLoginTRPC() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      try {
        /**
         * Store tokens as fallback in sessionStorage
         * Primary authentication is via httpOnly cookies set by server
         * These are backup in case cookies aren't available
         */
        storeTokensFallback(data.accessToken, data.refreshToken);

        sessionStorage.setItem("clientIP", data.clientIp);
        sessionStorage.setItem("appUserAuth", JSON.stringify(data));

        const permissions = await trpcClient.permission.getByUser.query({ userId: data.id });
        sessionStorage.setItem("permissions", JSON.stringify(permissions));

        if (data.role === "superadmin") {
          window.location.href = createPageUrl("SuperadminDashboard");
          return;
        }

        // Tahfiz admins go to Tahfiz dashboard; employee/admin roles go to Admin dashboard even without org linkage.
        if (data.tahfizcenter) {
          window.location.href = createPageUrl("TahfizDashboard");
          return;
        }

        if (data.role === "admin" || data.role === "employee" || data.organisation) {
          window.location.href = createPageUrl("AdminDashboard");
          return;
        }

        // Login succeeded but user isn't configured for admin access.
        sessionStorage.removeItem("appUserAuth");
        sessionStorage.removeItem("permissions");
        clearTokensFallback();
        setError("Your account is not set up for admin access.");
      } catch (e: any) {
        captureError("Login failed", { action: "login" }, { message: e?.message });
        console.error(e);
        sessionStorage.removeItem("appUserAuth");
        sessionStorage.removeItem("permissions");
        clearTokensFallback();
        setError(e?.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      captureError("Login failed", { action: "login" }, { message: err.message });
      console.error(err);
      setError(err.message || "Login failed");
      setLoading(false);
    },
  });

  const login = (email: string, password: string) => {
    setError("");
    setLoading(true);
    loginMutation.mutate({ email, password });
  };

  return { login, loading, error, setError };
}

/**
 * Token rotation ensures old refresh tokens can't be reused
 * Should be called automatically when access token expires
 */
export async function refreshAccessToken() {
  try {
    const { refreshToken } = getStoredTokensFallback();
    
    if (!refreshToken) {
      console.warn("No refresh token available");
      return null;
    }

    const response = await trpcClient.auth.refresh.mutate({ 
      refreshToken 
    });

    if (response) {
      // Update stored tokens with rotated tokens
      storeTokensFallback(response.accessToken, response.refreshToken);
      return response.accessToken;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    handleLogout();
    return null;
  }
}

export async function handleLogout(clearPermissions?: () => void) {
    clearPermissions?.();
    
    try {
      await trpcClient.auth.logout.mutate();
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    sessionStorage.removeItem('appUserAuth');
    sessionStorage.removeItem('superAdminAuth');
    sessionStorage.removeItem('isImpersonating');
    clearTokensFallback();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem('permissions'); 
    window.location.href = createPageUrl('AppUserLogin');
}

export function removeImpersonation() {
  const superAdminAuth = sessionStorage.getItem("superAdminAuth");
  if (!superAdminAuth) {
    handleLogout();
    return;
  }

  sessionStorage.setItem("appUserAuth", superAdminAuth);
  sessionStorage.removeItem("superAdminAuth");
  sessionStorage.removeItem("isImpersonating");

  location.href = createPageUrl("ImpersonateUser");
}

export function impersonateUser(user: any) {
  if (!user || !user.id) return;

  const currentAuth = sessionStorage.getItem("appUserAuth");
  if (!currentAuth) return;

  sessionStorage.setItem("superAdminAuth", currentAuth);
  sessionStorage.setItem("isImpersonating", "true");
  sessionStorage.setItem("appUserAuth", JSON.stringify(user));

  location.href = createPageUrl("AdminDashboard");
}

async function refreshAppUserAuth(cachedUser: any) {
  if (!cachedUser?.id) return null;

  try {
    const refreshedUser = await trpcClient.users.getUserById.query({ id: Number(cachedUser.id) });

    if (refreshedUser) {
      sessionStorage.setItem("appUserAuth", JSON.stringify(refreshedUser));

      const permissions = await trpcClient.permission.getByUser.query({ userId: Number(refreshedUser.id) });
      sessionStorage.setItem("permissions", JSON.stringify(permissions));

      return refreshedUser;
    }
  } catch (error) {
    console.error("Failed to refresh app user auth:", error);
  }

  return null;
}

export function useAdminAccess() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    let isMounted = true;
    isMountedRef.current = true;

    const loadUser = async () => {
      try {
        const appUserAuth = sessionStorage.getItem("appUserAuth");

        if (appUserAuth) {
          const cachedUser = JSON.parse(appUserAuth);
          if (isMounted) {
            setCurrentUser(cachedUser);
          }

        }
      } catch (e) {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const cached =
        currentUser ??
        (() => {
          const appUserAuth = sessionStorage.getItem("appUserAuth");
          return appUserAuth ? JSON.parse(appUserAuth) : null;
        })();

      if (!cached?.id) return null;

      const refreshedUser = await refreshAppUserAuth(cached);
      if (refreshedUser && isMountedRef.current) {
        setCurrentUser(refreshedUser);
      }
      return refreshedUser;
    } catch (error) {
      console.error("Failed to refresh app user auth:", error);
      return null;
    }
  }, [currentUser]);

  const role = currentUser?.role;

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin";
  const isEmployee = currentUser?.role === "employee";
  const isTahfizAdmin = isAdmin && !!currentUser?.tahfizcenter?.id;
  const isOrganisationAdmin = isAdmin && !!currentUser?.organisation?.id;

  const hasAdminAccess = isSuperAdmin || isAdmin || isEmployee;

  let currentUserStates = [];
  if (isSuperAdmin) {
    currentUserStates = STATES_MY;
  }
  else {
    currentUserStates = Array.isArray(currentUser?.states) ? currentUser.states : [currentUser?.states].filter(Boolean);
  }

  const checkRole = {
    superadmin: isSuperAdmin,
    admin: isAdmin,
    employee: isEmployee,
    tahfiz: isTahfizAdmin,
    organisation: isOrganisationAdmin,
  }

  const userEmail = currentUser?.email ?? null;

  return { 
    role, 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, isAdmin, isEmployee, isTahfizAdmin, isOrganisationAdmin,
    checkRole, 
    currentUserStates,
    userEmail,
    refreshUser,
  };
}

export function userGoogleAccess() {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setGoogleUser(getStoredGoogleUser());
      } catch (e) {
        setGoogleUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const gmail = googleUser?.email ?? null;

  return {
    role: googleUser ? "google" : "guest",
    googleUser,
    loadingUser,
    gmail,
  };
}

export function useLoginGoogle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginGoogleMutation = trpc.auth.loginGoogle.useMutation({
    onSuccess: (data) => {
      setLoading(false);
      setStoredGoogleAuth(data.user);

      const storedFcmToken = localStorage.getItem("fcmToken");
      if (storedFcmToken && data.user?.id) {
        trpcClient.google.saveDeviceToken.mutate({ googleUserId: data.user.id, fcmToken: storedFcmToken }).catch(() => {});
      }

      navigate(createPageUrl("UserDashboard"));
    },
    onError: (err) => {
      setLoading(false);
      setError(err.message);
    },
  });

  const login = (credential: any) => {
    setError("");
    setLoading(true);

    loginGoogleMutation.mutate({
      credential,
    });
  };

  return { login, loading, error, setError };
}
