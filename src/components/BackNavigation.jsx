import { translate } from "@/utils/translations";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useAdminAccess } from "@/utils/auth";
import { createPageUrl } from "@/utils";

export default function BackNavigation({ title = "Back" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAdminAccess, isTahfizAdmin } = useAdminAccess();

  const handleBack = () => {
    const params = new URLSearchParams(location.search);
    const haveParam = params.get("status_id") === "1";

    if (isTahfizAdmin) {
      navigate(createPageUrl("TahfizDashboard"), { replace: true });
    } else if (hasAdminAccess) {
      navigate(createPageUrl("AdminDashboard"), { replace: true });
    } else if (haveParam) {
      navigate("/", { replace: true });
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
