// @ts-nocheck
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { backNavigationMap } from "@/back-navigating-pages.config";

// Fired by MainActivity.java via evaluateJavascript when the hardware back button is pressed.
export function useNativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBack = () => {
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
