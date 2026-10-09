import { createContext, useContext, useState, useEffect } from 'react';
import { trpcClient } from '@/utils/trpc';
import { refreshAppUserAuth } from '@/utils/auth';

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndPermissions();
  }, []);

  const loadUserAndPermissions = async () => {
    try {
      const appUserAuth = sessionStorage.getItem('appUserAuth');
      let userData = appUserAuth ? JSON.parse(appUserAuth) : null;

      if (!userData) {
        // sessionStorage is wiped whenever Android kills the app's process
        // in the background (e.g. reopening via a push notification) —
        // localStorage survives that. Without this, useAdminAccess() still
        // rehydrates the session fine (same fallback there), but this
        // context would silently decide there's no user and deny every
        // permission check, even though the admin is still logged in.
        const persistedAuth = localStorage.getItem('appUserAuth');
        if (persistedAuth) {
          userData = await refreshAppUserAuth(JSON.parse(persistedAuth));
        }
      }

      if (userData) {
        setUser(userData);

        if (userData.id) {
          const storedPermissions = sessionStorage.getItem("permissions");
          if (storedPermissions) {
            const parsedPermissions = JSON.parse(storedPermissions);
            setPermissions(
              parsedPermissions
                .filter((p) => p?.enabled)
                .map((p) => p.slug)
            );
          }

          try {
            const freshPermissions = await trpcClient.permission.getByUser.query({ userId: Number(userData.id) });
            sessionStorage.setItem("permissions", JSON.stringify(freshPermissions));
            setPermissions(freshPermissions.filter((p) => p?.enabled).map(p => p.slug));
          } catch (error) {
            console.error('Failed to refresh permissions:', error);
          }
        }
      }
    } catch (e) {
      console.error('Error loading permissions:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearPermissions = () => {
    setPermissions([]);
    setUser(null);
    sessionStorage.removeItem('appUserAuth');
    localStorage.removeItem('appUserAuth');
  };

  const hasPermission = (permissionSlug) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return permissions.includes(permissionSlug);
  };

  return (
    <PermissionsContext.Provider value={{ user, permissions, hasPermission, clearPermissions, loading, refreshPermissions: loadUserAndPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
  
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}

export function useCrudPermissions(prefix) {
  const { hasPermission, loading } = usePermissions();

  return {
    loading,
    canView: hasPermission(`${prefix}_view`),
    canVerify: hasPermission(`${prefix}_verify`),
    canApprove: hasPermission(`${prefix}_approve`),
    canReject: hasPermission(`${prefix}_reject`),
    canCreate: hasPermission(`${prefix}_create`),
    canEdit: hasPermission(`${prefix}_edit`),
    canDelete: hasPermission(`${prefix}_delete`)
  };
}
