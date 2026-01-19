import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";

export default function LocationDeniedComponent({ onRetry }) {
  const { locationDenied } = useLocationContext();

  if (!locationDenied) return null;

  return (
    <Card className="border-0 shadow-lg dark:bg-gray-800 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <MapPin className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {translate('locationDisabled') || "Location Disabled"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {translate('pleaseEnableLocation') || "Please enable your location to view nearby Tahfiz."}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="mt-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {translate('retry') || "Retry"}
          </Button>
        )}
      </div>
    </Card>
  );
}
