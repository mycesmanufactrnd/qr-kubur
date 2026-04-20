import { createPageUrl } from './index';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc, trpcClient } from './trpc';
import { STATES_MY } from './enums';
import { useNavigate } from 'react-router-dom';

const GOOGLE_AUTH_KEY = "googleAuth";
const GOOGLE_SIGNED_OUT_KEY = "googleSignedOut";
const TOKEN_KEY = "token";

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
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredGoogleAuth() {
  localStorage.removeItem(GOOGLE_AUTH_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
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
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("clientIP", data.clientIp);
      sessionStorage.setItem("appUserAuth", JSON.stringify(data));

      const permissions = await trpcClient.permission.getByUser.query({ userId: data.id });

      sessionStorage.setItem("permissions", JSON.stringify(permissions));

      if (data.role === "superadmin") {
        window.location.href = createPageUrl("SuperadminDashboard");
      } else if (data.tahfizcenter) {
        window.location.href = createPageUrl("TahfizDashboard");
      } else if (data.organisation) {
        window.location.href = createPageUrl("AdminDashboard");
      } else {
        sessionStorage.clear();
        window.location.href = createPageUrl("AppUserLogin");
      }
    },
    onError: (err) => {
      console.error(err);
      setError(err.message || "Login failed");
      setLoading(false);
    },
  });

  const login = (email, password) => {
    setError("");
    setLoading(true);
    loginMutation.mutate({ email, password });
  };

  return { login, loading, error, setError };
}

export function handleLogout(clearPermissions?: () => void) {
    clearPermissions?.();
    
    sessionStorage.removeItem('appUserAuth');
    sessionStorage.removeItem('superAdminAuth');
    sessionStorage.removeItem('isImpersonating');
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
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

  const token = sessionStorage.getItem("token");
  if (!token) return null;

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
    isSuperAdmin, isAdmin, isEmployee, isTahfizAdmin,  isOrganisationAdmin,
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
      setStoredGoogleAuth(data.user, data.token);
      
      navigate(createPageUrl("UserDashboard"));
    },
    onError: (err) => {
      setLoading(false);
      setError(err.message);
    },
  });

  const login = (credential) => {
    setError("");
    setLoading(true);

    loginGoogleMutation.mutate({
      credential,
    });
  };

  return { login, loading, error, setError };
}
