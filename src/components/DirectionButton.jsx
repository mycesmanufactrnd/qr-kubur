import { Navigation } from "lucide-react";
import { Button } from "./ui/button";
import { openDirections } from "@/utils/helpers";
import clsx from "clsx";
import { translate } from "@/utils/translations";

export default function DirectionButton({ 
  latitude = null, 
  longitude = null,
  addClass = '',
}) {
  if (latitude == null || longitude == null) return null;

  return (
    <Button
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        openDirections(latitude, longitude);
      }}
      className={clsx(
        "h-8 text-xs bg-emerald-600 hover:bg-emerald-700",
        addClass
      )}
    >
      <Navigation className="w-3 h-3 mr-1" />
      {translate('Direction')}
    </Button>
  );
}