import { useEffect, useMemo, useState } from 'react';
import { useGetMosqueCoordinates } from '@/hooks/useMosqueMutations';
import { Button } from "@/components/ui/button";
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { STATES_MY } from '@/utils/enums';
import { useLocationContext } from '@/providers/LocationProvider';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import MosqueCardList from '@/components/MosqueCardList';
import AdvancedFilters from '@/components/mobile/AdvancedFilters';
import FoundDataLength from '@/components/FoundDataLength';
import { useLocation } from 'react-router-dom';
import ShowNearLocation from '@/components/ShowNearLocation';
import { showWarning } from '@/components/ToastrNotification';

export default function SearchMosque() {
  const location = useLocation();
  const defaultFilter = location.state || {};
  const [displayedCount, setDisplayedCount] = useState(10);
  const { userLocation, userState, locationDenied } = useLocationContext();

  const [favoriteVersion, setFavoriteVersion] = useState(0);
  
  useEffect(() => {
    if (locationDenied) {
      showWarning(translate('Location not available'));
    }
  }, [locationDenied]);

  const favoritedMosqueIds = useMemo(() => {
    return JSON.parse(localStorage.getItem('favoritedmosque') || '[]');
  }, [favoriteVersion]);

  useEffect(() => {
    if (defaultFilter.isFavorited) {
      setFilters({ ids: favoritedMosqueIds });
    }
  }, [favoriteVersion, favoritedMosqueIds]);
  
  const [filters, setFilters] = useState(() => {
    if (defaultFilter.isFavorited && favoritedMosqueIds.length > 0) {
      return { ids: favoritedMosqueIds };
    }
    
    return { state: userState };
  });
  
  const { data: mosques = [], isLoading } = useGetMosqueCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null,
    filters
  );

  if (defaultFilter.isFavorited && favoritedMosqueIds.length === 0) {
    return (
      <div className="space-y-3 pb-2">
        <BackNavigation title={translate('Search Mosque') || "Cari Masjid"} />
        <ShowNearLocation />
        <div className="flex items-center gap-2 rounded-xl">
          <AdvancedFilters
            parameter={[
              { label: "Name", type: "text", searchColumn: "name" },
              {
                label: "State",
                type: "select",
                searchColumn: "state",
                options: STATES_MY.map((s) => ({ id: s, name: s })),
              },
              {
                label: "Can Arrange Funeral",
                type: "checkbox",
                searchColumn: "canarrangefuneral",
              },
              {
                label: "Has Death Charity",
                type: "checkbox",
                searchColumn: "hasdeathcharity",
              },
            ]}
            onApplyFilter={setFilters}
          />
        </div>
        <FoundDataLength dataList={[]} data="Mosque(s)" />
        <NoDataCardComponent isPage title={translate('No Favorited Mosques Found')} />
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Search Mosque') || "Cari Masjid"} />
      <ShowNearLocation />
      <div className="flex items-center gap-2 rounded-xl">
        <AdvancedFilters
          parameter={[
            { label: "Name", type: "text", searchColumn: "name" },
            {
              label: "State",
              type: "select",
              searchColumn: "state",
              options: STATES_MY.map((s) => ({ id: s, name: s })),
            },
            {
              label: "Can Arrange Funeral",
              type: "checkbox",
              searchColumn: "canarrangefuneral",
            },
            {
              label: "Has Death Charity",
              type: "checkbox",
              searchColumn: "hasdeathcharity",
            },
          ]}
          onApplyFilter={(newFilters) => {
            setFilters(prev => ({
              ...newFilters,
              ...(defaultFilter.isFavorited ? { ids: favoritedMosqueIds } : {})
            }));
          }}
        />
      </div>

      {!isLoading && <FoundDataLength dataList={mosques} data="Mosque(s)" />}

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : locationDenied ? (
        <NoDataCardComponent isNoGPS/>
      ) : mosques.length === 0 ? (
        <NoDataCardComponent title={translate('No Mosque Found')} />
      ) : (
        <div className="space-y-4 px-1">
          {mosques.slice(0, displayedCount).map(item => (
            <MosqueCardList 
              key={item.id} 
              mosque={item}
              onFavoriteChange={() => setFavoriteVersion(prev => prev + 1)}
            />
          ))}

          {displayedCount < mosques.length && (
            <div className="text-center py-4">
              <Button variant="ghost" onClick={() => setDisplayedCount(prev => prev + 10)}>
                {translate('loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}