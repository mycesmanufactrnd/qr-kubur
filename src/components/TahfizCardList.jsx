import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BannerImageWithFallback from "@/components/BannerImageWithFallback";
import { MapPin, Navigation, ExternalLink, Phone, Heart } from 'lucide-react'; 
import { createPageUrl } from '@/utils';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';
import { useState, useEffect } from 'react'; 
import DonationButton from './DonationButton';

export default function TahfizCardList({ tahfiz, onFavoriteChange }) {
  if (!tahfiz) return null;

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
    const isAlreadyFavorited = favorites.some(fav => fav.id === tahfiz.id);
    setIsFavorited(isAlreadyFavorited);
  }, [tahfiz.id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
    
    if (isFavorited) {
      const updatedFavorites = favorites.filter(fav => fav.id !== tahfiz.id);
      localStorage.setItem('favoritedtahfiz', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
    } else {
      const favTahfiz = {
        id: tahfiz.id,
        name: tahfiz.name,
      };
      
      favorites.push(favTahfiz);
      localStorage.setItem('favoritedtahfiz', JSON.stringify(favorites));
      setIsFavorited(true);
    }

    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-md">
      <div className="relative h-40 bg-gradient-to-br from-indigo-500 via-teal-500 to-cyan-600 overflow-hidden">
        <BannerImageWithFallback
          src={tahfiz.photourl ? `/api/file/tahfiz-center/${encodeURIComponent(tahfiz.photourl)}` : undefined}
          alt={tahfiz.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {tahfiz.distance && (
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {showEarthDistance(tahfiz.distance)}
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
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{tahfiz.name}</h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {tahfiz.state}
          </p>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {tahfiz.serviceoffered && tahfiz.serviceoffered.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tahfiz.serviceoffered.slice(0, 3).map((service, idx) => (
              <Badge                   
                key={idx} 
                variant="secondary" 
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium"
              >
                {service}
              </Badge>
            ))}
            {tahfiz.serviceoffered.length > 3 && (
              <Badge variant="outline" className="text-xs text-slate-500">
                +{tahfiz.serviceoffered.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        {tahfiz.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{tahfiz.phone}</span>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Link to={createPageUrl(`TahfizDetails?id=${tahfiz.id}`)} className="flex-1">
            <Button
              size="sm"
              variant="outline" 
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {translate('Details') || 'View Details'}
            </Button>
          </Link>
          <div className="flex gap-2">
            <DonationButton recipientId={tahfiz.id} recipientType={'tahfiz'} state={tahfiz.state}/>
            <Button
              size="sm"
              onClick={(e) => {
                  e.stopPropagation();
                  openDirections(tahfiz.latitude, tahfiz.longitude);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
