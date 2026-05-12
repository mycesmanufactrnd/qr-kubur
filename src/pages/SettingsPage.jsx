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
  isGoogleSignedOut,
  useLoginGoogle,
} from "@/utils/auth";
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

  const handleCredentialResponse = (response) => {
    login(response.credential);
  };

  useEffect(() => {
    if (authMode !== "guest") return;
    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id) return false;
      const signedOut = isGoogleSignedOut();
      window.google.accounts.id.initialize({
        client_id:
          "52708588654-9680sm9l110i7qrag9g6uf3sbf0h6cb1.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        auto_select: !signedOut,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("desktop-google-signin"),
        { theme: "outline", size: "large", width: "100%" },
      );
      if (!signedOut && window.google?.accounts?.id?.prompt) {
        window.google.accounts.id.prompt();
      }
      return true;
    };
    const interval = setInterval(() => {
      if (initializeGoogleSignIn()) clearInterval(interval);
    }, 250);
    return () => clearInterval(interval);
  }, [authMode]);

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
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                {translate("Sign In")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {translate("Guest Google Sign-In")}
              </p>
              <div id="desktop-google-signin" />
              {loading && (
                <p className="text-xs text-slate-400">{translate("Logging in")}...</p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </CardContent>
          </Card>
        )}

        {/* Auth — google */}
        {authMode === "google" && googleUser && (
          <Card className="dark:bg-gray-800">
            <CardHeader>
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
                    className="w-10 h-10 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
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
                  onClick={() => navigate(createPageUrl("UserTransactionRecords"))}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {translate("Transaction Record")}
                </Button>
                <Button variant="outline" size="sm" onClick={onLogoutClick}>
                  {translate("Sign out of Google")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Display */}
        <Card className="dark:bg-gray-800">
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
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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

        {/* Location */}
        <Card className="dark:bg-gray-800">
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
              className="w-full"
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
        <Card className="dark:bg-gray-800">
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
                className="h-9 flex-1"
              />
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600"
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
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Support")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => navigate(createPageUrl("FAQ"))}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              {translate("FAQ")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
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
              className="w-full justify-start gap-2"
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
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => navigate(createPageUrl("OrganisationQuickRegister"))}
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              {translate("Organisation Register")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => navigate(createPageUrl("TermsAndConditions"))}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              {translate("Terms & Conditions")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => navigate(createPageUrl("PrivacyPolicy"))}
            >
              <Shield className="w-4 h-4 text-slate-400" />
              {translate("Privacy Policy")}
            </Button>
            {authMode === "admin" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
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
                className="w-full justify-start gap-2"
                onClick={() => navigate(createPageUrl("AppUserLogin"))}
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                {translate("Admin Login")}
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
