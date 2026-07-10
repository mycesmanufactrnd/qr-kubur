// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { translate } from "@/utils/translations";
import { showWarning } from "@/components/ToastrNotification.jsx";
import { STATES_MY } from "@/utils/enums";
import { useGetGravesCoordinates } from "@/mutations/useGraveMutations";
import { useLocationContext } from "@/providers/LocationProvider";
import BackKeyNavigation from "@/components/BackKeyNavigation";
import AdvancedFilters from "@/components/mobile/AdvancedFilters.jsx";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";
import FoundDataLength from "@/components/FoundDataLength";
import ShowNearLocation from "@/components/ShowNearLocation";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import GraveCardList from "@/components/GraveCardList";
import PullToRefresh from "@/components/mobile/PullToRefresh";

export default function SearchGrave() {
  const location = useLocation();
  const defaultFilter = location.state || {};
  const [displayedCount, setDisplayedCount] = useState(10);
  const [favoriteVersion, setFavoriteVersion] = useState(0);

  const favoritedGraveIds = useMemo(() => {
    return JSON.parse(localStorage.getItem("favoritedgrave") || "[]");
  }, [favoriteVersion]);

  const { userLocation, locationDenied, userState, requestLocation } =
    useLocationContext();

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
      showWarning(translate("Location not available"));
    }
  }, [locationDenied]);

  const {
    data: gravesList = [],
    isLoading,
    refetch,
  } = useGetGravesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    filters,
  );

  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDisplayedCount((prev) => prev + 10);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayedCount, gravesList.length]);

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
          <BackKeyNavigation title={translate("Search Grave")} />
          <div className="flex items-center gap-2 rounded-xl">
            <AdvancedFilters
              parameter={[
                {
                  label: translate("Name"),
                  type: "text",
                  searchColumn: "name",
                },
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
            <FoundDataLength dataList={[]} data="graves" />
          </div>
          <NoDataCardComponent
            isPage
            title={translate("No Favorited Graves Found")}
          />
        </div>
      </PullToRefresh>
    );
  }

  return (
    <div className="space-y-3 pb-6 px-1">
      <BackKeyNavigation title={translate("Search Grave")} />

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
            setFilters((prev) => ({
              ...newFilters,
              ...(defaultFilter.isFavorited ? { ids: favoritedGraveIds } : {}),
            }));
            setDisplayedCount(10);
          }}
        />
      </div>
      <PullToRefresh onRefresh={handlePullRefresh}>
        {!isLoading && (
          <div className="px-1">
            <FoundDataLength
              dataList={gravesList}
              data={`${translate("graves")}`}
            />
          </div>
        )}

        {isLoading ? (
          <ListCardSkeletonComponent />
        ) : locationDenied ? (
          <NoDataCardComponent isNoGPS isPage />
        ) : gravesList.length === 0 ? (
          <NoDataCardComponent isPage />
        ) : (
          <div className="space-y-4">
            {gravesList.slice(0, displayedCount).map((grave) => (
              <GraveCardList
                key={grave.id}
                grave={grave}
                onFavoriteChange={() => setFavoriteVersion((prev) => prev + 1)}
              />
            ))}

            {displayedCount < gravesList.length && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
              </div>
            )}
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}
