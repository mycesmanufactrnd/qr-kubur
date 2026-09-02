// @ts-nocheck
import { useState, useMemo } from "react";
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocationContext } from "@/providers/LocationProvider";
import { useGetGravesCoordinates } from "@/mutations/useGraveMutations";
import { useGetMosqueCoordinates } from "@/mutations/useMosqueMutations";
import { useGetTahfizCoordinates } from "@/mutations/useTahfizMutations";
import TahfizCardList from "@/components/TahfizCardList";
import GraveCardList from "@/components/GraveCardList";
import MosqueCardList from "@/components/MosqueCardList";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";

export default function Favorites() {
  const [activeTab, setActiveTab] = useState("graves");
  const [favoriteVersion, setFavoriteVersion] = useState(0);
  const { userLocation } = useLocationContext();

  const favoritedMosqueIds = useMemo(
    () => JSON.parse(localStorage.getItem("favoritedmosque") || "[]"),
    [favoriteVersion],
  );
  const favoritedGraveIds = useMemo(
    () => JSON.parse(localStorage.getItem("favoritedgrave") || "[]"),
    [favoriteVersion],
  );
  const favoritedTahfizIds = useMemo(
    () => JSON.parse(localStorage.getItem("favoritedtahfiz") || "[]"),
    [favoriteVersion],
  );

  const coordinates = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : { latitude: 0, longitude: 0 };

  const mosqueFilters =
    favoritedMosqueIds.length > 0 ? { ids: favoritedMosqueIds } : null;
  const { data: mosques = [], isLoading: isMosquesLoading } =
    useGetMosqueCoordinates(
      mosqueFilters ? coordinates : null,
      mosqueFilters ?? {},
    );

  const graveFilters =
    favoritedGraveIds.length > 0 ? { ids: favoritedGraveIds } : null;
  const { data: graves = [], isLoading: isGravesLoading } =
    useGetGravesCoordinates(
      graveFilters ? coordinates : null,
      graveFilters ?? {},
    );

  const hasFavoritedTahfiz = favoritedTahfizIds.length > 0;
  const { data: tahfiz = [], isLoading: isTahfizLoading } =
    useGetTahfizCoordinates({
      coordinates: hasFavoritedTahfiz ? coordinates : null,
      filterIds: hasFavoritedTahfiz
        ? favoritedTahfizIds.map((f) => f.id)
        : undefined,
    });

  const onFavoriteChange = () => setFavoriteVersion((prev) => prev + 1);

  return (
    <div className="space-y-3 pb-6 px-1">
      <BackNavigation title={translate("Favorites")} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full px-1"
      >
        <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
          <TabsTrigger
            value="graves"
            className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700"
          >
            {translate("Graves")}
          </TabsTrigger>
          <TabsTrigger
            value="mosques"
            className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700"
          >
            {translate("Mosques")}
          </TabsTrigger>
          <TabsTrigger
            value="tahfiz"
            className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700"
          >
            {translate("Tahfiz")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mosques" className="mt-4 space-y-4">
          {isMosquesLoading ? (
            <ListCardSkeletonComponent />
          ) : mosques.length === 0 ? (
            <NoDataCardComponent
              isPage
              title={translate("No Favorited Mosques Found")}
              redirectTo="SearchMosque"
              redirectLabel={translate("Browse Mosques")}
            />
          ) : (
            mosques.map((mosque) => (
              <MosqueCardList
                key={mosque.id}
                mosque={{ ...mosque, distance: null }}
                onFavoriteChange={onFavoriteChange}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="graves" className="mt-4 space-y-4">
          {isGravesLoading ? (
            <ListCardSkeletonComponent />
          ) : graves.length === 0 ? (
            <NoDataCardComponent
              isPage
              title={translate("No Favorited Graves Found")}
              redirectTo="SearchGrave"
              redirectLabel={translate("Browse Graves")}
            />
          ) : (
            graves.map((grave) => (
              <GraveCardList
                key={grave.id}
                grave={{ ...grave, distance: null }}
                onFavoriteChange={onFavoriteChange}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="tahfiz" className="mt-4 space-y-4">
          {isTahfizLoading ? (
            <ListCardSkeletonComponent />
          ) : tahfiz.length === 0 ? (
            <NoDataCardComponent
              isPage
              title={translate("No Favorited Tahfiz Found")}
              redirectTo="SearchTahfiz"
              redirectLabel={translate("Browse Tahfiz")}
            />
          ) : (
            tahfiz.map((center) => (
              <TahfizCardList
                key={center.id}
                tahfiz={{ ...center, distance: null }}
                onFavoriteChange={onFavoriteChange}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
