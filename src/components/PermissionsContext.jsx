import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndPermissions();
  }, []);

  const loadUserAndPermissions = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        const userData = JSON.parse(appUserAuth);
        setUser(userData);
        
        // Fetch all permissions for this user
        if (userData.id) {
          const userPermissions = await base44.entities.Permission.filter({ 
            user_id: userData.id,
            enabled: true
          });
          setPermissions(userPermissions.map(p => p.slug));
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
    canApprove: hasPermission(`${prefix}_approve`),
    canCreate: hasPermission(`${prefix}_create`),
    canEdit: hasPermission(`${prefix}_edit`),
    canDelete: hasPermission(`${prefix}_delete`)
  };
}
