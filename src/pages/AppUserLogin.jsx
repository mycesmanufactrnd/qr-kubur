// @ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, AlertCircle, Eye, EyeOff, Fingerprint } from "lucide-react";
import { handleLoginTRPC, useBiometricLoginTRPC } from "@/utils/auth";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  getBiometricUsername,
  getBiometricRefreshToken,
  disableBiometricLogin,
} from "@/utils/biometricAuth";
import { translate } from "@/utils/translations";

export default function AppUserLogin() {
  const [username, setUsername] = useState(
    () => localStorage.getItem("rememberedUsername") ?? "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem("rememberedUsername"),
  );
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  const { login, loading, error, setError } = handleLoginTRPC();
  const {
    loginWithRefreshToken,
    loading: biometricLoading,
    error: biometricError,
  } = useBiometricLoginTRPC();

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricSupported(available);
      if (available && isBiometricEnabled()) {
        setCanUseBiometric(true);
      }
    })();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }
    // Tying biometric enrollment to "Remember me" keeps it a single, familiar checkbox
    // instead of adding a second one — checking it also offers to save fingerprint/face login.
    login(username, password, rememberMe);
  };

  const onBiometricLogin = async () => {
    const refreshToken = await getBiometricRefreshToken();
    if (!refreshToken) {
      setError(translate("Biometric login failed. Please use your password."));
      return;
    }
    const success = await loginWithRefreshToken(refreshToken);
    if (!success) {
      // Stored token has expired (7 days) — clear it so the button doesn't stay stuck failing.
      await disableBiometricLogin();
      setCanUseBiometric(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold dark:text-white">
            {translate("Admin Login")}
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {translate("Log in to access the admin dashboard")}
          </p>
        </CardHeader>
        <CardContent>
          {canUseBiometric && (
            <div className="space-y-3 mb-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-500 text-emerald-600 dark:text-emerald-400"
                disabled={biometricLoading}
                onClick={onBiometricLogin}
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                {biometricLoading
                  ? translate("Verifying...")
                  : getBiometricUsername()
                    ? `${translate("Login as")} ${getBiometricUsername()}`
                    : translate("Login with fingerprint or face")}
              </Button>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="flex-1 border-t dark:border-gray-700" />
                {translate("or use your password")}
                <div className="flex-1 border-t dark:border-gray-700" />
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {(error || biometricError) && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error || biometricError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">
                {translate("Username")}
              </label>
              <Input
                className="dark:border-slate-600"
                placeholder={translate("Enter Username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">
                {translate("Password")}
              </label>
              <div className="relative">
                <Input
                  className="dark:border-slate-600 pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder={translate("Enter your password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none"
              >
                {translate("Remember me")}
                {biometricSupported && !canUseBiometric && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {" "}
                    ({translate("also enables fingerprint/face login")})
                  </span>
                )}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? translate("Logging in") : translate("Log In")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
