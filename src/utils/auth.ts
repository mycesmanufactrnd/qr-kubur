import { createPageUrl } from './index';
import { useEffect, useState } from 'react';
import { trpc, trpcClient } from './trpc';
import { STATES_MY } from './enums';

export function handleLoginTRPC() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("clientIP", data.clientIp);
      localStorage.setItem("appUserAuth", JSON.stringify(data));

      const permissions = await trpcClient.permission.getByUser.query({ userId: data.id });

      localStorage.setItem("permissions", JSON.stringify(permissions));

      window.location.href = createPageUrl("AdminDashboard");
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
    
    localStorage.removeItem('appUserAuth');
    localStorage.removeItem('superAdminAuth');
    localStorage.removeItem('isImpersonating');
    window.location.href = createPageUrl('AppUserLogin');
}

export function removeImpersonation() {
  const superAdminAuth = localStorage.getItem("superAdminAuth");
  if (!superAdminAuth) {
    handleLogout();
    return;
  }

  localStorage.setItem("appUserAuth", superAdminAuth);
  localStorage.removeItem("superAdminAuth");
  localStorage.removeItem("isImpersonating");

  location.href = createPageUrl("ImpersonateUser");
}

export function impersonateUser(user: any) {
  if (!user || !user.id) return;

  const currentAuth = localStorage.getItem("appUserAuth");
  if (!currentAuth) return;

  localStorage.setItem("superAdminAuth", currentAuth);
  localStorage.setItem("isImpersonating", "true");
  localStorage.setItem("appUserAuth", JSON.stringify(user));

  location.href = createPageUrl("AdminDashboard");
}

export function useAdminAccess() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = localStorage.getItem("appUserAuth");
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
  const isTahfizAdmin = isAdmin && !!currentUser?.tahfiz_center_id;

  const hasAdminAccess = isSuperAdmin || isAdmin || isEmployee;

  let currentUserStates = [];
  if (isSuperAdmin) {
    currentUserStates = STATES_MY;
  }
  else {
    currentUserStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
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