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

export default function SearchGrave() {
  const [displayedCount, setDisplayedCount] = useState(10);
  const {
    userLocation,
    locationDenied,
    userState
  } = useLocationContext();
  
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

      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          <AdvancedFilters
            parameter={[
              { label: "Name", type: "text", searchColumn: "name" },
              {
                label: "State",
                type: "select",
                searchColumn: "state",
                options: STATES_MY.map((s) => ({ id: s, name: s })),
              },
            ]}
            onApplyFilter={setFilters}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <ListCardSkeletonComponent/>
      ) : heritageSiteList.length === 0 ? (
        <NoDataCardComponent
          title={translate('noGravesFound')}
          description="Sila cuba carian lain atau ubah penapis."
        />
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
                {translate('Load more')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}