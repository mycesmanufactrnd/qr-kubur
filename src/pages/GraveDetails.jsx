import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, Share2, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GraveDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const graveId = urlParams.get('id');
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  const { data: grave, isLoading } = useQuery({
    queryKey: ['grave', graveId],
    queryFn: async () => {
      const graves = await base44.entities.Grave.filter({ id: graveId });
      return graves[0];
    },
    enabled: !!graveId
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['grave-persons', graveId],
    queryFn: () => base44.entities.DeadPerson.filter({ grave_id: graveId }),
    enabled: !!graveId
  });

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  const openDirections = () => {
    if (grave?.gps_lat && grave?.gps_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.gps_lat},${grave.gps_lng}`, '_blank');
    }
  };

  const shareLocation = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: grave?.cemetery_name,
          text: `Lokasi kubur: ${grave?.cemetery_name}`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          alert('Pautan telah disalin!');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Pautan telah disalin!');
    }
  };

  const filtered = persons.filter(p => {
    const matchesName = !searchName || p.name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesDate = !searchDate || (p.date_of_death && p.date_of_death.startsWith(searchDate));
    return matchesName && matchesDate;
  });

  const displayedPersons = filtered.slice(0, displayedCount);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse pb-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (!grave) {
    return (
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Maklumat tidak dijumpai</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{grave.cemetery_name}</h1>
      </div>

      {/* Grave Info */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
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
          <div className="flex gap-2">
            {grave.gps_lat && grave.gps_lng && (
              <Button onClick={openDirections} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                <Navigation className="w-3 h-3 mr-1" />
                Arah
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={shareLocation} className="h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
              <Share2 className="w-3 h-3 mr-1" />
              Kongsi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Persons List */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Si Mati ({persons.length})</h2>
          
          {persons.length > 0 && (
            <div className="space-y-2 mb-3">
              <Input
                placeholder="Cari nama..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-9"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Tarikh Meninggal</label>
                  <Input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button onClick={handleSearch} size="sm" className="h-9 mt-5 bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {isSearching ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : displayedPersons.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Tiada rekod</p>
          ) : (
            <div className="space-y-3">
              {displayedPersons.map(person => (
                <Link key={person.id} to={createPageUrl('DeadPersonDetails') + `?id=${person.id}`}>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{person.name}</p>
                    {person.date_of_death && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(person.date_of_death).toLocaleDateString('ms-MY')}
                      </p>
                    )}
                  </div>
                </Link>
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