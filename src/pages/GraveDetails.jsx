import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { MapPin, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShareButton from '@/components/ShareButton';
import DirectionButton from '@/components/DirectionButton';
import BackNavigation from '@/components/BackNavigation';
import { useGetGraveById } from '@/hooks/useGraveMutations';
import { useGetDeadPersonPaginated } from '@/hooks/useDeadPersonMutations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { translate } from '@/utils/translations';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import { translate } from '@/utils/translations';

export default function GraveDetails() {
  const [searchParams] = useSearchParams();
  const graveId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  const { data: grave, isLoading: graveLoading, isError: isGraveDetailsError } = useGetGraveById(graveId);

  const { deadPersonsList, isLoading: personsLoading } = useGetDeadPersonPaginated({
    filterGrave: graveId || undefined,
    pageSize: 100,
  });

  const persons = deadPersonsList?.items ?? [];

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  const filtered = persons.filter(p => {
    const matchesName = !searchName || p.name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesDate = !searchDate || (p.dateofdeath && String(p.dateofdeath).startsWith(searchDate));
    return matchesName && matchesDate;
  });

  const displayedPersons = filtered.slice(0, displayedCount);

  if (graveLoading) {
    return (
      <PageLoadingComponent/>
    );  
  }

  if (!grave || isGraveDetailsError) {
    return (
      <NoDataCardComponent
        isPage={true}
        title={translate('noGravesFound')}
        description="Tiada Maklumat Dijumpai"
      />
    );
  }

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={grave.name} />
      <Card className="border-0 shadow-sm dark:bg-gray-800 mx-2">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-teal-600 dark:text-teal-300" />
            </div>
            <div className="flex-1 min-w-0">
              {grave.organisation?.name && (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  <span className="truncate inline-block max-w-full align-middle">
                    {grave.organisation.name}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">
                    ({translate('Managed By')})
                  </span>
                </p>
              )}
            </div>
          </div>
          {(grave.state || grave.block || grave.lot || grave.totalgraves !== null && grave.totalgraves !== undefined) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
              {grave.state && <strong>{grave.state}</strong>}
              {grave.block && <span>Blok: <strong>{grave.block}</strong></span>}
              {grave.lot && <span>Lot: <strong>{grave.lot}</strong></span>}
              {grave.totalgraves !== null && grave.totalgraves !== undefined && (
                <span>Jumlah Kubur: <strong>{grave.totalgraves}</strong></span>
              )}
            </div>
          )}
          {(grave.latitude && grave.longitude) && (
            <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
              <DirectionButton
                addClass="flex-1"
                latitude={grave.latitude}
                longitude={grave.longitude}
              />
              <ShareButton
                addClass="flex-1"
                title={grave?.name || 'Grave'}
                textMessage={`Lokasi Kubur: ${grave?.name || ''}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm dark:bg-gray-800 mx-2">
        <CardContent className="p-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{translate('Deceased Name')} ({persons.length})</h2>
          
          {persons.length > 0 && (
            <div className="space-y-2 mb-3">
              <Input
                placeholder={translate('Search for the deceased\'s name...')}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{translate('Date of Death')}</label>
                  <Input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <Button onClick={handleSearch} size="sm" className="h-9 mt-5 bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {isSearching || personsLoading ? (
            <div className="space-y-2">
              <ListCardSkeletonComponent/>
            </div>
          ) : displayedPersons.length === 0 ? (
            <NoDataCardComponent/>
          ) : (
            <div className="space-y-2">
              {displayedPersons.map(person => (
                <Card key={person.id} className="border-0 shadow-sm dark:bg-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={createPageUrl('DeadPersonDetails') + `?id=${person.id}`} className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{person.name}</p>
                        {person.dateofdeath && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(person.dateofdeath).toLocaleDateString('ms-MY')}
                          </p>
                        )}
                      </Link>
                      {person.latitude && person.longitude && (
                        <div className="flex flex-col gap-1">
                          <DirectionButton latitude={person?.latitude || null} longitude={person?.longitude || null} />
                          <ShareButton 
                            title={person?.name || 'Name'} 
                            textMessage={`Name: ${person?.name}`}
                            url={`${window.location.origin}${createPageUrl('DeadPersonDetails')}?id=${person.id}`}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {displayedCount < filtered.length && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDisplayedCount(prev => prev + 10)}
                  className="w-full h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                >
                  Muat Lagi
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}