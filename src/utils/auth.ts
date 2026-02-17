import { createPageUrl } from './index';
import { useEffect, useState } from 'react';
import { trpc, trpcClient } from './trpc';
import { STATES_MY } from './enums';

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

      if (data.tahfizcenter) {
        window.location.href = createPageUrl("TahfizDashboard");
      }

      if (data.role === "superadmin") {
        window.location.href = createPageUrl("SuperadminDashboard");
      } else if (data.tahfizcenter) {
        window.location.href = createPageUrl("TahfizDashboard");
      } else if (data.organisation) {
        window.location.href = createPageUrl("AdminDashboard");
      } else {
        window.location.href = createPageUrl("AdminDashboard");
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

export function useAdminAccess() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = sessionStorage.getItem("appUserAuth");
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const role = currentUser?.role;

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin";
  const isEmployee = currentUser?.role === "employee";
  const isTahfizAdmin = isAdmin && !!currentUser?.tahfizcenter?.id;

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
  }

  const userEmail = currentUser?.email ?? null;

  return { 
    role, 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, isAdmin, isEmployee, isTahfizAdmin, 
    checkRole, 
    currentUserStates,
    userEmail
  };
}