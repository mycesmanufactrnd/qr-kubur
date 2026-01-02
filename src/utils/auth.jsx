import { createPageUrl } from '.';

export function handleLogout(clearPermissions) {
    if (typeof clearPermissions === 'function') {
        clearPermissions();
    }
    
    localStorage.removeItem('appUserAuth');
    window.location.href = createPageUrl('AppUserLogin');
}