import { Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { shareLink } from "@/utils/helpers";
import clsx from "clsx";
import { translate } from "@/utils/translations";

export default function ShareButton({ 
  title = '', 
  textMessage = '', 
  url = null, 
  addClass = '' 
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        shareLink({
          title,
          text: textMessage,
          url,
        });
      }}
      className={clsx(
        "h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
        addClass
      )}
    >
      <Share2 className="w-3 h-3 mr-1" />
      {translate('Share')}
    </Button>
  );
}
