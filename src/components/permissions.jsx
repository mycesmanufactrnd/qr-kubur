// Permission definitions
export const PERMISSIONS = {
  // Graves
  GRAVES_VIEW: 'graves_view',
  GRAVES_CREATE: 'graves_create',
  GRAVES_EDIT: 'graves_edit',
  GRAVES_DELETE: 'graves_delete',
  
  // Dead Persons
  DEAD_PERSONS_VIEW: 'dead_persons_view',
  DEAD_PERSONS_CREATE: 'dead_persons_create',
  DEAD_PERSONS_EDIT: 'dead_persons_edit',
  DEAD_PERSONS_DELETE: 'dead_persons_delete',
  
  // Organisations
  ORGANISATIONS_VIEW: 'organisations_view',
  ORGANISATIONS_CREATE: 'organisations_create',
  ORGANISATIONS_EDIT: 'organisations_edit',
  ORGANISATIONS_DELETE: 'organisations_delete',
  
  // Tahfiz Centers
  TAHFIZ_VIEW: 'tahfiz_view',
  TAHFIZ_CREATE: 'tahfiz_create',
  TAHFIZ_EDIT: 'tahfiz_edit',
  TAHFIZ_DELETE: 'tahfiz_delete',
  
  // Suggestions
  SUGGESTIONS_VIEW: 'suggestions_view',
  SUGGESTIONS_APPROVE: 'suggestions_approve',
  SUGGESTIONS_REJECT: 'suggestions_reject',
  
  // Donations
  DONATIONS_VIEW: 'donations_view',
  DONATIONS_VERIFY: 'donations_verify',
  DONATIONS_REJECT: 'donations_reject',
  
  // Tahlil Requests
  TAHLIL_VIEW: 'tahlil_view',
  TAHLIL_ACCEPT: 'tahlil_accept',
  TAHLIL_REJECT: 'tahlil_reject',
  TAHLIL_COMPLETE: 'tahlil_complete',
  
  // Users
  USERS_VIEW: 'users_view',
  USERS_CREATE: 'users_create',
  USERS_EDIT: 'users_edit',
  USERS_DELETE: 'users_delete',
  USERS_MANAGE_PERMISSIONS: 'users_manage_permissions',
  
  // Employees
  EMPLOYEES_VIEW: 'employees_view',
  EMPLOYEES_CREATE: 'employees_create',
  EMPLOYEES_EDIT: 'employees_edit',
  EMPLOYEES_DELETE: 'employees_delete',
};

export const PERMISSION_CATEGORIES = {
  graves: {
    label: 'Tanah Perkuburan',
    permissions: [
      { slug: PERMISSIONS.GRAVES_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.GRAVES_CREATE, label: 'Tambah' },
      { slug: PERMISSIONS.GRAVES_EDIT, label: 'Edit' },
      { slug: PERMISSIONS.GRAVES_DELETE, label: 'Padam' },
    ]
  },
  dead_persons: {
    label: 'Rekod Si Mati',
    permissions: [
      { slug: PERMISSIONS.DEAD_PERSONS_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.DEAD_PERSONS_CREATE, label: 'Tambah' },
      { slug: PERMISSIONS.DEAD_PERSONS_EDIT, label: 'Edit' },
      { slug: PERMISSIONS.DEAD_PERSONS_DELETE, label: 'Padam' },
    ]
  },
  organisations: {
    label: 'Organisasi',
    permissions: [
      { slug: PERMISSIONS.ORGANISATIONS_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.ORGANISATIONS_CREATE, label: 'Tambah' },
      { slug: PERMISSIONS.ORGANISATIONS_EDIT, label: 'Edit' },
      { slug: PERMISSIONS.ORGANISATIONS_DELETE, label: 'Padam' },
    ]
  },
  tahfiz: {
    label: 'Pusat Tahfiz',
    permissions: [
      { slug: PERMISSIONS.TAHFIZ_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.TAHFIZ_CREATE, label: 'Tambah' },
      { slug: PERMISSIONS.TAHFIZ_EDIT, label: 'Edit' },
      { slug: PERMISSIONS.TAHFIZ_DELETE, label: 'Padam' },
    ]
  },
  suggestions: {
    label: 'Cadangan',
    permissions: [
      { slug: PERMISSIONS.SUGGESTIONS_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.SUGGESTIONS_APPROVE, label: 'Luluskan' },
      { slug: PERMISSIONS.SUGGESTIONS_REJECT, label: 'Tolak' },
    ]
  },
  donations: {
    label: 'Derma',
    permissions: [
      { slug: PERMISSIONS.DONATIONS_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.DONATIONS_VERIFY, label: 'Sahkan' },
      { slug: PERMISSIONS.DONATIONS_REJECT, label: 'Tolak' },
    ]
  },
  tahlil: {
    label: 'Permohonan Tahlil',
    permissions: [
      { slug: PERMISSIONS.TAHLIL_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.TAHLIL_ACCEPT, label: 'Terima' },
      { slug: PERMISSIONS.TAHLIL_REJECT, label: 'Tolak' },
      { slug: PERMISSIONS.TAHLIL_COMPLETE, label: 'Selesai' },
    ]
  },
  users: {
    label: 'Pengguna',
    permissions: [
      { slug: PERMISSIONS.USERS_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.USERS_CREATE, label: 'Tambah' },
      { slug: PERMISSIONS.USERS_EDIT, label: 'Edit' },
      { slug: PERMISSIONS.USERS_DELETE, label: 'Padam' },
      { slug: PERMISSIONS.USERS_MANAGE_PERMISSIONS, label: 'Urus Kebenaran' },
    ]
  },
  employees: {
    label: 'Pekerja',
    permissions: [
      { slug: PERMISSIONS.EMPLOYEES_VIEW, label: 'Lihat' },
      { slug: PERMISSIONS.EMPLOYEES_CREATE, label: 'Tambah' },
      { slug: PERMISSIONS.EMPLOYEES_EDIT, label: 'Edit' },
      { slug: PERMISSIONS.EMPLOYEES_DELETE, label: 'Padam' },
    ]
  },
};

// Helper to check if user has permission
export const hasPermission = (user, permissionSlug) => {
  if (!user) return false;
  
  // Superadmin has all permissions
  if (user.role === 'superadmin') return true;
  
  // Check permissions array
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  
  const permission = user.permissions.find(p => p.slug === permissionSlug);
  return permission && permission.enabled;
};

// Helper to check multiple permissions (user needs at least one)
export const hasAnyPermission = (user, permissionSlugs) => {
  return permissionSlugs.some(slug => hasPermission(user, slug));
};

// Helper to check multiple permissions (user needs all)
export const hasAllPermissions = (user, permissionSlugs) => {
  return permissionSlugs.every(slug => hasPermission(user, slug));
};