import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Star, Navigation, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { showEarthDistance } from '@/utils/helpers';
import BannerImageWithFallback from './BannerImageWithFallback';

export default function HeritageCardList({ site, distance, index = 0, nextPageUrl }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link to={createPageUrl(nextPageUrl) + `?id=${site.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 group">
          <div className="relative h-48 bg-gradient-to-br from-green-500 via-blue-500 to-emerald-600 overflow-hidden">
            <BannerImageWithFallback
              src={site.photourl ? `/api/file/heritage-site/${encodeURIComponent(site.photourl)}` : undefined}
              alt={site.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {site.isfeatured && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-0 backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
              </div>
            )}
            
            {distance !== null && distance !== undefined && (
              <div className="absolute bottom-3 right-3">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-stone-700 border-0">
                  <Navigation className="w-3 h-3 mr-1" />
                  {showEarthDistance(distance)}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1 line-clamp-1">
              {site.name}
            </h3>
            
            {site.era && (
              <div className="flex items-center text-stone-500 text-sm mb-2">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                <span>{site.era}</span>
              </div>
            )}
            
            {site.address && (
              <div className="flex items-start text-stone-400 text-sm">
                <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{site.address}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}