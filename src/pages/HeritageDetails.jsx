import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, BookOpen, Navigation, Globe, Star, Share2, Eye} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useGetHeritageById, useHeritageMutations } from '@/hooks/useHeritageMutations';
import { openDirections, shareLink } from '@/utils/helpers';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';

export default function HeritageDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: site, isLoading, isError } = useGetHeritageById(siteId);

  const { incrementViewCount } = useHeritageMutations();

  useEffect(() => {
    if (!siteId) return;

    const viewedSites = JSON.parse(sessionStorage.getItem('viewedSites') || '[]');

    if (!viewedSites.includes(siteId)) {
      sessionStorage.setItem('viewedSites', JSON.stringify([...viewedSites, siteId]));

      incrementViewCount.mutate({ id: siteId });
    }
  }, [siteId, incrementViewCount]);

  if (isLoading) {
    return (
      <ListCardSkeletonComponent/>
    );
  }

  if (isError || !site) {
    return (
      <NoDataCardComponent
        isPage={true}
        description="Site Not Found"
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative h-72 md:h-96">
        {site.photourl ? (
          <img
            src={`/api/file/bucket-grave/${encodeURIComponent(site.photourl)}`} 
            alt={site.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-stone-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
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
              title: site?.name,
              text: `Check out ${site?.name}`,
              url: window.location.href,
            });
          }}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          <Share2 className="w-5 h-5 text-stone-700" />
        </button>

        {site.isfeatured && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-0 backdrop-blur-sm">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured Site
            </Badge>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative -mt-8 bg-white rounded-t-3xl min-h-[60vh]"
      >
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-800 mb-3">
            {site.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            {site.era && (
              <Badge variant="secondary" className="bg-stone-100 text-stone-700">
                <Clock className="w-3 h-3 mr-1" />
                {site.era}
              </Badge>
            )}
            {site.state && (
              <Badge variant="secondary" className="bg-stone-100 text-stone-700">
                <MapPin className="w-3 h-3 mr-1" />
                {site.state}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-stone-100 text-stone-500">
              <Eye className="w-3 h-3 mr-1" />
              {(site.viewcount || 0) + 1} views
            </Badge>
          </div>

          <div className="flex gap-3 mb-8">
            {site.latitude && site.longitude && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  openDirections(site.latitude, site.longitude);
                }}
                className="flex-1 bg-stone-800 hover:bg-stone-900 h-12 rounded-xl"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            )}
            {site.url && (
              <Button 
                variant="outline"
                onClick={() => window.open(site.url, '_blank')}
                className="flex-1 h-12 rounded-xl border-stone-300"
              >
                <Globe className="w-4 h-4 mr-2" />
                Official Website
              </Button>
            )}
          </div>

          <Separator className="mb-6" />

          {site.description && (
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-3">
                About This Site
              </h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {site.description}
              </p>
            </section>
          )}

          {site.eradescription && (
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-3">
                Historical Era
              </h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {site.eradescription}
              </p>
            </section>
          )}

          {site.historicalsources && (
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Historical Sources
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                  {site.historicalsources}
                </p>
              </div>
            </section>
          )}

          {site.address && (
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-3">
                Location
              </h2>
              <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
                <MapPin className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-stone-700">{site.address}</p>
                  {site.state && (
                    <p className="text-stone-500 text-sm mt-1">{site.state}</p>
                  )}
                  {site.latitude && site.longitude && (
                    <p className="text-stone-400 text-xs mt-2">
                      {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  );
}