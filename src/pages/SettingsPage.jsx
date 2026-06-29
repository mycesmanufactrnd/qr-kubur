//@ts-nocheck
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
  LogOut,
  LocateFixed,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Settings as SettingsIcon,
  Bell,
  BellOff,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translate } from "@/utils/translations";
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
import { useIsNarrow } from "@/hooks/useIsNarrow";
import SettingsPageMobile from "@/pages/Mobile/SettingsPage";

const SAVED_PHONE_KEY = "userphoneno";

export default function SettingsPage() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <SettingsPageMobile />;
  return <SettingsPageDesktop />;
}

function SettingsPageDesktop() {
  const navigate = useNavigate();
  const { clearPermissions } = usePermissions();
  const { isSuperAdmin, isTahfizAdmin, currentUser } = useAdminAccess();
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
  const [signInError, setSignInError] = useState("");

  const [notifPermission, setNotifPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "default",
  );
  const [notifRefreshing, setNotifRefreshing] = useState(false);

  const handleNotificationRefresh = async () => {
    setNotifRefreshing(true);
    try {
      const { initFCM } = await import("@/firebase/firebase");
      const token = await initFCM();
      setNotifPermission(
        "Notification" in window ? Notification.permission : "default",
      );
      if (token) {
        const googleUser = getStoredGoogleUser();
        if (googleUser?.id) {
          await trpcClient.google.saveDeviceToken.mutate({
            googleUserId: Number(googleUser.id),
            fcmToken: token,
          });
        }
        const appUserAuth = sessionStorage.getItem("appUserAuth");
        if (appUserAuth) {
          await trpcClient.auth.saveUserDeviceToken.mutate({ fcmToken: token });
        }
        showSuccess(translate("Notifications"), "enabled");
      }
    } catch (e) {
      console.error("[FCM] Notification refresh failed:", e);
    } finally {
      setNotifRefreshing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError("");
    try {
      const { signInWithPopup, GoogleAuthProvider } =
        await import("firebase/auth");
      const { auth } = await import("@/firebase/firebase");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseIdToken = await result.user.getIdToken();
      login(firebaseIdToken);
    } catch (e) {
      setSignInError(e?.message || String(e));
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-emerald-600" />
        {translate("Settings")}
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Auth — guest */}
        {authMode === "guest" && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                {translate("Sign In")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {translate("Guest Google Sign-In")}
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {loading
                  ? translate("Logging in") + "..."
                  : translate("Sign in with Google")}
              </button>
              {(signInError || error) && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-2.5">
                  {signInError || error}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Auth — google */}
        {authMode === "google" && googleUser && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                {translate("Account")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {googleUser?.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    {googleUser.name?.[0] ?? "G"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {googleUser.name}
                  </p>
                  {googleUser.email && (
                    <p className="text-xs text-slate-400 truncate">
                      {googleUser.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  onClick={() =>
                    navigate(createPageUrl("UserTransactionRecords"))
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {translate("Transaction Record")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  onClick={onLogoutClick}
                >
                  {translate("Sign out of Google")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Display */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Display")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                {translate("Font Size")}
              </Label>
              <Select value={fontSize} onValueChange={handleFontSizeChange}>
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{translate("Small")}</SelectItem>
                  <SelectItem value="medium">{translate("Medium")}</SelectItem>
                  <SelectItem value="large">{translate("Large")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {translate("Language")}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">{translate("Malay")}</SelectItem>
                  <SelectItem value="en">{translate("English")}</SelectItem>
                  <SelectItem value="ar">{translate("Arabic")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                {translate("Theme")}
              </Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{translate("Light")}</SelectItem>
                  <SelectItem value="dark">{translate("Dark")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                  notifPermission === "granted"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                    : notifPermission === "denied"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
                      : "bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600"
                }`}
              >
                {notifPermission === "denied" ? (
                  <BellOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Bell
                    className={`w-4 h-4 ${notifPermission === "granted" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {notifPermission === "granted"
                    ? translate("Notifications Enabled")
                    : notifPermission === "denied"
                      ? translate("Notifications Blocked")
                      : translate("Notifications Not Enabled")}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {notifPermission === "denied"
                    ? translate(
                        "Allow notifications in your browser or system settings",
                      )
                    : translate("Receive updates on your requests")}
                </p>
              </div>
            </div>
            {notifPermission !== "denied" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                onClick={handleNotificationRefresh}
                disabled={notifRefreshing}
              >
                {notifRefreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4 mr-2" />
                )}
                {notifPermission === "granted"
                  ? translate("Refresh Notifications")
                  : translate("Enable Notifications")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Location")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button
              variant="outline"
              size="sm"
              className="w-full dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={onRequestGpsClick}
              disabled={showGpsLoading}
            >
              <LocateFixed className="w-4 h-4 mr-2" />
              {showGpsLoading
                ? translate("Requesting GPS...")
                : isGpsConnected
                  ? translate("Refresh GPS")
                  : translate("Enable GPS")}
            </Button>
            {(locationDenied || gpsPermission === "denied") && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-2.5">
                {translate(
                  "If location is blocked, allow it in your browser site settings and tap Enable GPS again.",
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Phone Number */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Phone Number")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {translate("Saved phone number used to pre-fill payment forms.")}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="0123456789"
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value)}
                className="h-9 flex-1 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
              >
                {translate("Save")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Support")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={() => navigate(createPageUrl("FAQ"))}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              {translate("FAQ")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={() =>
                (window.location.href =
                  "mailto:support@qrkubur.com?subject=Maklum Balas QubuR")
              }
            >
              <FileText className="w-4 h-4 text-slate-400" />
              {translate("Contact / Feedback")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={() =>
                (window.location.href =
                  "mailto:support@qrkubur.com?subject=Laporan Pepijat")
              }
            >
              <Shield className="w-4 h-4 text-slate-400" />
              {translate("Report Bug")}
            </Button>
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={() =>
                navigate(createPageUrl("OrganisationQuickRegister"))
              }
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              {translate("Organisation Register")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={() => navigate(createPageUrl("TermsAndConditions"))}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              {translate("Terms & Conditions")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              onClick={() => navigate(createPageUrl("PrivacyPolicy"))}
            >
              <Shield className="w-4 h-4 text-slate-400" />
              {translate("Privacy Policy")}
            </Button>
            {authMode === "admin" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 dark:bg-red-900/10"
                onClick={onLogoutClick}
              >
                <LogOut className="w-4 h-4" />
                {translate("Log Out")}
              </Button>
            )}
            {authMode === "guest" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                onClick={() => navigate(createPageUrl("AppUserLogin"))}
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                {translate("Admin Login")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Guides */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Guides")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(authMode === "guest" || authMode === "google" || isSuperAdmin) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                onClick={() => navigate(createPageUrl("UserManual"))}
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                {translate("User Guide")}
              </Button>
            )}
            {(isSuperAdmin || (authMode === "admin" && !isTahfizContext)) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                onClick={() => navigate(createPageUrl("AdminOrganisationManual"))}
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                {translate("Organisation Admin Guide")}
              </Button>
            )}
            {(isSuperAdmin || isTahfizContext) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 dark:bg-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                onClick={() => navigate(createPageUrl("AdminTahfizManual"))}
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                {translate("Tahfiz Admin Guide")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-slate-300 dark:text-slate-600 pt-2">
        {translate("Version")}
      </p>
    </div>
  );
}
