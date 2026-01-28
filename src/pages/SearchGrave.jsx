import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { Search, MapPin, Navigation, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showWarning } from '@/components/ToastrNotification.jsx';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { STATES_MY } from '@/utils/enums';
import { useGetGravesCoordinates } from '@/hooks/useGraveMutations';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { useLocationContext } from '@/providers/LocationProvider';

export default function SearchGrave() {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');
  const [displayedCount, setDisplayedCount] = useState(10);
  const {
    userLocation,
    userState,
    locationDenied,
  } = useLocationContext();

  useEffect(() => {
    if (locationDenied) {
      showWarning('Lokasi tidak tersedia');
    }
  }, [locationDenied]);

  const { data: gravesList, isLoading } = useGetGravesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    selectedState === 'nearby' ? userState : selectedState,
    manualSearchQuery
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title="Search Graves" />

      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={translate('Grave')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Button
              onClick={() => setManualSearchQuery(searchQuery)}
              className="h-9"
            >
              <Search className="w-4 h-4 mr-1" /> {translate('Search')}
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder={translate('state')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700">
                <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
                {STATES_MY.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                        <Navigation className="w-3 h-3 mr-1" /> Arah
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
                          showSuccess('Pautan disalin');
                        }
                      }}
                      className="h-7 text-xs w-full dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Kongsi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {displayedCount < gravesList.length && (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}