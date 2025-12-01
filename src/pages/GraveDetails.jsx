import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, User, Calendar, Navigation, Share2, Heart, 
  ChevronRight, ArrowLeft, Building2, QrCode
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function GraveDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const graveId = urlParams.get('id');

  const { data: grave, isLoading } = useQuery({
    queryKey: ['grave', graveId],
    queryFn: async () => {
      const graves = await base44.entities.Grave.filter({ id: graveId });
      return graves[0];
    },
    enabled: !!graveId
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['grave-persons', graveId],
    queryFn: () => base44.entities.DeadPerson.filter({ grave_id: graveId }),
    enabled: !!graveId
  });

  const { data: organisation } = useQuery({
    queryKey: ['organisation', grave?.organisation_id],
    queryFn: async () => {
      if (!grave?.organisation_id) return null;
      const orgs = await base44.entities.Organisation.filter({ id: grave.organisation_id });
      return orgs[0];
    },
    enabled: !!grave?.organisation_id
  });

  const openDirections = () => {
    if (grave?.gps_lat && grave?.gps_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.gps_lat},${grave.gps_lng}`, '_blank');
    }
  };

  const shareLocation = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: grave?.cemetery_name,
        text: `Lokasi kubur: ${grave?.cemetery_name}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Pautan telah disalin!');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!grave) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Maklumat tidak dijumpai</h3>
          <Link to={createPageUrl('SearchGrave')}>
            <Button variant="outline">Kembali ke Carian</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl('SearchGrave')}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </Link>

      {/* Main Info Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{grave.cemetery_name}</h1>
              <div className="flex items-center gap-2 text-emerald-100">
                <MapPin className="w-4 h-4" />
                {grave.state}
              </div>
            </div>
            <Badge 
              className={
                grave.status === 'active' ? 'bg-green-500/20 text-green-100 border-green-300' :
                grave.status === 'full' ? 'bg-red-500/20 text-red-100 border-red-300' :
                'bg-yellow-500/20 text-yellow-100 border-yellow-300'
              }
            >
              {grave.status === 'active' ? 'Aktif' : grave.status === 'full' ? 'Penuh' : 'Penyelenggaraan'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {grave.block && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Blok</p>
                <p className="font-semibold">{grave.block}</p>
              </div>
            )}
            {grave.lot && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Lot</p>
                <p className="font-semibold">{grave.lot}</p>
              </div>
            )}
            {grave.total_graves > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Jumlah Kubur</p>
                <p className="font-semibold">{grave.total_graves}</p>
              </div>
            )}
            {grave.qr_code && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Kod QR</p>
                <p className="font-semibold flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  {grave.qr_code}
                </p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {grave.gps_lat && grave.gps_lng && (
              <Button onClick={openDirections} className="bg-emerald-600 hover:bg-emerald-700">
                <Navigation className="w-4 h-4 mr-2" />
                Arah ke Lokasi
              </Button>
            )}
            <Button variant="outline" onClick={shareLocation}>
              <Share2 className="w-4 h-4 mr-2" />
              Kongsi
            </Button>
            <Link to={createPageUrl('DonationPage') + `?org=${grave.organisation_id}`}>
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Derma
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Organisation Info */}
      {organisation && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Organisasi Pengurusan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg">{organisation.name}</h3>
            {organisation.address && (
              <p className="text-gray-500 mt-1">{organisation.address}</p>
            )}
            {organisation.phone && (
              <p className="text-gray-500">Tel: {organisation.phone}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deceased Persons */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Senarai Si Mati ({persons.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {persons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tiada rekod si mati.</p>
          ) : (
            <div className="space-y-3">
              {persons.map(person => (
                <Link 
                  key={person.id} 
                  to={createPageUrl('DeadPersonDetails') + `?id=${person.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {person.photo_url ? (
                      <img 
                        src={person.photo_url} 
                        alt={person.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {person.name}
                      </p>
                      {person.date_of_death && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Meninggal: {new Date(person.date_of_death).toLocaleDateString('ms-MY')}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}