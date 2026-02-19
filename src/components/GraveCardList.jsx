import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Hammer, ImageIcon, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';
import { useState, useEffect } from 'react';
import BannerImageWithFallback from './BannerImageWithFallback';

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100',
    icon: null
  },
  full: {
    label: 'Full',
    className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100',
    icon: null
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100',
    icon: <Hammer className="w-3 h-3 mr-1" />
  }
};

export default function GraveCardList({ grave, onFavoriteChange }) {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritedgrave') || '[]');
    const isAlreadyFavorited = favorites.some(fav => fav.id === grave.id);
    setIsFavorited(isAlreadyFavorited);
  }, [grave.id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem('favoritedgrave') || '[]');
    
    if (isFavorited) {
      const updatedFavorites = favorites.filter(fav => fav.id !== grave.id);
      localStorage.setItem('favoritedgrave', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
    } else {
      const favGrave = {
        id: grave.id,
        name: grave.name,
      };
      
      favorites.push(favGrave);
      localStorage.setItem('favoritedgrave', JSON.stringify(favorites));
      setIsFavorited(true);
    }

    if (onFavoriteChange) onFavoriteChange();
  };

  const status = STATUS_CONFIG[grave.status?.toLowerCase()] || {
    label: grave.status,
    className: 'bg-slate-50 text-slate-600 border-slate-100',
    icon: null
  };

  return (
    <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-md">
      <div className="relative h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden">
        <BannerImageWithFallback
          src={grave.photourl ? `/api/file/bucket-grave/${encodeURIComponent(grave.photourl)}` : undefined}
          alt={grave.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {grave.distance && (
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {showEarthDistance(grave.distance)}
              </span>
            </div>
          )}

          <Button
            onClick={toggleFavorite}
            variant="ghost"
            size="icon"
            className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-9 w-9"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </Button>
        </div>
        
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 uppercase tracking-tight">
            {grave.name}
          </h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {grave.state}
          </p>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge 
            variant="secondary" 
            className={`${status.className} text-xs font-medium px-2.5 py-0.5 border`}
          >
            {status.icon}
            {status.label}
          </Badge>
          
          {grave.totalgraves > 0 && (
            <Badge variant="outline" className="text-xs text-slate-500 border-slate-200">
              {grave.totalgraves} {translate('Total Grave')}
            </Badge>
          )}
        </div>

        {grave.address && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{grave.address}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link to={createPageUrl(`GraveDetails?id=${grave.id}`)} className="flex-1">
            <Button
              size="sm"
              variant="outline" 
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {translate('View Details')}
            </Button>
          </Link>

          <Button 
            size="sm"
            onClick={(e) => {
                e.stopPropagation();
                openDirections(grave.latitude, grave.longitude);
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