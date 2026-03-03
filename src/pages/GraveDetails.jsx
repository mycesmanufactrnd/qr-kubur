import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { MapPin, Search, Calendar, Phone, Share2, ArrowLeft, Users, Info, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ShareButton from '@/components/ShareButton';
import InitialAvatarImage from '@/components/InitialAvatarImage';
import DirectionButton from '@/components/DirectionButton';
import { useGetGraveById } from '@/hooks/useGraveMutations';
import { useGetDeadPersonByGraveId } from '@/hooks/useDeadPersonMutations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import { translate } from '@/utils/translations';
import { shareLink } from '@/utils/helpers';

export default function GraveDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const graveId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  const { data: grave, isLoading: graveLoading, isError: isGraveDetailsError } = useGetGraveById(graveId);

  const { data: personsData = [], isLoading: personsLoading } = useGetDeadPersonByGraveId({
    graveId: graveId ?? 0,
  });

  const handleSearch = () => {
    setIsSearching(true);
    setFilterName(searchName);
    setFilterDate(searchDate);
    
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  const filtered = personsData && personsData.filter(p => {
    const matchesName = !filterName || p.name?.toLowerCase().includes(filterName.toLowerCase());
    const matchesDate = !filterDate || (p.dateofdeath && String(p.dateofdeath).startsWith(filterDate));
    return matchesName && matchesDate;
  });

  const displayedPersons = filtered && filtered.slice(0, displayedCount);

  if (graveLoading) return <PageLoadingComponent />;

  if (!grave || isGraveDetailsError) {
    return <NoDataCardComponent isPage title={translate('noGravesFound')} description="Tiada Maklumat Dijumpai" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="relative h-72 md:h-80 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden">
        {grave.photourl ? (
          <img 
            src={`/api/file/bucket-grave/${encodeURIComponent(grave.photourl)}`} 
            alt={grave.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <></>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg z-20 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            shareLink({
              title: grave?.name,
              text: `Grave: ${grave?.name}`,
              url: window.location.href,
            });
          }}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          <Share2 className="w-5 h-5 text-stone-700" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 px-3 py-1">
                <MapPin className="w-3 h-3 mr-1" />
                {grave.state}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight tracking-tight">
              {grave.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8">
        <div className="flex flex-wrap gap-3 mb-8 -mt-12 relative z-10 px-4">
          <DirectionButton latitude={grave.latitude} longitude={grave.longitude}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start px-1">
          <div className="space-y-6 lg:order-2">
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-4">
                <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Maklumat Kubur
                </CardTitle>
              </CardHeader>

              <CardContent className="py-4 px-4 space-y-3">

                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase font-semibold text-slate-400 tracking-wide">
                      Penyelia (PIC)
                    </p>

                    <p className="font-medium text-sm text-slate-700 truncate">
                      {grave.picname || 'Tiada Maklumat'}
                    </p>

                    {grave.picphoneno && (
                      <a
                        href={`tel:${grave.picphoneno}`}
                        className="text-[11px] text-emerald-600 font-semibold hover:underline"
                      >
                        {grave.picphoneno}
                      </a>
                    )}
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-semibold text-slate-400 tracking-wide">
                      Kapasiti
                    </p>

                    <p className="font-semibold text-base text-slate-700">
                      {grave.totalgraves ?? 0}
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        Lot
                      </span>
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-8 lg:order-1">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                  <Search className="w-4 h-4 text-emerald-600" />
                  {translate('Cari Si Mati')}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">
                      {translate('Nama')}
                    </label>

                    <Input
                      placeholder={translate('Cari nama...')}
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-9 text-sm border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">
                      {translate('Tarikh')}
                    </label>

                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="h-9 text-sm border-slate-200 bg-slate-50 flex-1 focus:bg-white transition-colors"
                      />

                      <Button
                        onClick={handleSearch}
                        className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9 p-0 shrink-0 active:scale-95"
                      >
                        <Search className="w-3.5 h-3.5 text-white" />
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 border-l-4 border-emerald-500 pl-4">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {translate('Senarai Si Mati')}
                </h2>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 px-3">
                  {filtered.length} Rekod
                </Badge>
              </div>

              {isSearching || personsLoading ? (
                <ListCardSkeletonComponent />
              ) : (
                <div className="grid gap-3">
                  {displayedPersons.map(person => (
                    <Card
                      key={person.id}
                      className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group"
                    >
                      <CardContent className="p-0">
                        <div className="flex items-stretch min-h-[80px] sm:min-h-[90px]">

                          <div className="w-16 sm:w-20 shrink-0 bg-slate-100 overflow-hidden flex items-center justify-center">
                            <InitialAvatarImage
                              src={
                                person.photourl
                                  ? `/api/file/dead-person/${encodeURIComponent(person.photourl)}`
                                  : undefined
                              }
                              name={person.name}
                              className="w-10 h-10"
                            />
                          </div>
                          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                            <Link
                              to={`${createPageUrl('DeadPersonDetails')}?id=${person.id}`}
                              className="hover:text-emerald-600 transition-colors"
                            >
                              <p className="font-semibold text-sm sm:text-base text-slate-900 leading-tight truncate mb-0.5">
                                {person.name}
                              </p>

                              <div className="flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3 h-3 text-emerald-500" />
                                <span className="text-[11px] font-medium">
                                  {person.dateofdeath
                                    ? new Date(person.dateofdeath).toLocaleDateString('en-GB')
                                    : '-'}
                                </span>
                              </div>
                            </Link>
                          </div>

                          <div className="px-3 py-2 sm:px-4 sm:py-3 flex flex-col justify-center gap-2 min-w-[90px] sm:min-w-[110px] bg-slate-50/80 border-l border-slate-100">
                            <DirectionButton
                              latitude={person.latitude || grave.latitude}
                              longitude={person.longitude || grave.longitude}
                            />
                            <ShareButton
                              title={person.name}
                              textMessage={`Lokasi Kubur ${person.name}`}
                            />
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filtered.length === 0 && (
                     <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">Tiada rekod si mati dijumpai</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}