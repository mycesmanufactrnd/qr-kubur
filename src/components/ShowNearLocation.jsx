

import { translate } from "@/utils/translations";
import { MapPin } from "lucide-react";

export default function ShowNearLocation() {
  return (
    <div className="flex items-center gap-2 text-sm text-stone-500 my-8">
        <MapPin className="w-4 h-4 text-emerald-500" />
        <span>{translate('Showing near your location')}</span>
    </div>
  );
}
