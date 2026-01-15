import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { MapPin, Navigation, Share2, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from '@/components/ToastrNotification.jsx';
import BackNavigation from '@/components/BackNavigation';
import { useGetGraveById } from '@/hooks/useGraveMutations';
import { useGetDeadPersonPaginated } from '@/hooks/useDeadPersonMutations';

export default function GraveDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const graveId = urlParams.get('id') ? Number(urlParams.get('id')) : null;
  
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Fetch Grave Details via tRPC
  const { data: grave, isLoading: graveLoading } = useGetGraveById(graveId);

  // 2. Fetch Associated Persons via tRPC
  const { deadPersonsList, isLoading: personsLoading } = useGetDeadPersonPaginated({
    filterGrave: graveId || undefined,
    pageSize: 100, // Fetch a larger set to allow local filtering as per original UI
  });

  const persons = deadPersonsList.items;

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  const openDirections = () => {
    // FIX: Using entity property names 'latitude' and 'longitude'
    if (grave?.latitude && grave?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.latitude},${grave.longitude}`, '_blank');
    }
  };

  const shareLocation = async () => {
    const url = window.location.href;
    const title = grave?.name || 'Lokasi Kubur';
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Lokasi kubur: ${title}`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          showSuccess('Pautan telah disalin!');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      showSuccess('Pautan telah disalin!');
    }
  };

  // Local filtering logic maintained from original code
  const filtered = persons.filter(p => {
    const matchesName = !searchName || p.name?.toLowerCase().includes(searchName.toLowerCase());
    // FIX: Using entity property 'dateofdeath'
    const matchesDate = !searchDate || (p.dateofdeath && String(p.dateofdeath).startsWith(searchDate));
    return matchesName && matchesDate;
  });

  const displayedPersons = filtered.slice(0, displayedCount);

  if (graveLoading) {
    return (
      <div className="space-y-3 animate-pulse pb-2 p-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (!grave) {
    return (
      <Card className="border-0 shadow-sm dark:bg-gray-800 m-4">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Maklumat tidak dijumpai</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={grave.name} />
      <Card className="border-0 shadow-sm dark:bg-gray-800 mx-2">
        <CardContent className="p-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-teal-600 dark:text-teal-300" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{grave.state}</p>
              {grave.block && <p className="text-xs text-gray-500 dark:text-gray-400">Blok {grave.block}</p>}
              {grave.lot && <p className="text-xs text-gray-500 dark:text-gray-400">Lot {grave.lot}</p>}
            </div>
          </div>
          {(grave.latitude && grave.longitude) && (
            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
              <Button
                size="sm"
                onClick={openDirections}
                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Arah
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={shareLocation}
                className="flex-1 h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Kongsi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Persons List */}
      <Card className="border-0 shadow-sm dark:bg-gray-800 mx-2">
        <CardContent className="p-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Si Mati ({persons.length})</h2>
          
          {persons.length > 0 && (
            <div className="space-y-2 mb-3">
              <Input
                placeholder="Cari nama..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Tarikh Meninggal</label>
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
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : displayedPersons.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Tiada rekod</p>
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
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${person.latitude},${person.longitude}`, '_blank');
                            }}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Arah
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}${createPageUrl('DeadPersonDetails')}?id=${person.id}`;
                              if (navigator.share) {
                                navigator.share({ title: person.name, url });
                              } else {
                                navigator.clipboard.writeText(url);
                                showSuccess('Pautan disalin');
                              }
                            }}
                            className="h-7 text-xs w-full dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Kongsi
                          </Button>
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