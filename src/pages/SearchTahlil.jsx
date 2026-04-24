import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { showWarning } from '@/components/ToastrNotification.jsx';
import { STATES_MY } from '@/utils/enums';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { useLocationContext } from '@/providers/LocationProvider';
import { Button } from "@/components/ui/button";
import BackNavigation from '@/components/BackNavigation';
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { createPageUrl, resolveFileUrl } from '@/utils';
import { showEarthDistance, openDirections } from '@/utils/helpers';
import { MapPin, Navigation, Phone } from 'lucide-react';
import BannerImageWithFallback from '@/components/BannerImageWithFallback';
import { useLocation } from 'react-router-dom';

export default function SearchTahlil() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultFilter = location.state || {};
  const [displayedCount, setDisplayedCount] = useState(10);
  const {
    userLocation,
    locationDenied,
    userState: currentUserLocationState,
  } = useLocationContext();

  const [favoriteVersion, setFavoriteVersion] = useState(0);

  const favoritedTahfizIds = useMemo(() => {
    const favs = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
    return favs.map((fav) => fav.id);
  }, [favoriteVersion]);

  const [filters, setFilters] = useState(() => {
    if (defaultFilter.isFavorited && favoritedTahfizIds.length > 0) {
      return { ids: favoritedTahfizIds };
    }
    return null;
  });

  useEffect(() => {
    if (locationDenied) showWarning(translate('Location not available'));
  }, [locationDenied]);

  useEffect(() => {
    if (defaultFilter.isFavorited) {
      const updatedFavorites = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
      const updatedIds = updatedFavorites.map((f) => f.id);
      setFilters((prev) => ({ ...prev, ids: updatedIds }));
    }
  }, [favoriteVersion]);

  const filterState = useMemo(() => {
    if (filters === null) return currentUserLocationState;
    return filters.state || '';
  }, [filters, currentUserLocationState]);

  const filterName = useMemo(() => filters?.name || '', [filters]);
  const filterAddress = useMemo(() => filters?.address || '', [filters]);

  const { data: tahfizList, isLoading } = useGetTahfizCoordinates({
    coordinates: userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    isTahlilServiceOnly: true,
    filterName: filters?.ids ? null : filterName,
    filterState: filters?.ids ? null : filterState,
    filterAddress: filters?.ids ? null : filterAddress,
  });

  const visibleList = useMemo(() => {
    if (!tahfizList) return [];
    if (filters?.ids?.length) {
      return tahfizList.filter((t) => filters.ids.includes(t.id));
    }
    return tahfizList;
  }, [tahfizList, filters?.ids]);

  if (defaultFilter.isFavorited && favoritedTahfizIds.length === 0) {
    return (
      <div className="space-y-3 pb-6 px-3">
        <BackNavigation title={translate('Mohon Tahlil')} />
        <NoDataCardComponent isPage title={translate('No Favorited Tahfiz Found')} />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8 px-3">
      <BackNavigation title={translate('Mohon Tahlil')} />

      <div className="flex items-center gap-2">
        <AdvancedFilters
          parameter={[
            { label: translate('Name'), type: 'text', searchColumn: 'name' },
            { label: translate('Address'), type: 'text', searchColumn: 'address' },
            {
              label: translate('State'),
              type: 'select',
              searchColumn: 'state',
              options: STATES_MY.map((s) => ({ id: s, name: s })),
            },
          ]}
          onApplyFilter={(newFilters) => {
            const cleaned = Object.fromEntries(
              Object.entries(newFilters).filter(([, v]) => v !== '' && v !== null),
            );
            const merged = {
              ...cleaned,
              ...(defaultFilter.isFavorited ? { ids: favoritedTahfizIds } : {}),
            };
            setFilters(Object.keys(merged).length === 0 ? null : merged);
            setDisplayedCount(10);
          }}
        />
      </div>

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : locationDenied ? (
        <NoDataCardComponent isNoGPS />
      ) : !visibleList.length ? (
        <NoDataCardComponent isPage />
      ) : (
        <div className="space-y-3">
          {visibleList.slice(0, displayedCount).map((tahfiz) => (
            <TahlilQuickCard
              key={tahfiz.id}
              tahfiz={tahfiz}
              onRequest={() =>
                navigate(createPageUrl(`TahlilRequestPage?tahfiz=${tahfiz.id}`))
              }
            />
          ))}
          {displayedCount < visibleList.length && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="rounded-full px-10 border-teal-200 text-teal-700 hover:bg-teal-50 shadow-sm"
                onClick={() => setDisplayedCount((prev) => prev + 10)}
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

function TahlilQuickCard({ tahfiz, onRequest }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="relative h-28 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 overflow-hidden">
        <BannerImageWithFallback
          src={resolveFileUrl(tahfiz.photourl, 'tahfiz-center')}
          alt={tahfiz.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {tahfiz.distance && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/30 backdrop-blur-md rounded-full border border-white/20">
            <MapPin className="w-3 h-3 text-white" />
            <span className="text-[11px] font-semibold text-white">
              {showEarthDistance(tahfiz.distance)}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
          <p className="text-sm font-bold text-white leading-tight line-clamp-1">{tahfiz.name}</p>
          <p className="text-white/70 text-[11px] flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {tahfiz.state}
          </p>
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {tahfiz.serviceoffered?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tahfiz.serviceoffered.slice(0, 4).map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full"
              >
                {s}
              </span>
            ))}
            {tahfiz.serviceoffered.length > 4 && (
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-400 text-[10px] rounded-full">
                +{tahfiz.serviceoffered.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={onRequest}
            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-semibold shadow-sm active:opacity-80"
          >
            {translate('Request Tahlil')}
          </Button>
          {tahfiz.phone && (
            <a
              href={`tel:${tahfiz.phone}`}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {tahfiz.latitude && tahfiz.longitude && (
            <button
              onClick={() => openDirections(tahfiz.latitude, tahfiz.longitude)}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm active:opacity-75 shrink-0"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
