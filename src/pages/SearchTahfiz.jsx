import { useState } from 'react';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { Building2, Navigation, MapPin, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import LocationDeniedComponent from '@/components/LocationDeniedComponent';
import { STATES_MY } from '@/utils/enums';
import { useLocationContext } from '@/providers/LocationProvider';
import { requestLocation } from '@/utils/helpers';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import TahfizCardList from '@/components/TahfizCardList';

export default function SearchTahfiz() {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');

  const { userLocation, userState, locationDenied } = useLocationContext();
  
  const { data: tahfizCenters, isLoading } = useGetTahfizCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    selectedState === 'nearby' ? userState : selectedState,
    manualSearchQuery
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Search Tahfiz') || "Search Tahfiz Center"} />

      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={translate('tahfizName')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 dark:bg-gray-700"
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
              <SelectTrigger className="h-9 dark:bg-gray-700">
                <SelectValue placeholder={translate('state')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
                {STATES_MY.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {locationDenied && selectedState === "nearby" && (
        <LocationDeniedComponent onRetry={requestLocation}/>
      )}

      {isLoading ? (
        <ListCardSkeletonComponent/>
      ) : tahfizCenters.length === 0 ? (
        <NoDataCardComponent
          title={translate('noTahfizFound')}
          description="Sila cuba carian lain atau ubah penapis."
        />
      ) : (
        <div className="space-y-2">
          {tahfizCenters.map(tahfiz => (
            <TahfizCardList 
              key={tahfiz.id}
              bucketId={'bucket-grave'}
              tahfiz={tahfiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
