const ONBOARDING_PERMISSIONS_KEY = "onboardingPermissionsDone";

// Persists across app opens (not sessionStorage) — this is a once-ever, first
// install flag, not a per-session one.
export const isOnboardingPermissionsDone = () =>
  localStorage.getItem(ONBOARDING_PERMISSIONS_KEY) === "1";

export const markOnboardingPermissionsDone = () => {
  localStorage.setItem(ONBOARDING_PERMISSIONS_KEY, "1");
};
