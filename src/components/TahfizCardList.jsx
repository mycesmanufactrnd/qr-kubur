import { Link } from 'react-router-dom';
import { MapPin, Navigation, ExternalLink, Phone, Heart } from 'lucide-react';
import BannerImageWithFallback from "@/components/BannerImageWithFallback";
import { createPageUrl, resolveFileUrl } from '@/utils';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';
import { useState, useEffect } from 'react';
import DonationButton from './DonationButton';
import { Button } from './ui/button';

export default function TahfizCardList({ tahfiz, onFavoriteChange }) {
  if (!tahfiz) return null;

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
    setIsFavorited(favorites.some(fav => fav.id === tahfiz.id));
  }, [tahfiz.id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('favoritedtahfiz') || '[]');
    if (isFavorited) {
      localStorage.setItem('favoritedtahfiz', JSON.stringify(favorites.filter(fav => fav.id !== tahfiz.id)));
      setIsFavorited(false);
    } else {
      favorites.push({ id: tahfiz.id, name: tahfiz.name });
      localStorage.setItem('favoritedtahfiz', JSON.stringify(favorites));
      setIsFavorited(true);
    }
    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="relative h-36 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 overflow-hidden">
        <BannerImageWithFallback
          src={resolveFileUrl(tahfiz.photourl, 'tahfiz-center')}
          alt={tahfiz.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {tahfiz.distance && (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/20">
              <MapPin className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">{showEarthDistance(tahfiz.distance)}</span>
            </div>
          )}
          <button
            onClick={toggleFavorite}
            className="w-8 h-8 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full transition-all active:scale-90"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-400 text-red-400' : 'text-white'}`} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3">
          <h3 className="text-base font-bold text-white leading-tight line-clamp-1">{tahfiz.name}</h3>
          <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {tahfiz.state}
          </p>
        </div>
      </div>

      <div className="px-3.5 pt-3 pb-3.5 space-y-3">

        {tahfiz.serviceoffered && tahfiz.serviceoffered.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tahfiz.serviceoffered.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium rounded-full"
              >
                {service}
              </span>
            ))}
            {tahfiz.serviceoffered.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 text-[11px] rounded-full">
                +{tahfiz.serviceoffered.length - 3}
              </span>
            )}
          </div>
        )}

        {tahfiz.phone && (
          <a
            href={`tel:${tahfiz.phone}`}
            className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
            onClick={e => e.stopPropagation()}
          >
            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{tahfiz.phone}</span>
          </a>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <Link to={createPageUrl(`TahfizDetails?id=${tahfiz.id}`)} className="flex-1">
            <button className="w-full h-9 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors active:opacity-75">
              <ExternalLink className="w-3.5 h-3.5" />
              {translate('Details') || 'View Details'}
            </button>
          </Link>
          <DonationButton recipientId={tahfiz.id} recipientType="tahfiz" state={tahfiz.state} />
          <Button
            onClick={(e) => { e.stopPropagation(); openDirections(tahfiz.latitude, tahfiz.longitude); }}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm active:opacity-75 transition-opacity shrink-0"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
