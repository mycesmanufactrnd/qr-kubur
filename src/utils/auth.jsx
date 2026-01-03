import { base44 } from '@/api/base44Client';
import { createPageUrl } from '.';

export async function handleLogin({ 
  email, 
  password, 
  setLoading, 
  setError, 
  // navigate // if use react-router navigate instead of window.location
}) {
  setError('');
  setLoading(true);

  try {
    const response = await base44.functions.invoke('appUserLogin', { email, password });
    
    if (response.data.success) {
      localStorage.setItem('appUserAuth', JSON.stringify(response.data.user));
      
      window.location.href = createPageUrl('AdminDashboard');
    } else {
      setError(response.data.message || 'Login failed');
    }
  } catch (err) {
    setError('Invalid email or password');
  } finally {
    setLoading(false);
  }
}

export function handleLogout(clearPermissions) {
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

export function impersonateUser(user = {}) {
  if (!user || !user.id) return;

  const currentAuth = localStorage.getItem("appUserAuth");
  if (!currentAuth) return;

  localStorage.setItem("superAdminAuth", currentAuth);
  localStorage.setItem("isImpersonating", "true");
  localStorage.setItem("appUserAuth", JSON.stringify(user));

  location.href = createPageUrl("AdminDashboard");
}