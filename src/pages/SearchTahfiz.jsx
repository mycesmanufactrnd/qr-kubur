import { useState, useEffect, useMemo } from 'react';
import { translate } from '@/utils/translations';
import { showWarning } from '@/components/ToastrNotification.jsx';
import { STATES_MY } from '@/utils/enums';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations'; 
import { useLocationContext } from '@/providers/LocationProvider';
import { Button } from "@/components/ui/button";
import BackNavigation from '@/components/BackNavigation';
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import FoundDataLength from '@/components/FoundDataLength';
import ShowNearLocation from '@/components/ShowNearLocation';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import TahfizCardList from '@/components/TahfizCardList'; 
import { useLocation } from 'react-router-dom';

export default function SearchTahfiz() {
  const location = useLocation();
  const defaultFilter = location.state || {};
  const [displayedCount, setDisplayedCount] = useState(10);
  const {
    userLocation,
    locationDenied,
    userState: currentUserLocationState 
  } = useLocationContext();

  const [favoriteVersion, setFavoriteVersion] = useState(0);
  
  const favoritedTahfizIds = useMemo(() => {
    const favs = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
    return favs.map(fav => fav.id);
  }, [favoriteVersion]);

  const [filters, setFilters] = useState(() => {
    if (defaultFilter.isFavorited && favoritedTahfizIds.length > 0) {
      return { ids: favoritedTahfizIds };
    }
    return null;
  });

  useEffect(() => {
    if (locationDenied) {
      showWarning(translate('Location not available'));
    }
  }, [locationDenied]);

  useEffect(() => {
    if (defaultFilter.isFavorited) {
      const updatedFavorites = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
      const updatedIds = updatedFavorites.map(f => f.id);
      setFilters(prev => ({ ...prev, ids: updatedIds }));
    }
  }, [favoriteVersion]);

  const filterState = useMemo(() => {
    if (filters === null) return currentUserLocationState;
    return filters.state || "";
  }, [filters, currentUserLocationState]);

  const filterName = useMemo(() => {
    return filters?.name || "";
  }, [filters]);

  const filterAddress = useMemo(() => {
    return filters?.address || "";
  }, [filters]);

  const { data: tahfizList, isLoading } = useGetTahfizCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null,
    filters?.ids ? null : filterState, 
    filters?.ids ? null : filterName,
    filters?.ids ? null : filterAddress,
  );

  if (defaultFilter.isFavorited && favoritedTahfizIds.length === 0) {
    return (
      <div className="space-y-3 pb-6 px-1">
        <BackNavigation title={translate('Search Tahfiz')} />
        <FoundDataLength dataList={[]} data="Tahfiz" />
        <NoDataCardComponent isPage title={translate('No Favorited Tahfiz Found')} />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6 px-1">
      <BackNavigation title={translate('Search Tahfiz')} />
      <ShowNearLocation />
      <AdvancedFilters
        parameter={[
          { label: translate("Name"), type: "text", searchColumn: "name" },
          { label: translate("Address"), type: "text", searchColumn: "address" },
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
          const mergedFilters = {
            ...cleanedFilters,
            ...(defaultFilter.isFavorited ? { ids: favoritedTahfizIds } : {})
          };

          setFilters(Object.keys(mergedFilters).length === 0 ? null : mergedFilters);
          setDisplayedCount(10);
        }}
      />

      <br/>
      
      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : !tahfizList || tahfizList.length === 0 ? (
        <NoDataCardComponent/>
      ) : (
        <div className="space-y-4">
          {tahfizList.slice(0, displayedCount).map((tahfiz) => (
            <TahfizCardList 
              key={tahfiz.id} 
              tahfiz={tahfiz} 
              onFavoriteChange={() => setFavoriteVersion(prev => prev + 1)}
            />
          ))}
          {displayedCount < tahfizList.length && (
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