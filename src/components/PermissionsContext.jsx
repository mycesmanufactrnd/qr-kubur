import { createContext, useContext, useState, useEffect } from 'react';
import { trpcClient } from '@/utils/trpc';

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
      if (appUserAuth) {
        const userData = JSON.parse(appUserAuth);
        setUser(userData);
        
        if (userData.id) {
          const storedPermissions = sessionStorage.getItem("permissions");
          if (storedPermissions) {
            const parsedPermissions = JSON.parse(storedPermissions);
            setPermissions(parsedPermissions.map(p => p.slug));
          }

          try {
            const freshPermissions = await trpcClient.permission.getByUser.query({ userId: Number(userData.id) });
            sessionStorage.setItem("permissions", JSON.stringify(freshPermissions));
            setPermissions(freshPermissions.map(p => p.slug));
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
