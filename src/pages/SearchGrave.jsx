import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import PullToRefresh from '@/components/mobile/PullToRefresh';

export default function SearchGrave() {
  const location = useLocation();
  const defaultFilter = location.state || {};
  const [displayedCount, setDisplayedCount] = useState(10);
  const [favoriteVersion, setFavoriteVersion] = useState(0);

  const favoritedGraveIds = useMemo(() => {
    return JSON.parse(localStorage.getItem('favoritedgrave') || '[]');
  }, [favoriteVersion]);
  
  const { userLocation, locationDenied, userState, requestLocation } = useLocationContext();

  useEffect(() => {
    if (defaultFilter.isFavorited) {
      setFilters({ ids: favoritedGraveIds });
    }
  }, [favoriteVersion, defaultFilter.isFavorited]);

  const [filters, setFilters] = useState(() => {
    if (defaultFilter.isFavorited && favoritedGraveIds.length > 0) {
      return { ids: favoritedGraveIds };
    }
    return { state: userState };
  });

  useEffect(() => {
    if (locationDenied) {
      showWarning(translate('Location not available'));
    }
  }, [locationDenied]);

  const { data: gravesList = [], isLoading, refetch } = useGetGravesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    filters
  );

  const handlePullRefresh = async () => {
    if (requestLocation) {
      await requestLocation({ forceRefresh: true });
    }
    await refetch();
  };

  if (defaultFilter.isFavorited && favoritedGraveIds.length === 0) {
    return (
      <PullToRefresh onRefresh={handlePullRefresh}>
        <div className="space-y-3 pb-6 px-1">
          <BackNavigation title={translate('Search Grave')} />
          <div className="flex items-center gap-2 rounded-xl">
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
              onApplyFilter={setFilters}
            />
          </div>
          <div className="px-1">
            <FoundDataLength dataList={[]} data="Grave(s)" />
          </div>
          <NoDataCardComponent isPage title={translate('No Favorited Graves Found')} />
        </div>
      </PullToRefresh>
    );
  }

  return (
    <div className="space-y-3 pb-6 px-1">
      <BackNavigation title={translate('Search Grave')} />
      {!defaultFilter.isFavorited && <ShowNearLocation />}
      
      <div className="flex items-center gap-2 rounded-xl">
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
            setFilters(prev => ({
              ...newFilters,
              ...(defaultFilter.isFavorited ? { ids: favoritedGraveIds } : {})
            }));
            setDisplayedCount(10);
          }}
        />
      </div>
      <PullToRefresh onRefresh={handlePullRefresh}>
        {!isLoading && (
          <div className="px-1">
            <FoundDataLength dataList={gravesList} data="Grave(s)" />
          </div>
        )}

        {isLoading ? (
          <ListCardSkeletonComponent />
        ) : locationDenied ? (
          <NoDataCardComponent isNoGPS/>
        ) : gravesList.length === 0 ? (
          <NoDataCardComponent
            isPage
            title={translate('No Graves Found')}
            description="Sila cuba carian lain atau ubah penapis."
          />
        ) : (
          <div className="space-y-4">
            {gravesList.slice(0, displayedCount).map((grave) => (
              <GraveCardList 
                key={grave.id} 
                grave={grave} 
                onFavoriteChange={() => setFavoriteVersion(prev => prev + 1)}
              />
            ))}

            {displayedCount < gravesList.length && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  className="rounded-full px-10 border-teal-200 text-teal-700 hover:bg-teal-50 shadow-sm"
                  onClick={() => setDisplayedCount(prev => prev + 10)}
                >
                  {translate('Load More')}
                </Button>
              </div>
            )}
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}