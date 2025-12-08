import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, User, Calendar, Filter, X, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import FilterDrawer from '../components/mobile/FilterDrawer';

const STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

export default function SearchGrave() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedState, setSelectedState] = useState('all');
  const [searchType, setSearchType] = useState('person');
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: persons = [], isLoading: loadingPersons } = useQuery({
    queryKey: ['dead-persons'],
    queryFn: () => base44.entities.DeadPerson.list()
  });

  const { data: graves = [], isLoading: loadingGraves } = useQuery({
    queryKey: ['graves'],
    queryFn: () => base44.entities.Grave.list()
  });

  const filteredResults = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (searchType === 'person') {
      return persons.filter(person => {
        const matchesQuery = !query || 
          person.name?.toLowerCase().includes(query) ||
          person.ic_number?.includes(query);
        
        if (!matchesQuery) return false;
        
        if (selectedState !== 'all') {
          const grave = graves.find(g => g.id === person.grave_id);
          return grave?.state === selectedState;
        }
        
        return true;
      });
    } else {
      return graves.filter(grave => {
        const matchesQuery = !query || 
          grave.cemetery_name?.toLowerCase().includes(query) ||
          grave.block?.toLowerCase().includes(query);
        const matchesState = selectedState === 'all' || grave.state === selectedState;
        return matchesQuery && matchesState;
      });
    }
  }, [searchQuery, selectedState, searchType, persons, graves]);

  const getGraveForPerson = (personId) => {
    const person = persons.find(p => p.id === personId);
    return graves.find(g => g.id === person?.grave_id);
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Cari Kubur</h1>
        <div className="lg:hidden">
          <FilterDrawer
            trigger={
              <Button size="sm" variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Tapis
              </Button>
            }
            title="Tapis Carian"
            open={filterOpen}
            onOpenChange={setFilterOpen}
          >
            <div className="space-y-4 px-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Jenis Carian</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={searchType === 'person' ? 'default' : 'outline'}
                    onClick={() => setSearchType('person')}
                    className={searchType === 'person' ? 'bg-emerald-600' : ''}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Si Mati
                  </Button>
                  <Button
                    variant={searchType === 'grave' ? 'default' : 'outline'}
                    onClick={() => setSearchType('grave')}
                    className={searchType === 'grave' ? 'bg-emerald-600' : ''}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Kubur
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Negeri</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Negeri</SelectItem>
                    {STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setFilterOpen(false)}
              >
                Terapkan
              </Button>
            </div>
          </FilterDrawer>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={searchType === 'person' ? "Nama atau No. IC" : "Nama kubur"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden lg:flex gap-2">
          <Button
            variant={searchType === 'person' ? 'default' : 'outline'}
            onClick={() => setSearchType('person')}
            className={searchType === 'person' ? 'bg-emerald-600' : ''}
          >
            <User className="w-4 h-4 mr-2" />
            Si Mati
          </Button>
          <Button
            variant={searchType === 'grave' ? 'default' : 'outline'}
            onClick={() => setSearchType('grave')}
            className={searchType === 'grave' ? 'bg-emerald-600' : ''}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Kubur
          </Button>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Negeri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Negeri</SelectItem>
              {STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedState !== 'all' || searchQuery) && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              "{searchQuery}"
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          {selectedState !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {selectedState}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedState('all')} />
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {filteredResults.length} hasil
        </p>

        {(loadingPersons || loadingGraves) ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Tiada hasil</h3>
              <p className="text-sm text-gray-500">Cuba kata kunci lain</p>
            </CardContent>
          </Card>
        ) : searchType === 'person' ? (
          <div className="space-y-2">
            {filteredResults.map(person => {
              const grave = graves.find(g => g.id === person.grave_id);
              return (
                <Link key={person.id} to={createPageUrl('DeadPersonDetails') + `?id=${person.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {person.photo_url ? (
                          <img 
                            src={person.photo_url} 
                            alt={person.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {person.name}
                          </h3>
                          {person.ic_number && (
                            <p className="text-xs text-gray-500">IC: {person.ic_number}</p>
                          )}
                          {grave && (
                            <p className="text-xs text-gray-500 truncate">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {grave.cemetery_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.map(grave => (
              <Link key={grave.id} to={createPageUrl('GraveDetails') + `?id=${grave.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {grave.cemetery_name}
                        </h3>
                        <p className="text-xs text-gray-500">{grave.state}</p>
                        {grave.block && (
                          <p className="text-xs text-gray-500">Blok {grave.block}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}