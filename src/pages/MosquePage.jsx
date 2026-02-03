import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { useGetMosqueCoordinates } from '@/hooks/useMosqueMutations';
import { Building2, Navigation, MapPin, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showSuccess, showWarning } from '@/components/ToastrNotification.jsx';
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { STATES_MY } from '@/utils/enums';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { useLocationContext } from '@/providers/LocationProvider';

export default function SearchMosque() {
  const [displayedCount, setDisplayedCount] = useState(10);
  const { userLocation, locationDenied, userState } = useLocationContext();
  
  const [filters, setFilters] = useState({ state: userState || 'Selangor' });

  useEffect(() => {
    if (locationDenied) {
      showWarning('Lokasi tidak tersedia. Sila aktifkan GPS untuk jarak tepat.');
    }
  }, [locationDenied]);

  const { data: mosques = [], isLoading } = useGetMosqueCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null,
    filters 
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Search Mosque') || "Cari Masjid"} />

      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          {/* 3. AdvancedFilters will update the 'filters' object */}
          <AdvancedFilters
            parameter={[
              { label: "Nama Masjid", type: "text", searchColumn: "name" },
              {
                label: "Negeri",
                type: "select",
                searchColumn: "state",
                options: STATES_MY.map((s) => ({ id: s, name: s })),
              }
            ]}
            onApplyFilter={(newFilters) => {
              setFilters(newFilters);
              setDisplayedCount(10); // Reset list view
            }}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : mosques.length === 0 ? (
        <NoDataCardComponent
          title={translate('noMosqueFound') || "Masjid Tidak Dijumpai"}
          description="Cuba tukar penapis negeri atau nama masjid."
        />
      ) : (
        <div className="space-y-3">
          {mosques.slice(0, displayedCount).map(mosque => (
            <Card key={mosque.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link 
                    to={createPageUrl('MosqueDetailsPage') + `?id=${mosque.id}`}
                    className="flex items-start gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                        {mosque.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {mosque.state}
                      </p>

                      {mosque.distance && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {showEarthDistance(mosque.distance)}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col gap-1 shrink-0">
                    {mosque.latitude && mosque.longitude && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDirections(mosque.latitude, mosque.longitude);
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Navigation className="w-3 h-3 mr-1" /> Arah
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = `${window.location.origin}${createPageUrl('MosqueDetailsPage')}?id=${mosque.id}`;
                        if (navigator.share) {
                          navigator.share({ title: mosque.name, url });
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

          {displayedCount < mosques.length && (
            <div className="text-center py-2">
              <Button variant="ghost" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)}>
                Lihat lebih banyak
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}