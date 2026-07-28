// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Building2, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils/index";
import BackNavigation from "@/components/BackNavigation";
import { Badge } from "@/components/ui/badge";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import { STATES_MY } from "@/utils/enums";
import { translate } from "@/utils/translations";
import { showWarning } from "@/components/ToastrNotification";
import { useLocationContext } from "@/providers/LocationProvider";
import { useGetGravesCoordinates } from "@/mutations/useGraveMutations";
import { trpc } from "@/utils/trpc";
import { ImageViewer } from "@/components/ImageViewer";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";

const SectionTitle = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 pb-1 border-b border-slate-100 dark:border-slate-700">
    {children}
  </p>
);

export default function GraveService() {
  const { userLocation, userState, locationDenied } = useLocationContext();
  const [hasAutoSelectedGrave, setHasAutoSelectedGrave] = useState(false);

  const { control, watch, setValue } = useForm({
    defaultValues: { state: "", graveId: "" },
  });

  const selectedState = watch("state");
  const selectedGraveId = watch("graveId");

  useEffect(() => {
    if (userState && STATES_MY.includes(userState) && !selectedState) {
      setValue("state", userState);
    }
  }, [userState, setValue]);

  useEffect(() => {
    if (locationDenied) showWarning(translate("Location not available"));
  }, [locationDenied]);

  const coordinates = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : null;

  const { data: graves = [], isLoading: isGravesLoading } =
    useGetGravesCoordinates(
      coordinates,
      selectedState ? { state: selectedState } : {},
    );

  // The backend already returns graves nearest-first for the given coordinates,
  // so the first result is the default "nearest grave" selection.
  useEffect(() => {
    if (!hasAutoSelectedGrave && graves.length > 0) {
      setValue("graveId", String(graves[0].id));
      setHasAutoSelectedGrave(true);
    }
  }, [graves, hasAutoSelectedGrave, setValue]);

  const handleStateChange = () => {
    setValue("graveId", "");
    setHasAutoSelectedGrave(false);
  };

  const selectedGrave =
    graves.find((g) => String(g.id) === String(selectedGraveId)) ?? null;

  const {
    data: graveServiceOrganisations = [],
    isLoading: isServicesLoading,
  } = trpc.organisation.getGraveServiceByState.useQuery(
    {
      state: selectedState,
      graveOrganisationId: selectedGrave?.organisation?.id ?? null,
    },
    { enabled: !!selectedState },
  );

  const graveOptions = graves.map((g, i) => ({
    value: String(g.id),
    label: i === 0 ? `${g.name} (${translate("Nearest")})` : g.name,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <BackNavigation title={translate("Grave Service")} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {translate("Grave Service")}
            </p>
            <p className="text-xs text-slate-400">
              {translate("Available Grave Services")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
          <SectionTitle>{translate("Select Location")}</SectionTitle>

          <SelectForm
            name="state"
            control={control}
            label={translate("State")}
            placeholder={translate("Select state")}
            options={STATES_MY}
            onValueChange={handleStateChange}
          />

          <Select2Form
            name="graveId"
            control={control}
            label={translate("Select Grave")}
            placeholder={translate("Select Grave")}
            options={graveOptions}
            disabled={!selectedState || isGravesLoading || graves.length === 0}
            loading={isGravesLoading}
            disabledMessage={
              !selectedState
                ? translate("Select state")
                : translate("No graves found in this state")
            }
            searchPlaceholder={translate("Search name...")}
            emptyMessage={translate("No graves found in this state")}
          />
        </div>

        {!selectedState ? null : locationDenied ? (
          <NoDataCardComponent isNoGPS isPage />
        ) : isGravesLoading ? (
          <ListCardSkeletonComponent />
        ) : graves.length === 0 ? (
          <NoDataCardComponent
            isPage
            title={translate("No graves found in this state")}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-3">
            <SectionTitle>{translate("Available Grave Services")}</SectionTitle>

            {isServicesLoading ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {translate("Loading...")}
              </p>
            ) : graveServiceOrganisations.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {translate(
                  "No grave service organisations available in this state",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {graveServiceOrganisations.map((organisation) => (
                  <Link
                    key={organisation.id}
                    to={`${createPageUrl("OrganisationDetails")}?id=${organisation.id}&graveId=${selectedGraveId}`}
                    className="block"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500 transition-colors">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                        {organisation.photourl ? (
                          <ImageViewer
                            src={organisation.photourl}
                            bucket="bucket-organisation"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {organisation.name}
                          </p>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(organisation.serviceoffered || [])
                            .slice(0, 2)
                            .map((serviceName) => (
                              <Badge
                                key={`${organisation.id}-${serviceName}`}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {serviceName}
                              </Badge>
                            ))}
                          {(organisation.serviceoffered || []).length > 2 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{(organisation.serviceoffered || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
