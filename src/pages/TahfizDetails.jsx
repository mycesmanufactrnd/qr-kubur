import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Globe, ArrowLeft, Clock, Users, FileText, ExternalLink, Share2, ChevronRight } from 'lucide-react';
import { createPageUrl, resolveFileUrl } from '@/utils';
import MapBox from '@/components/MapBox';
import ActivityPostsCard from '@/components/ActivityPostsCard';
import { useGetTahfizById } from '@/hooks/useTahfizMutations';
import DirectionButton from '@/components/DirectionButton';
import DonationButton from '@/components/DonationButton';
import { useLocationContext } from '@/providers/LocationProvider';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { translate } from '@/utils/translations';
import { shareLink } from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { useGetActivityPostsByRelationId } from '@/hooks/useActivityPostMutations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import BackNavigation from '@/components/BackNavigation';

export default function TahfizDetails() {
  const navigate = useNavigate();
  const { userLocation } = useLocationContext();
  const [searchParams] = useSearchParams();
  const tahfizId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: tahfizDetails, isLoading: isTahfizLoading, isError: isTahfizError } = useGetTahfizById(tahfizId);

  const { data: tahfizPosts = [] } = useGetActivityPostsByRelationId({ 
    mosqueId: null,
    tahfizId: tahfizId,
  });
  
  const { data: tahlilCount, isLoading: isRequestLoading } =
    trpc.tahlilRequest.countRequestByTahfizId.useQuery(
      { id: tahfizId },
      { enabled: !!tahfizId }
    );

  const pending = tahlilCount?.pending ?? 0;
  const completed = tahlilCount?.completed ?? 0;

  if (isTahfizLoading) return <PageLoadingComponent />;

  if (isTahfizError || !tahfizDetails) {
    return (
      <div>
        <BackNavigation title={translate('Tahfiz Details')} />
        <NoDataCardComponent isPage={true} />
      </div>
    );
  }

  const hasContacts = tahfizDetails.phone || tahfizDetails.email || tahfizDetails.url;

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="relative h-64 md:h-80 overflow-hidden">
        {tahfizDetails.photourl ? (
          <img 
            src={resolveFileUrl(tahfizDetails.photourl, 'tahfiz-center')} 
            alt={tahfizDetails.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="text-white text-[180px] font-arabic leading-none">﷽</div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

        <Button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full shadow-lg text-white transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            shareLink({ title: tahfizDetails?.name, text: `Visit ${tahfizDetails?.name}`, url: window.location.href });
          }}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full shadow-lg text-white transition-all active:scale-95"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        <div className="absolute bottom-0 left-0 right-0 p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/15 backdrop-blur-sm text-white border border-white/20">
              <MapPin className="w-3 h-3" />
              {tahfizDetails.state}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight mb-1">{tahfizDetails.name}</h1>
          {tahfizDetails.address && (
            <p className="text-white/70 text-xs md:text-sm line-clamp-2">{tahfizDetails.address}</p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-4 mb-5 relative z-10 flex gap-2">
        <DirectionButton latitude={tahfizDetails.latitude} longitude={tahfizDetails.longitude} />
        <DonationButton recipientId={String(tahfizDetails.id)} recipientType={'tahfiz'} state={tahfizDetails.state} />
      </div>

      <div className="px-4 pb-10 space-y-4 max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          {tahfizDetails.description && (
            <div className="p-4 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1.5">About</p>
              <p className="text-sm text-slate-600 leading-relaxed">{tahfizDetails.description}</p>
            </div>
          )}

          {hasContacts && (
            <div className="p-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-2">Contact</p>

              {tahfizDetails.phone && (
                <a href={`tel:${tahfizDetails.phone}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{tahfizDetails.phone}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                </a>
              )}

              {tahfizDetails.email && (
                <a href={`mailto:${tahfizDetails.email}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{tahfizDetails.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                </a>
              )}

              {tahfizDetails.url && (
                <a href={tahfizDetails.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Website</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Visit Website <ExternalLink className="w-3 h-3 text-slate-400" />
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-3">Tahlil Requests</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center gap-1 py-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-2xl font-bold text-amber-600">{isRequestLoading ? "—" : pending}</span>
              <span className="text-xs font-medium text-amber-500">Pending</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 py-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-2xl font-bold text-emerald-600">{isRequestLoading ? "—" : completed}</span>
              <span className="text-xs font-medium text-emerald-500">Completed</span>
            </div>
          </div>
        </div>

        {tahfizDetails.serviceoffered && tahfizDetails.serviceoffered.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">Services</p>
              </div>
              <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${tahfizDetails.id}`}>
                <button className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm active:opacity-80 transition-opacity">
                  {translate('Request Service')}
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {tahfizDetails.serviceoffered.map((serviceValue, idx) => {
                const servicePrice = Number(tahfizDetails.serviceprice?.[serviceValue] || 0);
                return (
                  <div key={idx} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{serviceValue}</span>
                    </div>
                    {servicePrice > 0 ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        RM {servicePrice}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Free</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">Location</p>
          </div>
          <div className="h-52">
            <MapBox 
              dataMap={tahfizDetails}
              userLocation={userLocation} 
              pageToUrl={'TahfizDetails'}
            />
          </div>
        </div>

        {tahfizPosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-700">Latest Updates</h2>
            </div>
            <div className="space-y-3">
              {tahfizPosts.map(post => (
                <ActivityPostsCard key={post.id} post={post} poster={tahfizDetails.name} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
