import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translations";
import { openAppStoreListing } from "@/utils/appUpdate";

export default function ForceUpdateScreen({ updateInfo }) {
  const [opening, setOpening] = useState(false);

  const handleUpdateClick = async () => {
    setOpening(true);
    try {
      await openAppStoreListing();
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white px-6">
      <div className="flex w-full max-w-sm flex-col items-center">
        <img
          src="/Logo-No_Background.png"
          alt="QubuR"
          className="h-24 w-24 object-contain"
        />

        <RefreshCw className="mt-6 h-10 w-10 text-primary" />

        <h1 className="mt-4 text-center text-lg font-semibold">
          {translate("Update Required")}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {translate(
            "A new version of QubuR is available on the Play Store. Please update to continue using the app."
          )}
        </p>

        {(updateInfo?.currentVersion || updateInfo?.availableVersion) && (
          <div className="mt-4 text-center text-xs text-slate-400">
            {updateInfo?.currentVersion && (
              <div>
                {translate("Installed version")}: {updateInfo.currentVersion}
              </div>
            )}
            {updateInfo?.availableVersion && (
              <div>
                {translate("Latest version")}: {updateInfo.availableVersion}
              </div>
            )}
          </div>
        )}

        <Button
          size="lg"
          className="mt-8 w-full"
          disabled={opening}
          onClick={handleUpdateClick}
        >
          {translate("Update Now")}
        </Button>
      </div>
    </div>
  );
}
