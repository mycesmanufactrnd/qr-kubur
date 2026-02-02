import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Phone, Mail, Globe, Navigation, Heart, 
  BookOpen, ArrowLeft, Clock, DollarSign, Users,
  FileText, ExternalLink,
  Share2
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import MapBox from '@/components/MapBox';
import ActivityPostsCard from '@/components/ActivityPostsCard';
import { useGetTahfizById } from '@/hooks/useTahfizMutations';
import DirectionButton from '@/components/DirectionButton';
import DonationButton from '@/components/DonationButton';
import { useLocationContext } from '@/providers/LocationProvider';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import { translate } from '@/utils/translations';
import { shareLink } from '@/utils/helpers';
import { SERVICE_TYPES } from '@/utils/enums';
import { trpc } from '@/utils/trpc';

export default function TahfizDetails() {
  const navigate = useNavigate();
  const { userLocation, userState, locationDenied } = useLocationContext();
  const [searchParams] = useSearchParams();
  const tahfizId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: tahfiz, isLoading, isError } = useGetTahfizById(tahfizId);

  const posts = [];
  
  const { data: tahlilCount, isLoading: isRequestLoading } =
    trpc.tahlilRequest.countRequestByTahfizId.useQuery(
      { id: tahfizId },
      { enabled: !!tahfizId }
    );

  const pending = tahlilCount?.pending ?? 0;
  const completed = tahlilCount?.completed ?? 0;

  if (isLoading) {
    return (
      <ListCardSkeletonComponent/>
    );
  }

  if (isError || !tahfiz) {
    return (
      <NoDataCardComponent
        isPage={true}
        description="Site Not Found"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="relative h-72 md:h-80 overflow-hidden">
        {tahfiz.photourl ? (
          <img 
            src={`/api/file/bucket-grave/${encodeURIComponent(tahfiz.photourl)}`} 
            alt={tahfiz.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/10 text-[200px] font-arabic">﷽</div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            shareLink({
              title: tahfiz?.name,
              text: `Visit ${tahfiz?.name}`,
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
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                <MapPin className="w-3 h-3 mr-1" />
                {tahfiz.state}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{tahfiz.name}</h1>
            {tahfiz.address && (
              <p className="text-white/80 text-sm md:text-base max-w-2xl">{tahfiz.address}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8 -mt-12 relative z-10">
          <DirectionButton latitude={tahfiz.latitude} longitude={tahfiz.longitude}/>
          <DonationButton recipientId={tahfiz.id} recipientType={'tahfiz'} state={tahfiz.state}/>          
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {tahfiz.description && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{tahfiz.description}</p>
                </CardContent>
              </Card>
            )}

            {tahfiz.serviceoffered && tahfiz.serviceoffered.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-center gap-2">
                    <div className='flex gap-2 items-center'>
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Services Offered
                    </div >
                    <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${tahfiz.id}`}>
                      <Button
                        size="sm"
                        className="h-8 w-full text-xs font-medium
                          bg-gradient-to-r from-pink-500 to-rose-500
                          text-white
                          hover:from-pink-600 hover:to-rose-600
                          shadow-sm hover:shadow
                          transition-all"
                      >
                        {translate('Request Service')}
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {tahfiz.serviceoffered.map((serviceValue, idx) => {
                      const service = SERVICE_TYPES.find(s => s.value === serviceValue);

                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{service?.label || serviceValue}</span>
                            {service?.description && (
                              <span className="text-xs text-slate-500">{service.description}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-72">
                  <MapBox 
                    dataMap={tahfiz}
                    userLocation={userLocation} 
                    pageToUrl={'TahfizDetails'}
                  />
                </div>
              </CardContent>
            </Card>

            {posts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Latest Updates
                </h2>
                <div className="space-y-4">
                  {posts.map(post => (
                    <ActivityPostsCard key={post.id} post={post} poster={tahfiz.name} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tahfiz.phone && (
                  <a 
                    href={`tel:${tahfiz.phone}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-700">{tahfiz.phone}</p>
                    </div>
                  </a>
                )}
                
                {tahfiz.email && (
                  <a 
                    href={`mailto:${tahfiz.email}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium text-slate-700 text-sm">{tahfiz.email}</p>
                    </div>
                  </a>
                )}
                
                {tahfiz.url && (
                  <a 
                    href={tahfiz.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Website</p>
                      <p className="font-medium text-slate-700 flex items-center gap-1">
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </a>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
              <CardContent className="p-6 space-y-5">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-800">
                    🕌 Tahlil Requests
                  </h3>
                  <p className="text-sm text-slate-500">
                    Current request status
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/80 backdrop-blur rounded-2xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Users className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-slate-800">
                        {isLoading ? "—" : pending}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-white/80 backdrop-blur rounded-2xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span className="text-2xl font-bold text-slate-800">
                        {isLoading ? "—" : completed}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}