import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, ArrowLeft, Clock, Share2, BookOpen, CreditCard
} from 'lucide-react';
import MapBox from '@/components/MapBox';
import ActivityPostsCard from '@/components/ActivityPostsCard';
import { useGetMosqueById } from '@/hooks/useMosqueMutations';
import { useGetActivityPostsByRelationId } from '@/hooks/useActivityPostMutations'; 
import DirectionButton from '@/components/DirectionButton';
import { useLocationContext } from '@/providers/LocationProvider';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { translate } from '@/utils/translations';
import { shareLink } from '@/utils/helpers';
import DonationButton from '@/components/DonationButton';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { createPageUrl } from '@/utils';

export default function MosqueDetailsPage() {
  const navigate = useNavigate();
  const { userLocation } = useLocationContext();
  const [searchParams] = useSearchParams();
  const mosqueId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: mosque, isLoading: isMosqueLoading, isError: isMosqueError } = useGetMosqueById(mosqueId);

  const { data: mosquePosts } = useGetActivityPostsByRelationId({ 
    mosqueId: mosqueId,
    tahfizId: null,
  });

  if (isMosqueLoading) {
    return <PageLoadingComponent />;
  }

  if (isMosqueError || !mosque) {
    return <NoDataCardComponent isPage={true} description="Mosque Not Found" />;
  }

  return (
    <div className="min-h-screen">
      <div className="relative h-72 md:h-96">
        {mosque.photourl ? (
          <img 
            src={`/api/file/bucket-mosque/${encodeURIComponent(mosque.photourl)}`} 
            alt={mosque.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-stone-400" />
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

      <div className="max-w-6xl mx-auto py-8">
        <div className="flex flex-wrap gap-2 mb-2 px-4 -mt-12 relative z-10">
          <DirectionButton latitude={mosque.latitude} longitude={mosque.longitude}/>      
          <DonationButton recipientId={mosque.organisation?.id} recipientType={'organisation'} state={mosque.organisation?.state}/>        
        </div>

        { mosque.hasdeathcharity 
          ? (
            <Link to={createPageUrl(`DeathCharityUserPayment`)} className="flex-1">
              <Button
                className="mb-5 mx-4 w-[calc(100%-2rem)] 
                          bg-orange-600 text-white font-semibold shadow-md"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {translate('Register & Payment of Death Charity')}
              </Button>
            </Link>
          )
          : (
            <div className="mb-5"></div>
          ) }

        <div className="space-y-6 px-1">
          <Card className="border-0 shadow-sm">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                {translate('About')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3 space-y-3">
              <p className="text-sm text-slate-600 leading-snug">
                {mosque.description ||
                  `${translate('Welcome to')} ${mosque.name}. ${translate('This mosque serves as a spiritual hub.')}`}
              </p>

              {(mosque.picphoneno || mosque.email) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {mosque.picphoneno && (
                    <a
                      href={`tel:${mosque.picphoneno}`}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-500">{translate('Phone No.')}</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{mosque.picphoneno}</p>
                      </div>
                    </a>
                  )}
                  {mosque.email && (
                    <a
                      href={`mailto:${mosque.email}`}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-500">{translate('Email')}</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{mosque.email}</p>
                      </div>
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {translate('Location')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-56">
                <MapBox dataMap={mosque} userLocation={userLocation} pageToUrl={'MosqueDetailsPage'} />
              </div>
            </CardContent>
          </Card>

          {mosquePosts && mosquePosts.length > 0 && (
            <div className="space-y-4">
              <p className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                {translate('Latest Updates')}
              </p>
              <div className="space-y-4">
                {mosquePosts.map(post => (
                  <ActivityPostsCard key={post.id} post={post} poster={mosque.name} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
