//@ts-nocheck
import { translate } from "@/utils/translations";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { backNavigationMap } from "@/back-navigating-pages.config";

export default function BackKeyNavigation({ title = "Back" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const matchedEntry = Object.entries(backNavigationMap).find(
      ([pageName]) => createPageUrl(pageName) === location.pathname,
    );

    if (matchedEntry) {
      navigate(matchedEntry[1], { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-3 w-5 dark:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700 dark:text-white" />
        </Button>
        <h1 className="text-md font-bold text-gray-900 dark:text-white">
          {translate(title)}
        </h1>
      </div>
      <hr className="my-2 border-0" />
    </>
  );
}
