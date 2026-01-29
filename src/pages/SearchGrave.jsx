import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showSuccess, showWarning } from '@/components/ToastrNotification.jsx';
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { STATES_MY } from '@/utils/enums';
import { useGetGravesCoordinates } from '@/hooks/useGraveMutations';
import { openDirections, showEarthDistance } from '@/utils/helpers';
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

  const { data: gravesList, isLoading } = useGetGravesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    filters
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title="Search Grave" />

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
              {
                label: "Organisation",
                type: "select",
                searchColumn: "organisationId",
                options: [
                  { id: 1, name: "Org 1" },
                  { id: 2, name: "Org 2" },
                ],
              },
            ]}
            onApplyFilter={setFilters}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <ListCardSkeletonComponent/>
      ) : gravesList.length === 0 ? (
        <NoDataCardComponent
          title={translate('noGravesFound')}
          description="Sila cuba carian lain atau ubah penapis."
        />
      ) : (
        <div className="space-y-3">
          {gravesList.map(grave => (
            <Card
              key={grave.id}
              className="mb-2 border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={createPageUrl('GraveDetails') + `?id=${grave.id}`}
                    className="flex items-start gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {grave.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {grave.state}
                      </p>

                      {grave.distance !== null && (
                        <p className="text-xs text-emerald-600 mt-1">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {showEarthDistance(grave.distance)}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col gap-1">
                    {grave.latitude && grave.longitude && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDirections(grave.latitude, grave.longitude)
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Navigation className="w-3 h-3 mr-1" /> {translate('Direction')}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}${createPageUrl('GraveDetails')}?id=${grave.id}`;
                        if (navigator.share) {
                          navigator.share({ title: grave.name, url });
                        } else {
                          navigator.clipboard.writeText(url);
                          showSuccess(translate('Link copied'))
                        }
                      }}
                      className="h-7 text-xs w-full dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Share2 className="w-3 h-3 mr-1" /> {translate('Share')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {displayedCount < gravesList.length && (
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