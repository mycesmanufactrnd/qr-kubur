import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { translate } from "@/utils/translations";

export default function BackNavigation({ title = "Back" }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 pt-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="h-3 w-5 dark:text-gray-300"
      >
        <ArrowLeft className="w-3 h-3" />
      </Button>
      <h1 className="text-md font-bold text-gray-900 dark:text-white">
        {translate(title)}
      </h1>
    </div>
  );
}
