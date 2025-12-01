import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, User, Calendar, Filter, X, ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cari Kubur</h1>
        
        {/* Search Type Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={searchType === 'person' ? 'default' : 'outline'}
            onClick={() => setSearchType('person')}
            className={searchType === 'person' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <User className="w-4 h-4 mr-2" />
            Cari Si Mati
          </Button>
          <Button
            variant={searchType === 'grave' ? 'default' : 'outline'}
            onClick={() => setSearchType('grave')}
            className={searchType === 'grave' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Cari Tanah Perkuburan
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={searchType === 'person' ? "Masukkan nama atau No. IC..." : "Masukkan nama tanah perkuburan..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-200"
            />
          </div>
          
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
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

        {/* Active Filters */}
        {(searchQuery || selectedState !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-4">
            {searchQuery && (
              <Badge variant="secondary" className="px-3 py-1">
                "{searchQuery}"
                <X 
                  className="w-3 h-3 ml-2 cursor-pointer" 
                  onClick={() => setSearchQuery('')}
                />
              </Badge>
            )}
            {selectedState !== 'all' && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedState}
                <X 
                  className="w-3 h-3 ml-2 cursor-pointer" 
                  onClick={() => setSelectedState('all')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredResults.length} hasil ditemui
          </p>
        </div>

        {(loadingPersons || loadingGraves) ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-md animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada hasil dijumpai</h3>
              <p className="text-gray-500">Cuba cari dengan kata kunci lain atau tukar negeri.</p>
            </CardContent>
          </Card>
        ) : searchType === 'person' ? (
          <div className="grid gap-4">
            {filteredResults.map(person => {
              const grave = graves.find(g => g.id === person.grave_id);
              return (
                <Link key={person.id} to={createPageUrl('DeadPersonDetails') + `?id=${person.id}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {person.photo_url ? (
                            <img 
                              src={person.photo_url} 
                              alt={person.name}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                              <User className="w-8 h-8 text-emerald-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {person.name}
                            </h3>
                            {person.ic_number && (
                              <p className="text-sm text-gray-500">IC: {person.ic_number}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {person.date_of_death && (
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(person.date_of_death).toLocaleDateString('ms-MY')}
                                </span>
                              )}
                              {grave && (
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                  <MapPin className="w-4 h-4" />
                                  {grave.cemetery_name}, {grave.state}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredResults.map(grave => (
              <Link key={grave.id} to={createPageUrl('GraveDetails') + `?id=${grave.id}`}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {grave.cemetery_name}
                          </h3>
                          <p className="text-sm text-gray-500">{grave.state}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {grave.block && (
                              <Badge variant="outline">Blok: {grave.block}</Badge>
                            )}
                            {grave.lot && (
                              <Badge variant="outline">Lot: {grave.lot}</Badge>
                            )}
                            <Badge 
                              variant="secondary"
                              className={
                                grave.status === 'active' ? 'bg-green-100 text-green-700' :
                                grave.status === 'full' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {grave.status === 'active' ? 'Aktif' : grave.status === 'full' ? 'Penuh' : 'Penyelenggaraan'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
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