import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import * as Sentry from "@sentry/react";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";

const prodDSN = "https://5a7c34e38f15887e618432aa8004637d@o4511261315039232.ingest.de.sentry.io/4511261317922896";
const devDSN = "";

// Sentry.init({
//   dsn: prodDSN,
//   sendDefaultPii: true,
//   enableLogs: true,
//   integrations: [Sentry.browserTracingIntegration()],
//   tracesSampleRate: 1.0, // adjust in production (e.g. 0.1)
// });

const SESSION_KEYS = [
  "appUserAuth",
  "superAdminAuth",
  "isImpersonating",
  "permissions",
  "accessToken",
  "refreshToken",
];

const clearSession = () => {
  SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k));
  window.location.href = "/AppUserLogin";
};

let queryClient;

let isRefreshing = false;

const handleAuthError = async (error) => {
  if (error?.data?.code !== "UNAUTHORIZED") return;
  if (window.location.pathname === "/AppUserLogin") return;
  if (isRefreshing) return;

  isRefreshing = true;

  try {
    // Pass stored refresh token as input fallback (cookie may not arrive in dev/cross-origin)
    const storedRefresh = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken") || undefined;
    const result = await trpcClient.auth.refresh.mutate({ refreshToken: storedRefresh });

    sessionStorage.setItem("accessToken", result.accessToken);
    if (result.refreshToken) sessionStorage.setItem("refreshToken", result.refreshToken);

    queryClient?.invalidateQueries();
  } catch (err) {
    console.error("[auth] Refresh failed, logging out:", err);
    clearSession();
  } finally {
    isRefreshing = false;
  }
};

queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <App />
    </trpc.Provider>
  </QueryClientProvider>,
);

// HMR support for Vite
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    window.parent?.postMessage({ type: "sandbox:beforeUpdate" }, "*");
  });
  import.meta.hot.on("vite:afterUpdate", () => {
    window.parent?.postMessage({ type: "sandbox:afterUpdate" }, "*");
  });
}
