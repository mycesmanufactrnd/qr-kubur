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
    if (typeof clearPermissions === 'function') {
        clearPermissions();
    }
    
    localStorage.removeItem('appUserAuth');
    window.location.href = createPageUrl('AppUserLogin');
}

export function impersonateUser(user = {}) {
  if (user) {
    localStorage.setItem('appUserAuth', JSON.stringify(user));
      
    window.location.href = createPageUrl('AdminDashboard');
  }
}