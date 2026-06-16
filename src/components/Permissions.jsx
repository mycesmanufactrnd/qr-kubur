// Permission definitions
export const PERMISSIONS = {
  // Posts
  POSTS_VIEW: "posts_view",
  POSTS_CREATE: "posts_create",
  POSTS_EDIT: "posts_edit",
  POSTS_DELETE: "posts_delete",

  // Graves
  GRAVES_VIEW: "graves_view",
  GRAVES_CREATE: "graves_create",
  GRAVES_EDIT: "graves_edit",
  GRAVES_DELETE: "graves_delete",

  // Heritage
  HERITAGES_VIEW: "heritages_view",
  HERITAGES_CREATE: "heritages_create",
  HERITAGES_EDIT: "heritages_edit",
  HERITAGES_DELETE: "heritages_delete",

  // Mosques
  MOSQUES_VIEW: "mosques_view",
  MOSQUES_CREATE: "mosques_create",
  MOSQUES_EDIT: "mosques_edit",
  MOSQUES_DELETE: "mosques_delete",

  // Death Charity
  DEATH_CHARITY_VIEW: "death_charity_view",
  DEATH_CHARITY_CREATE: "death_charity_create",
  DEATH_CHARITY_EDIT: "death_charity_edit",
  DEATH_CHARITY_DELETE: "death_charity_delete",

  // Dead Persons
  DEAD_PERSONS_VIEW: "dead_persons_view",
  DEAD_PERSONS_CREATE: "dead_persons_create",
  DEAD_PERSONS_EDIT: "dead_persons_edit",
  DEAD_PERSONS_DELETE: "dead_persons_delete",

  // Organisations
  ORGANISATIONS_VIEW: "organisations_view",
  ORGANISATIONS_CREATE: "organisations_create",
  ORGANISATIONS_EDIT: "organisations_edit",
  ORGANISATIONS_DELETE: "organisations_delete",

  // Tahfiz Centers
  TAHFIZ_VIEW: "tahfiz_view",
  TAHFIZ_CREATE: "tahfiz_create",
  TAHFIZ_EDIT: "tahfiz_edit",
  TAHFIZ_DELETE: "tahfiz_delete",

  // Suggestions
  SUGGESTIONS_VIEW: "suggestions_view",
  SUGGESTIONS_APPROVE: "suggestions_approve",
  SUGGESTIONS_REJECT: "suggestions_reject",
  SUGGESTIONS_DELETE: "suggestions_delete",

  // Donations
  DONATIONS_VIEW: "donations_view",
  DONATIONS_VERIFY: "donations_verify",
  DONATIONS_REJECT: "donations_reject",

  // Tahlil Requests
  TAHLIL_VIEW: "tahlil_view",
  TAHLIL_ACCEPT: "tahlil_accept",
  TAHLIL_REJECT: "tahlil_reject",
  TAHLIL_COMPLETE: "tahlil_complete",

  // Waqf
  WAQF_VIEW: "waqf_view",
  WAQF_CREATE: "waqf_create",
  WAQF_EDIT: "waqf_edit",
  WAQF_DELETE: "waqf_delete",

  // Quotations
  QUOTATIONS_VIEW: "quotations_view",
  QUOTATIONS_VERIFY: "quotations_verify",
  QUOTATIONS_REJECT: "quotations_reject",

  // Islamic Events
  ISLAMIC_EVENTS_VIEW: "islamic_events_view",
  ISLAMIC_EVENTS_CREATE: "islamic_events_create",
  ISLAMIC_EVENTS_EDIT: "islamic_events_edit",
  ISLAMIC_EVENTS_DELETE: "islamic_events_delete",

  // Users
  USERS_VIEW: "users_view",
  USERS_CREATE: "users_create",
  USERS_EDIT: "users_edit",
  USERS_DELETE: "users_delete",

  // Permission
  PERMISSIONS_VIEW: "permissions_view",
  PERMISSIONS_EDIT: "permissions_edit",
 
  // Financial Reports
  FINANCIAL_REPORTS_VIEW: "financial_reports_view",
};

export const PERMISSION_CATEGORIES = {
  // isSuperAdminOnly, - Super Admin
  // isAllAdmin, - Super Admin + Organisation Admin + Tahfiz Admin
  // isTahfizAdminOnly, - Super Admin + Tahfiz Admin
  // isOrganisationAdminOnly, - Super Admin + Organisation Admin

  // Start Super Admin Only
  islamic_events: {
    label: "Islamic Events",
    permissions: [
      { slug: PERMISSIONS.ISLAMIC_EVENTS_VIEW, label: "View" },
      { slug: PERMISSIONS.ISLAMIC_EVENTS_CREATE, label: "Create" },
      { slug: PERMISSIONS.ISLAMIC_EVENTS_EDIT, label: "Edit" },
      { slug: PERMISSIONS.ISLAMIC_EVENTS_DELETE, label: "Delete" },
    ],
    isSuperAdminOnly: true,
  },

  waqf: {
    label: "Waqf Project",
    permissions: [
      { slug: PERMISSIONS.WAQF_VIEW, label: "View" },
      { slug: PERMISSIONS.WAQF_CREATE, label: "Create" },
      { slug: PERMISSIONS.WAQF_EDIT, label: "Edit" },
      { slug: PERMISSIONS.WAQF_DELETE, label: "Delete" },
    ],
    isSuperAdminOnly: true,
  },

  heritages: {
    label: "Heritage Site",
    permissions: [
      { slug: PERMISSIONS.HERITAGES_VIEW, label: "View" },
      { slug: PERMISSIONS.HERITAGES_CREATE, label: "Create" },
      { slug: PERMISSIONS.HERITAGES_EDIT, label: "Edit" },
      { slug: PERMISSIONS.HERITAGES_DELETE, label: "Delete" },
    ],
    isSuperAdminOnly: true,
  },
  // End Super Admin Only

  // Start All Admin Only
  posts: {
    label: "Activity Post",
    permissions: [
      { slug: PERMISSIONS.POSTS_VIEW, label: "View" },
      { slug: PERMISSIONS.POSTS_CREATE, label: "Create" },
      { slug: PERMISSIONS.POSTS_EDIT, label: "Edit" },
      { slug: PERMISSIONS.POSTS_DELETE, label: "Delete" },
    ],
    isAllAdmin: true,
  },

  suggestions: {
    label: 'Suggestion Records',
    permissions: [
      { slug: PERMISSIONS.SUGGESTIONS_VIEW, label: 'View' },
      { slug: PERMISSIONS.SUGGESTIONS_APPROVE, label: 'Approve' },
      { slug: PERMISSIONS.SUGGESTIONS_REJECT, label: 'Reject' },
    ],
    isAllAdmin: true,
  },

  users: {
    label: "User Records",
    permissions: [
      { slug: PERMISSIONS.USERS_VIEW, label: "View" },
      { slug: PERMISSIONS.USERS_CREATE, label: "Create" },
      { slug: PERMISSIONS.USERS_EDIT, label: "Edit" },
      { slug: PERMISSIONS.USERS_DELETE, label: "Delete" },
    ],
    isAllAdmin: true,
  },

  permissions: {
    label: "Permissions",
    permissions: [
      { slug: PERMISSIONS.PERMISSIONS_VIEW, label: "View" },
      { slug: PERMISSIONS.PERMISSIONS_EDIT, label: "Edit" },
    ],
    isAllAdmin: true,
  },

  financial_reports: {
    label: "Financial Reports",
    permissions: [
      { slug: PERMISSIONS.FINANCIAL_REPORTS_VIEW, label: "View" },
    ],
    isAllAdmin: true,
  },
  // End All Admin Only

  // Start Tahfiz Admin Only
  tahfiz: {
    label: "Tahfiz Center",
    permissions: [
      { slug: PERMISSIONS.TAHFIZ_VIEW, label: "View" },
      { slug: PERMISSIONS.TAHFIZ_CREATE, label: "Create" },
      { slug: PERMISSIONS.TAHFIZ_EDIT, label: "Edit" },
      { slug: PERMISSIONS.TAHFIZ_DELETE, label: "Delete" },
    ],
    isTahfizAdminOnly: true,
  },

  tahlil: {
    label: "Tahlil Requests",
    permissions: [
      { slug: PERMISSIONS.TAHLIL_VIEW, label: "View" },
      { slug: PERMISSIONS.TAHLIL_ACCEPT, label: "Accept" },
      { slug: PERMISSIONS.TAHLIL_REJECT, label: "Reject" },
      { slug: PERMISSIONS.TAHLIL_COMPLETE, label: "Complete" },
    ],
    isTahfizAdminOnly: true,
  },
  // End Tahfiz Admin Only
  
  // Manual Filter Start
  donations: {
    label: "Donation Records",
    permissions: [
      { slug: PERMISSIONS.DONATIONS_VIEW, label: "View" },
      { slug: PERMISSIONS.DONATIONS_VERIFY, label: "Verify" },
      { slug: PERMISSIONS.DONATIONS_REJECT, label: "Reject" },
    ],
  },

  mosques: {
    label: "Mosques",
    permissions: [
      { slug: PERMISSIONS.MOSQUES_VIEW, label: "View" },
      { slug: PERMISSIONS.MOSQUES_CREATE, label: "Create" },
      { slug: PERMISSIONS.MOSQUES_EDIT, label: "Edit" },
      { slug: PERMISSIONS.MOSQUES_DELETE, label: "Delete" },
    ],
  },

  death_charity: {
    label: "Death Charity",
    permissions: [
      { slug: PERMISSIONS.DEATH_CHARITY_VIEW, label: "View" },
      { slug: PERMISSIONS.DEATH_CHARITY_CREATE, label: "Create" },
      { slug: PERMISSIONS.DEATH_CHARITY_EDIT, label: "Edit" },
      { slug: PERMISSIONS.DEATH_CHARITY_DELETE, label: "Delete" },
    ],
  },

  graves: {
    label: "Graves",
    permissions: [
      { slug: PERMISSIONS.GRAVES_VIEW, label: "View" },
      { slug: PERMISSIONS.GRAVES_CREATE, label: "Create" },
      { slug: PERMISSIONS.GRAVES_EDIT, label: "Edit" },
      { slug: PERMISSIONS.GRAVES_DELETE, label: "Delete" },
    ],
  },

  dead_persons: {
    label: "Dead Person Records",
    permissions: [
      { slug: PERMISSIONS.DEAD_PERSONS_VIEW, label: "View" },
      { slug: PERMISSIONS.DEAD_PERSONS_CREATE, label: "Create" },
      { slug: PERMISSIONS.DEAD_PERSONS_EDIT, label: "Edit" },
      { slug: PERMISSIONS.DEAD_PERSONS_DELETE, label: "Delete" },
    ],
  },

  organisations: {
    label: "Organisations",
    permissions: [
      { slug: PERMISSIONS.ORGANISATIONS_VIEW, label: "View" },
      { slug: PERMISSIONS.ORGANISATIONS_CREATE, label: "Create", superAdminOnly: true },
      { slug: PERMISSIONS.ORGANISATIONS_EDIT, label: "Edit" },
      { slug: PERMISSIONS.ORGANISATIONS_DELETE, label: "Delete" },
    ],
  },

  quotations: {
    label: "Quotation Records",
    permissions: [
      { slug: PERMISSIONS.QUOTATIONS_VIEW, label: "View" },
      { slug: PERMISSIONS.QUOTATIONS_VERIFY, label: "Verify" },
      { slug: PERMISSIONS.QUOTATIONS_REJECT, label: "Reject" },
    ],
  },
};

// Helper to check if user has permission
// Note: This is a fallback. Use usePermissions() hook for better performance
export const hasPermission = (user, permissionSlug) => {
  if (!user) return false;

  // If user is superadmin, allow everything
  if (user.role === "superadmin") return true;

  // Admin can only access permissions that are NOT superadmin-only
  const category = Object.values(PERMISSION_CATEGORIES).find((cat) =>
    cat.permissions.some((p) => p.slug === permissionSlug),
  );

  if (category?.isSuperAdminOnly) {
    return false; // admin cannot access superadmin-only
  }

  // All other permissions are allowed for admin
  if (user.role === "admin") return true;

  return false;
};

// Helper to check multiple permissions (user needs at least one)
export const hasAnyPermission = (user, permissionSlugs) => {
  return permissionSlugs.some((slug) => hasPermission(user, slug));
};

// Helper to check multiple permissions (user needs all)
export const hasAllPermissions = (user, permissionSlugs) => {
  return permissionSlugs.every((slug) => hasPermission(user, slug));
};
