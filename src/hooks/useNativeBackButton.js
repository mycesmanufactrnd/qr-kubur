// @ts-nocheck
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { backNavigationMap } from "@/back-navigating-pages.config";

// Landing pages a user can be dropped on right after login — there's nowhere
// further back to go from here, so the back button should offer to exit the
// app instead of navigating.
const homeRoutes = ["/", createPageUrl("AdminDashboard")];

// Fired by MainActivity.java via evaluateJavascript when the hardware back button is pressed.
export function useNativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBack = () => {
      if (homeRoutes.includes(location.pathname)) {
        window.dispatchEvent(new CustomEvent("nativeBackExitRequest"));
        return;
      }

      const matched = Object.entries(backNavigationMap).find(
        ([pageName]) => createPageUrl(pageName) === location.pathname,
      );

      if (matched) {
        navigate(matched[1], { replace: true });
      } else {
        navigate(-1);
      }
    };

    window.addEventListener("nativeBackButton", handleBack);
    return () => window.removeEventListener("nativeBackButton", handleBack);
  }, [location.pathname, navigate]);
}
