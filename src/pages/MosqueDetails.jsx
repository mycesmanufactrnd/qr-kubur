import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Mail, ArrowLeft, Clock, Share2, BookOpen, CreditCard, ChevronRight } from 'lucide-react';
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
import { createPageUrl, resolveFileUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function MosqueDetailsPage() {
  const navigate = useNavigate();
  const { userLocation } = useLocationContext();
  const [searchParams] = useSearchParams();
  const mosqueId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: mosque, isLoading: isMosqueLoading, isError: isMosqueError } = useGetMosqueById(mosqueId);
  const { data: mosquePosts } = useGetActivityPostsByRelationId({ mosqueId, tahfizId: null });

  if (isMosqueLoading) return <PageLoadingComponent />;
  if (isMosqueError || !mosque) return <NoDataCardComponent isPage={true} description="Mosque Not Found" />;

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="relative h-64 md:h-80 overflow-hidden">
        {mosque.photourl ? (
          <img
            src={resolveFileUrl(mosque.photourl, 'bucket-mosque')}
            alt={mosque.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center">
            <div className="text-white/10 text-[180px] leading-none select-none">🕌</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => shareLink({ title: mosque?.name, text: `Visit ${mosque?.name}`, url: window.location.href })}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:px-8 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {mosque.state && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/20 mb-2">
                <MapPin className="w-3 h-3" />{mosque.state}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{mosque.name}</h1>
            {mosque.address && (
              <p className="text-white/70 text-xs mt-1 flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3 h-3 shrink-0" />{mosque.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-12 space-y-4">

        <div className="flex flex-wrap gap-2">
          <DirectionButton latitude={mosque.latitude} longitude={mosque.longitude} />
          <DonationButton 
            recipientId={String(mosque.organisation?.id)} 
            recipientType="organisation" 
            state={mosque.organisation?.state} 
          />
        </div>

        { mosque.hasdeathcharity 
          ? (
          <Link to={`${createPageUrl(`DeathCharityUserPayment`)}?mosque=${mosque.id}`} className="flex-1">
            <Button
              className="mt-2 w-[calc(100%-2rem)] 
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

        <div className="grid lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate('About')}</p>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {mosque.description || `${translate('Welcome to')} ${mosque.name}. ${translate('This mosque serves as a spiritual hub.')}`}
                </p>

                {(mosque.picphoneno || mosque.email) && (
                  <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                    {mosque.picphoneno && (
                      <a href={`tel:${mosque.picphoneno}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{translate('Phone No.')}</p>
                          <p className="text-sm font-semibold text-slate-700">{mosque.picphoneno}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </a>
                    )}
                    {mosque.email && (
                      <a href={`mailto:${mosque.email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{translate('Email')}</p>
                          <p className="text-sm font-semibold text-slate-700 truncate">{mosque.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {mosque.latitude != null && mosque.longitude != null && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate('Location')}</p>
                </div>
                <div className="h-56">
                  <MapBox dataMap={mosque} userLocation={userLocation} pageToUrl="MosqueDetailsPage" />
                </div>
              </div>
            )}
          </div>

          {mosquePosts?.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate('Latest Updates')}</p>
                </div>
                <div className="p-3 space-y-3">
                  {mosquePosts.map(post => (
                    <ActivityPostsCard key={post.id} post={post} poster={mosque.name} />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
