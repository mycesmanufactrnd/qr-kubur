// @ts-nocheck
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Building2, ChevronRight, MapPin } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import SelectForm from "@/components/forms/SelectForm";
import { useForm } from "react-hook-form";
import { useLocationContext } from "@/providers/LocationProvider";
import { useGetTahfizCoordinates } from "@/mutations/useTahfizMutations";
import { STATES_MY } from "@/utils/enums";
import { translate } from "@/utils/translations";
import { createPageUrl } from "@/utils";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";

export default function ChooseTahfizForTahlil() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deadpersonId = searchParams.get("deadpersonId") || "";
  const { userLocation, userState } = useLocationContext();

  const { control, watch } = useForm({ defaultValues: { state: "" } });
  const [manualState, setManualState] = useState("");

  const selectedState = watch("state");
  const effectiveState = manualState ? selectedState : userState || "";

  const { data: tahfizCenters = [], isLoading } = useGetTahfizCoordinates({
    coordinates: userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    filterState: effectiveState || undefined,
    isTahlilServiceOnly: false,
    filterHasPaymentConfig: true,
  });

  const handleSelect = (id) => {
    const params = new URLSearchParams();
    params.set("tahfiz", String(id));
    if (deadpersonId) params.set("deadpersonId", deadpersonId);
    navigate(`${createPageUrl("TahlilRequestPage")}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen pb-10 bg-slate-50 dark:bg-slate-900">
      <BackNavigation title={translate("Choose Tahfiz Center")} />

      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {translate(
            "Select a tahfiz center to continue your Tahlil request.",
          )}
        </p>

        <SelectForm
          name="state"
          control={control}
          label={translate("State")}
          placeholder={translate("Select state")}
          options={STATES_MY}
          onValueChange={(v) => setManualState(v)}
        />

        {isLoading ? (
          <ListCardSkeletonComponent />
        ) : tahfizCenters.length === 0 ? (
          <NoDataCardComponent
            description={translate(
              "No tahfiz center found for this state.",
            )}
          />
        ) : (
          <div className="space-y-2">
            {tahfizCenters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {c.state}
                    {c.address ? ` — ${c.address}` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
