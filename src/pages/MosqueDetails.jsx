import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Globe, ArrowLeft, Clock, Landmark,ExternalLink, Share2, Info, Users,BookOpen, FileText
} from 'lucide-react';
import MapBox from '@/components/MapBox';
import ActivityPostsCard from '@/components/ActivityPostsCard';
import { useGetMosqueById } from '@/hooks/useMosqueMutations';
import { useGetActivityPosts } from '@/hooks/useActivityPostMutations'; 
import DirectionButton from '@/components/DirectionButton';
import { useLocationContext } from '@/providers/LocationProvider';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { translate } from '@/utils/translations';
import { shareLink } from '@/utils/helpers';
import DonationButton from '@/components/DonationButton';

export default function MosqueDetailsPage() {
  const navigate = useNavigate();
  const { userLocation } = useLocationContext();
  const [searchParams] = useSearchParams();
  const mosqueId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: mosque, isLoading: isMosqueLoading, isError: isMosqueError } = useGetMosqueById(mosqueId);

  const { data: mosquePosts } = useGetActivityPosts({ 
    mosqueId: mosqueId,
    tahfizId: null,
  });

  if (isMosqueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isMosqueError || !mosque) {
    return <NoDataCardComponent isPage={true} description="Mosque Not Found" />;
  }

  const imageSrc = mosque.photourl 
    ? `/api/file/bucket-mosque/${encodeURIComponent(mosque.photourl)}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12">
      {/* Header / Hero Section */}
      <div className="relative h-72 md:h-80 overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={mosque.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/10 text-[200px] font-arabic">﷽</div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <Button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            shareLink({
              title: mosque?.name,
              text: `Visit ${mosque?.name}`,
              url: window.location.href,
            });
          }}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          <Share2 className="w-5 h-5 text-stone-700" />
        </Button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 mb-3">
              <MapPin className="w-3 h-3 mr-1" />
              {mosque.state}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{mosque.name}</h1>
            {mosque.address && <p className="text-white/80 text-sm md:text-base max-w-2xl line-clamp-2">{mosque.address}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8 -mt-12 relative z-10">
          <DirectionButton latitude={mosque.latitude} longitude={mosque.longitude}/>      
          <DonationButton recipientId={mosque.organisation?.id} recipientType={'organisation'} state={mosque.organisation?.state}/>        
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  {translate('About')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  {mosque.description || `${translate('Welcome to')} ${mosque.name}. ${translate('This mosque serves as a spiritual hub.')}`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  {translate('Location')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-72">
                  <MapBox dataMap={mosque} userLocation={userLocation} pageToUrl={'MosqueDetailsPage'} />
                </div>
              </CardContent>
            </Card>

            {mosquePosts && mosquePosts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  {translate('Latest Updates')}
                </h2>
                <div className="space-y-4">
                  {mosquePosts.map(post => (
                    <ActivityPostsCard key={post.id} post={post} poster={mosque.name} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Contact */}
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{translate('Contact Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mosque.picphoneno && (
                  <a href={`tel:${mosque.picphoneno}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">{translate('Phone No.')}</p>
                        <p className="font-medium text-slate-700">{mosque.picphoneno}</p>
                    </div>
                  </a>
                )}
                {mosque.email && (
                  <a href={`mailto:${mosque.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">{translate('Email')}</p>
                        <p className="font-medium text-slate-700 text-sm">{mosque.email}</p>
                    </div>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}