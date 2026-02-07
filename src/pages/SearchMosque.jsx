import { useState } from 'react';
import { useGetMosqueCoordinates } from '@/hooks/useMosqueMutations';
import { Search } from 'lucide-react';
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
import MosqueCardList from '@/components/MosqueCardList';

export default function SearchMosque() {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');
  const [displayedCount, setDisplayedCount] = useState(10);

  const { userLocation, userState, locationDenied } = useLocationContext();
  
  const { data: mosques = [], isLoading } = useGetMosqueCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null,
    {
        state: selectedState === 'nearby' ? userState : selectedState,
        name: manualSearchQuery
    }
  );

  const handleSearchTrigger = () => {
    setManualSearchQuery(searchQuery);
    setDisplayedCount(10);
  };

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Search Mosque') || "Cari Masjid"} />

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={translate('mosqueName') || "Nama Masjid"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
              className="h-9"
            />

            <Button onClick={handleSearchTrigger} className="h-9">
              <Search className="w-4 h-4 mr-1" /> {translate('Search')}
            </Button>
          </div>

          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={translate('state')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
              {STATES_MY.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {locationDenied && selectedState === "nearby" && (
        <LocationDeniedComponent onRetry={requestLocation}/>
      )}

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : mosques.length === 0 ? (
        <NoDataCardComponent title={translate('noMosqueFound')} />
      ) : (
        <div className="space-y-4 px-1">
          {mosques.slice(0, displayedCount).map(item => (
            <MosqueCardList 
              key={item.id} 
              mosque={item} 
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