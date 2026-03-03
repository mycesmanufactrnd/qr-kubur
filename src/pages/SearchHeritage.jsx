import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showWarning } from '@/components/ToastrNotification.jsx';
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import HeritageCardList from '@/components/HeritageCardList';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { STATES_MY } from '@/utils/enums';
import { useGetHeritageSitesCoordinates } from '@/hooks/useHeritageMutations';
import { useLocationContext } from '@/providers/LocationProvider';
import ShowNearLocation from '@/components/ShowNearLocation';

export default function SearchGrave() {
  const [displayedCount, setDisplayedCount] = useState(10);
  const { userLocation, locationDenied, userState } = useLocationContext();
  const [filters, setFilters] = useState({ state: userState });

  useEffect(() => {
    if (locationDenied) {
      showWarning('Lokasi tidak tersedia');
    }
  }, [locationDenied]);

  const {
    data: heritageSiteList = [],
    isLoading
  } = useGetHeritageSitesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : undefined,
    filters
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title="Search Heritage Site" />
      <ShowNearLocation />
      <div className="flex items-center gap-2 rounded-xl">
        <AdvancedFilters
          parameter={[
            { label: "Name", type: "text", searchColumn: "name" },
            { label: "Address", type: "text", searchColumn: "address" },
            {
              label: "State",
              type: "select",
              searchColumn: "state",
              options: STATES_MY.map((s) => ({ id: s, name: s })),
            },
          ]}
          onApplyFilter={setFilters}
        />
      </div>

      {isLoading ? (
        <ListCardSkeletonComponent/>
      ) : locationDenied ? (
        <NoDataCardComponent
          isNoGPS
          title={translate('No Heritage Site Found')}
          description="Sila cuba carian lain atau ubah penapis."
        />
      ) : heritageSiteList.length === 0 ? (
        <NoDataCardComponent isPage/>
      ) : (
        <div className="space-y-3">
          {heritageSiteList.map((heritage, index) => (
            <HeritageCardList 
              key={heritage.id}
              site={heritage} 
              distance={heritage.distance}
              index={index}
              nextPageUrl={'HeritageDetails'}
            />
          ))}

          {displayedCount < heritageSiteList.length && (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)}>
                {translate('Load More')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}