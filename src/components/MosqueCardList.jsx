import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Landmark } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';

export default function MosqueCardList({ mosque }) {
  if (!mosque) return null;

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob')) return url;
    return `/api/file/bucket-mosque/${encodeURIComponent(url)}`;
  };

  const imageSrc = getImageUrl(mosque.photourl);

  return (
    <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-md">
      <div className="relative h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={mosque.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Landmark className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {mosque.distance && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
            <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {showEarthDistance(mosque.distance)}
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{mosque.name}</h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {mosque.state}
          </p>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {mosque.address && (
          <div className="flex items-center gap-2 text-sm text-slate-600 line-clamp-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{mosque.address}</span>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {/* REDIRECT LINK IS HERE */}
          <Link 
            to={`${createPageUrl('MosqueDetailsPage')}?id=${mosque.id}`} 
            className="flex-1"
          >
            <Button 
              variant="outline" 
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {translate('Details') || 'View Details'}
            </Button>
          </Link>
          
          <Button 
            onClick={(e) => {
                e.stopPropagation();
                openDirections(mosque.latitude, mosque.longitude);
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}