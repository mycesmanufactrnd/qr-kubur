import { useState, useEffect, useMemo } from 'react';
import { translate } from '@/utils/translations';
import { showWarning } from '@/components/ToastrNotification.jsx';
import { STATES_MY } from '@/utils/enums';
import { useGetGravesCoordinates } from '@/hooks/useGraveMutations';
import { useLocationContext } from '@/providers/LocationProvider';
import { Button } from "@/components/ui/button";
import BackNavigation from '@/components/BackNavigation';
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import FoundDataLength from '@/components/FoundDataLength';
import ShowNearLocation from '@/components/ShowNearLocation';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import GraveCardList from '@/components/GraveCardList';

export default function SearchGrave() {
  const [displayedCount, setDisplayedCount] = useState(10);
  const {
    userLocation,
    locationDenied,
    userState
  } = useLocationContext();

  const [filters, setFilters] = useState(null);

  useEffect(() => {
    if (locationDenied) {
      showWarning(translate('Location not available'));
    }
  }, [locationDenied]);

  const apiParams = useMemo(() => {
    if (filters === null) {
      return { state: userState };
    }
    return filters;
  }, [filters, userState]);

  const { data: gravesList, isLoading } = useGetGravesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    apiParams
  );

  return (
    <div className="space-y-3 pb-6 px-1">
      <BackNavigation title={translate('Search Grave')} />
      <ShowNearLocation />
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1">
        <AdvancedFilters
          parameter={[
            { label: translate("Name"), type: "text", searchColumn: "name" },
            {
              label: translate("State"),
              type: "select",
              searchColumn: "state",
              options: STATES_MY.map((s) => ({ id: s, name: s })),
            },
          ]}
          onApplyFilter={(newFilters) => {
            const cleanedFilters = Object.fromEntries(
              Object.entries(newFilters).filter(([_, v]) => v !== "" && v !== null)
            );
            if (Object.keys(cleanedFilters).length === 0) {
              setFilters(null);
            } else {
              setFilters(cleanedFilters);
            }
            
            setDisplayedCount(10);
          }}
        />
      </div>
      {!isLoading && gravesList && (
        <div className="px-1">
          <FoundDataLength dataList={gravesList} data="Grave(s)" />
        </div>
      )}
      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : !gravesList || gravesList.length === 0 ? (
        <NoDataCardComponent
          title={translate('noGravesFound')}
          description="Sila cuba carian lain atau ubah penapis."
        />
      ) : (
        <div className="space-y-4">
          {gravesList.slice(0, displayedCount).map((grave) => (
            <GraveCardList key={grave.id} grave={grave} />
          ))}
          {displayedCount < gravesList.length && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                className="rounded-full px-10 border-teal-200 text-teal-700 hover:bg-teal-50 shadow-sm"
                onClick={() => setDisplayedCount(prev => prev + 10)}
              >
                {translate('Load more')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}