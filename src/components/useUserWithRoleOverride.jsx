import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useUserWithRoleOverride() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      let userData = await base44.auth.me();
      
      // Apply role override for testing
      const roleOverride = localStorage.getItem('roleOverride');
      if (roleOverride && userData) {
        userData = {
          ...userData,
          role: roleOverride === 'user' ? 'user' : 'admin',
          admin_type: roleOverride === 'superadmin' ? 'superadmin' : (roleOverride === 'admin' ? 'admin' : 'none')
        };
      }
      
      setUser(userData);
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  };

  return { user, loading };
}