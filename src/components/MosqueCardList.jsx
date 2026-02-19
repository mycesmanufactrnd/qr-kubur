import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Landmark, Heart, MapPinHouse } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';
import { useState } from 'react';
import { useEffect } from 'react';
import DonationButton from './DonationButton';
import BannerImageWithFallback from './BannerImageWithFallback';

export default function MosqueCardList({ mosque, onFavoriteChange  }) {
  if (!mosque) return null;
  
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritedmosque') || '[]');
    const isAlreadyFavorited = favorites.some(fav => fav.id === mosque.id);
    setIsFavorited(isAlreadyFavorited);
  }, [mosque.id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem('favoritedmosque') || '[]');
    
    if (isFavorited) {
      const updatedFavorites = favorites.filter(fav => fav.id !== mosque.id);
      localStorage.setItem('favoritedmosque', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
    } else {
      const favMosque = {
        id: mosque.id,
        name: mosque.name,
      };
      
      favorites.push(favMosque);
      localStorage.setItem('favoritedmosque', JSON.stringify(favorites));
      setIsFavorited(true);
    }

    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-md">
      <div className="relative h-40 bg-gradient-to-br from-pink-500 via-red-500 to-orange-600 overflow-hidden">
        <BannerImageWithFallback
          src={mosque.photourl ? `/api/file/bucket-mosque/${encodeURIComponent(mosque.photourl)}` : undefined}
          alt={mosque.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {mosque.distance && (
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {showEarthDistance(mosque.distance)}
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
          <h5 className="text-lg font-bold text-white line-clamp-1">{mosque.name}</h5>
          <p className="text-white/80 text-sm flex items-center gap-1">
            {mosque.state}
          </p>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {mosque.address && (
          <div className="flex items-center gap-2 text-sm text-slate-600 line-clamp-1">
            <MapPinHouse className="w-4 h-4 text-slate-400" />
            <span>{mosque.address}</span>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
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
          <div className="flex gap-2">
            <DonationButton recipientId={mosque.organisation?.id} recipientType={'organisation'} state={mosque.state}/>
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
        </div>
      </CardContent>
    </Card>
  );
}