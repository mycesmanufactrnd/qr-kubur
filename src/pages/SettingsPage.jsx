import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils/index";
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
  isGoogleSignedOut,
  useLoginGoogle,
} from "@/utils/auth";
import { usePermissions } from "@/components/PermissionsContext";
import { useLocationContext } from "@/providers/LocationProvider";
import { showSuccess } from "@/components/ToastrNotification";

const SAVED_PHONE_KEY = "userphoneno";

// Defined outside SettingsPage so their identity is stable across re-renders.
// If they were defined inside, every keystroke would create new component types,
// causing React to unmount/remount the subtree and drop input focus.

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
        {title}
      </p>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

const SelectRow = ({ icon: Icon, label, value, onValueChange, options }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700">
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
    className={`w-full flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity ${danger ? "hover:bg-red-50" : "hover:bg-slate-50"}`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-50 border border-red-100" : "bg-slate-50 border border-slate-100"}`}
    >
      <Icon
        className={`w-4 h-4 ${danger ? "text-red-500" : "text-slate-400"}`}
      />
    </div>
    <span
      className={`flex-1 text-left text-sm font-medium ${danger ? "text-red-600" : "text-slate-700"}`}
    >
      {label}
    </span>
    {!danger && <ChevronRight className="w-4 h-4 text-slate-300" />}
  </button>
);

export default function SettingsPage() {
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
        document.getElementById("guest-google-signin"),
        { theme: "outline", size: "large", width: "100%" },
      );

      // Try One Tap / auto-select sign-in when user didn't explicitly sign out.
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
      // Sign out via Google Identity Services too
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
            <div className="px-0 pb-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                {translate("Sign In")}
              </p>
            </div>
            <p className="text-sm text-slate-500">
              {translate("Guest Google Sign-In")}
            </p>
            <div id="guest-google-signin" />
            {loading && (
              <p className="text-xs text-slate-400">
                {translate("Logging in")}...
              </p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}

        {authMode === "google" && googleUser && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                Account
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              {googleUser?.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-10 h-10 rounded-full border border-slate-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                  {googleUser.name?.[0] ?? "G"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
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
                onClick={() =>
                  navigate(createPageUrl("UserTransactionRecords"))
                }
                className="w-full h-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 active:scale-95 transition-all px-3.5 text-sm font-medium text-slate-700"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {translate("Transaction Record")}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={onLogoutClick}
                className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-sm font-medium text-slate-700"
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
                {translate("Sign out of Google")}
              </button>
            </div>
          </div>
        )}

        <SectionCard title={translate("Location")}>
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {showGpsLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : isGpsConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700">
                  {gpsStatusText}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {gpsPermissionText}
                </p>
                {isGpsConnected && (
                  <p className="text-xs text-slate-500 mt-1">
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
              className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all text-sm font-medium text-slate-700"
            >
              <LocateFixed className="w-4 h-4" />
              {showGpsLoading
                ? translate("Requesting GPS...")
                : isGpsConnected
                  ? translate("Refresh GPS")
                  : translate("Enable GPS")}
            </button>

            {(locationDenied || gpsPermission === "denied") && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                {translate(
                  "If location is blocked, allow it in your browser site settings and tap Enable GPS again.",
                )}
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title={translate("Phone Number")}>
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs text-slate-400">
              {translate("Saved phone number used to pre-fill payment forms.")}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="0123456789"
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value)}
                className="h-9 rounded-xl border-slate-200 text-sm flex-1"
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
                className="px-4 h-9 rounded-xl bg-emerald-500 text-white text-xs font-semibold active:opacity-80 transition-opacity shrink-0"
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
                "mailto:support@qrkubur.com?subject=Maklum Balas QR Kubur")
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

        <p className="text-center text-xs text-slate-300 pt-2">
          {translate("Version")}
        </p>
      </div>
    </div>
  );
}
