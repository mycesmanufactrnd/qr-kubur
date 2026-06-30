// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/index";
import {
  HelpCircle,
  FileText,
  LogIn,
  Shield,
  Type,
  Globe,
  Palette,
  ChevronRight,
  LogOut,
  LocateFixed,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Bell,
  BellOff,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import {
  clearStoredGoogleAuth,
  getStoredGoogleUser,
  handleLogout,
  useLoginGoogle,
  useAdminAccess,
} from "@/utils/auth";
import { trpcClient } from "@/utils/trpc";
import { usePermissions } from "@/components/PermissionsContext";
import { useLocationContext } from "@/providers/LocationProvider";
import { showSuccess } from "@/components/ToastrNotification";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

const SAVED_PHONE_KEY = "userphoneno";

const SectionCard = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
        {title}
      </p>
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-700">{children}</div>
  </div>
);

const SelectRow = ({ icon: Icon, label, value, onValueChange, options }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const NavRow = ({ icon: Icon, label, action, danger = false }) => (
  <button
    onClick={action}
    className={`w-full flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity ${
      danger ? "hover:bg-red-50 dark:hover:bg-red-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        danger
          ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
          : "bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600"
      }`}
    >
      <Icon className={`w-4 h-4 ${danger ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`} />
    </div>
    <span className={`flex-1 text-left text-sm font-medium ${danger ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}>
      {label}
    </span>
    {!danger && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
  </button>
);

export default function SettingsPageMobile() {
  const navigate = useNavigate();
  const { clearPermissions } = usePermissions();
  const { isSuperAdmin, currentUser } = useAdminAccess();
  const isTahfizContext = !!currentUser?.tahfizcenter?.id;
  const {
    userLocation,
    userState,
    locationDenied,
    isLocationLoading,
    requestLocation,
  } = useLocationContext();
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("ms");
  const [theme, setTheme] = useState("light");
  const [googleUser, setGoogleUser] = useState(null);
  const [gpsPermission, setGpsPermission] = useState("unknown");
  const [requestingGps, setRequestingGps] = useState(false);
  const [savedPhone, setSavedPhone] = useState(
    () => localStorage.getItem(SAVED_PHONE_KEY) || "",
  );
  const [phoneDraft, setPhoneDraft] = useState(savedPhone);

  const [authMode, setAuthMode] = useState(() => {
    if (sessionStorage.getItem("appUserAuth")) return "admin";
    if (getStoredGoogleUser()) return "google";
    return "guest";
  });

  const { login, loading, error } = useLoginGoogle();
  const isWebView = /wv/i.test(navigator.userAgent) || !!window.Capacitor?.isNativePlatform?.();
  const [signInError, setSignInError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { pullY, refreshing: pullRefreshing, threshold } = usePullToRefresh();

  const [notifPermission, setNotifPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "default"
  );
  const [notifRefreshing, setNotifRefreshing] = useState(false);

  const handleNotificationRefresh = async () => {
    setNotifRefreshing(true);
    try {
      const { initFCM } = await import("@/firebase/firebase");
      const token = await initFCM();
      if (token) {
        // Native Capacitor push token — set granted directly (Notification API won't reflect it)
        setNotifPermission("granted");
        // Save token to backend; don't block success toast on network failures
        try {
          const googleUser = getStoredGoogleUser();
          if (googleUser?.id) {
            await trpcClient.google.saveDeviceToken.mutate({ googleUserId: Number(googleUser.id), fcmToken: token });
          }
          const appUserAuth = sessionStorage.getItem("appUserAuth");
          if (appUserAuth) {
            await trpcClient.auth.saveUserDeviceToken.mutate({ fcmToken: token });
          }
        } catch (saveErr) {
          console.error("[FCM] saveDeviceToken failed:", saveErr);
        }
        showSuccess(translate("Notifications"), "enabled");
      } else {
        setNotifPermission("Notification" in window ? Notification.permission : "denied");
      }
    } catch (e) {
      console.error("[FCM] Notification refresh failed:", e);
    } finally {
      setNotifRefreshing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError('');
    setIsSigningIn(true);
    try {
      let firebaseIdToken;
      if (isWebView) {
        const FirebaseAuth = window.Capacitor?.Plugins?.FirebaseAuthentication;
        if (!FirebaseAuth) throw new Error('Plugin not available. Run: npx cap sync');
        await FirebaseAuth.signInWithGoogle();
        const tokenResult = await FirebaseAuth.getIdToken();
        firebaseIdToken = tokenResult?.token;
        if (!firebaseIdToken) throw new Error('No Firebase ID token from getIdToken()');
      } else {
        const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
        const { auth } = await import("@/firebase/firebase");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        firebaseIdToken = await result.user.getIdToken();
      }
      login(firebaseIdToken);
    } catch (e) {
      const cancelled = e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request';
      if (!cancelled) setSignInError(e?.message || String(e));
    } finally {
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    let permissionStatus;

    const checkLocationPermission = async () => {
      if (!navigator.permissions?.query) {
        setGpsPermission("unknown");
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });
        setGpsPermission(permissionStatus.state);
        permissionStatus.onchange = () =>
          setGpsPermission(permissionStatus.state);
      } catch {
        setGpsPermission("unknown");
      }
    };

    checkLocationPermission();

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  useEffect(() => {
    const savedSize = localStorage.getItem("fontSize") || "medium";
    const savedLanguage = localStorage.getItem("language") || "ms";
    const savedTheme = localStorage.getItem("theme") || "light";
    setFontSize(savedSize);
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    applyFontSize(savedSize);
    applyTheme(savedTheme);

    const appUserAuth = sessionStorage.getItem("appUserAuth") || null;
    const storedGoogleUser = getStoredGoogleUser();

    if (appUserAuth) {
      setAuthMode("admin");
      return;
    }
    if (storedGoogleUser) {
      setAuthMode("google");
      setGoogleUser(storedGoogleUser);
      return;
    }
    setAuthMode("guest");
  }, []);

  const onRequestGpsClick = async () => {
    if (!requestLocation) return;
    setRequestingGps(true);
    await requestLocation({ forceRefresh: true });
    setRequestingGps(false);
  };

  const isGpsConnected = !!(userLocation?.lat && userLocation?.lng);
  const showGpsLoading = isLocationLoading || requestingGps;

  const gpsStatusText = showGpsLoading
    ? translate("Checking GPS...")
    : isGpsConnected
      ? translate("GPS Connected")
      : translate("GPS Not Connected");

  const gpsPermissionText =
    gpsPermission === "granted"
      ? translate("Location permission granted")
      : gpsPermission === "denied"
        ? translate("Location permission denied")
        : gpsPermission === "prompt"
          ? translate("Location permission not decided")
          : translate("Location permission unknown");

  const onLogoutClick = () => {
    if (authMode === "google") {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
        if (googleUser?.email && window.google.accounts.id.revoke) {
          window.google.accounts.id.revoke(googleUser.email, () => {});
        }
      }
      clearStoredGoogleAuth();
      window.location.href = createPageUrl("UserDashboard");
    } else {
      handleLogout(clearPermissions);
    }
  };

  const applyFontSize = (size) => {
    const sizes = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizes[size] || "16px";
  };

  const applyTheme = (t) => {
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem("fontSize", size);
    applyFontSize(size);
  };
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    window.location.reload();
  };
  const handleThemeChange = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate("Settings")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        {authMode === "guest" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
            <div className="px-0 pb-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                {translate("Sign In")}
              </p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {translate("Guest Google Sign-In")}
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? translate("Logging in") + '...' : translate("Sign in with Google")}
            </button>
            {(signInError || error) && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-2.5">{signInError || error}</p>
            )}
          </div>
        )}

        {authMode === "google" && googleUser && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                {translate("Account")}
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              {googleUser?.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {googleUser.name?.[0] ?? "G"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {googleUser.name}
                </p>
                {googleUser.email && (
                  <p className="text-xs text-slate-400 truncate">
                    {googleUser.email}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 pb-3">
              <button
                onClick={() => navigate(createPageUrl("UserTransactionRecords"))}
                className="w-full h-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all px-3.5 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {translate("Transaction Record")}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </button>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={onLogoutClick}
                className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {translate("Sign out of Google")}
              </button>
            </div>
          </div>
        )}

        <SectionCard title={translate("Notifications")}>
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                notifPermission === "granted"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                  : notifPermission === "denied"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
                  : "bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600"
              }`}>
                {notifPermission === "denied"
                  ? <BellOff className="w-4 h-4 text-red-500" />
                  : <Bell className={`w-4 h-4 ${notifPermission === "granted" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {notifPermission === "granted"
                    ? translate("Notifications Enabled")
                    : notifPermission === "denied"
                    ? translate("Notifications Blocked")
                    : translate("Notifications Not Enabled")}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {notifPermission === "denied"
                    ? translate("Allow notifications in your browser or system settings")
                    : translate("Receive updates on your requests")}
                </p>
              </div>
            </div>
            {notifPermission !== "denied" && (
              <button
                type="button"
                onClick={handleNotificationRefresh}
                disabled={notifRefreshing}
                className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {notifRefreshing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Bell className="w-4 h-4" />
                }
                {notifPermission === "granted" ? translate("Refresh Notifications") : translate("Enable Notifications")}
              </button>
            )}
          </div>
        </SectionCard>

        <SectionCard title={translate("Location")}>
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0">
                {showGpsLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : isGpsConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {gpsStatusText}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {gpsPermissionText}
                </p>
                {isGpsConnected && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {translate("State")}: {userState || translate("Unknown")} |{" "}
                    {translate("GPS Latitude")}:{" "}
                    {Number(userLocation.lat).toFixed(5)} |{" "}
                    {translate("GPS Longitude")}:{" "}
                    {Number(userLocation.lng).toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onRequestGpsClick}
              disabled={showGpsLoading}
              className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              <LocateFixed className="w-4 h-4" />
              {showGpsLoading
                ? translate("Requesting GPS...")
                : isGpsConnected
                  ? translate("Refresh GPS")
                  : translate("Enable GPS")}
            </button>

            {(locationDenied || gpsPermission === "denied") && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-2.5">
                {translate(
                  "If location is blocked, allow it in your browser site settings and tap Enable GPS again.",
                )}
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title={translate("Phone Number")}>
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {translate("Saved phone number used to pre-fill payment forms.")}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="0123456789"
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value)}
                className="h-9 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = phoneDraft.trim();
                  if (trimmed) {
                    localStorage.setItem(SAVED_PHONE_KEY, trimmed);
                    setSavedPhone(trimmed);
                  } else {
                    localStorage.removeItem(SAVED_PHONE_KEY);
                    setSavedPhone("");
                  }
                  showSuccess("Phone No.", "update");
                }}
                className="px-4 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold active:opacity-80 transition-opacity shrink-0"
              >
                {translate("Save")}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={translate("Display")}>
          <SelectRow
            icon={Type}
            label={translate("Font Size")}
            value={fontSize}
            onValueChange={handleFontSizeChange}
            options={[
              { value: "small", label: translate("Small") },
              { value: "medium", label: translate("Medium") },
              { value: "large", label: translate("Large") },
            ]}
          />
          <SelectRow
            icon={Globe}
            label={translate("Language")}
            value={language}
            onValueChange={handleLanguageChange}
            options={[
              { value: "ms", label: translate("Malay") },
              { value: "en", label: translate("English") },
              { value: "ar", label: translate("Arabic") },
            ]}
          />
          <SelectRow
            icon={Palette}
            label={translate("Theme")}
            value={theme}
            onValueChange={handleThemeChange}
            options={[
              { value: "light", label: translate("Light") },
              { value: "dark", label: translate("Dark") },
            ]}
          />
        </SectionCard>

        <SectionCard title={translate("Support")}>
          <NavRow
            icon={HelpCircle}
            label={translate("FAQ")}
            action={() => navigate(createPageUrl("FAQ"))}
          />
          <NavRow
            icon={FileText}
            label={translate("Contact / Feedback")}
            action={() =>
              (window.location.href =
                "mailto:support@qrkubur.com?subject=Maklum Balas QubuR")
            }
          />
          <NavRow
            icon={Shield}
            label={translate("Report Bug")}
            action={() =>
              (window.location.href =
                "mailto:support@qrkubur.com?subject=Laporan Pepijat")
            }
          />
        </SectionCard>

        <SectionCard title={translate("Information")}>
          <NavRow
            icon={Building2}
            label={translate("Organisation Register")}
            action={() => navigate(createPageUrl("OrganisationQuickRegister"))}
          />
          <NavRow
            icon={FileText}
            label={translate("Terms & Conditions")}
            action={() => navigate(createPageUrl("TermsAndConditions"))}
          />
          <NavRow
            icon={Shield}
            label={translate("Privacy Policy")}
            action={() => navigate(createPageUrl("PrivacyPolicy"))}
          />
          {authMode === "admin" && (
            <NavRow
              icon={LogOut}
              label={translate("Log Out")}
              action={onLogoutClick}
              danger
            />
          )}
          {authMode === "guest" && (
            <NavRow
              icon={LogIn}
              label={translate("Admin Login")}
              action={() => navigate(createPageUrl("AppUserLogin"))}
            />
          )}
        </SectionCard>

        <SectionCard title={translate("Guides")}>
          {(authMode === "guest" || authMode === "google" || isSuperAdmin) && (
            <NavRow
              icon={BookOpen}
              label={translate("User Guide")}
              action={() => navigate(createPageUrl("UserManual"))}
            />
          )}
          {(isSuperAdmin || (authMode === "admin" && !isTahfizContext)) && (
            <NavRow
              icon={BookOpen}
              label={translate("Organisation Admin Guide")}
              action={() => navigate(createPageUrl("AdminOrganisationManual"))}
            />
          )}
          {(isSuperAdmin || isTahfizContext) && (
            <NavRow
              icon={BookOpen}
              label={translate("Tahfiz Admin Guide")}
              action={() => navigate(createPageUrl("AdminTahfizManual"))}
            />
          )}
        </SectionCard>

        <p className="text-center text-xs text-slate-300 dark:text-slate-600 pt-2">
          {translate("Version")}
        </p>
      </div>

      {(pullY > 0 || pullRefreshing) && (
        <div
          className="fixed left-1/2 z-[9999] -translate-x-1/2 w-9 h-9 bg-white dark:bg-slate-700 rounded-full shadow-lg flex items-center justify-center"
          style={{
            top: pullRefreshing ? 16 : Math.max(pullY - 44, -44),
            transition: pullRefreshing ? "top 0.2s ease" : undefined,
          }}
        >
          {pullRefreshing ? (
            <Loader2 style={{ width: 18, height: 18, color: "#10b981" }} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 18, height: 18, transform: `rotate(${Math.min(pullY / threshold, 1) * 360}deg)` }}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          )}
        </div>
      )}

      {(isSigningIn || loading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {translate("Signing in...")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
