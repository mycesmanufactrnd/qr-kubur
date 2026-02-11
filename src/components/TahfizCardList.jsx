import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Phone } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { openDirections, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';
import { getServiceLabel } from '@/utils/enums';
import DonationButton from './DonationButton';

export default function TahfizCardList({ tahfiz }) {
  return (
    <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-md">
      <div className="relative h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden">
        {tahfiz.photourl ? (
          <img 
            src={`/api/file/tahfiz-center/${encodeURIComponent(tahfiz.photourl)}`} 
            alt={tahfiz.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {tahfiz.distance && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
            <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {showEarthDistance(tahfiz.distance)}
            </span>
          </div>
        )}
        
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
                {getServiceLabel(service)}
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
              variant="outline" 
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          <div className="flex gap-2">
            <DonationButton recipientId={tahfiz.id} recipientType={'tahfiz'} state={tahfiz.state}/>
            <Button 
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