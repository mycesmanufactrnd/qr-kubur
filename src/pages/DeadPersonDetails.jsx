import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Navigation, Share2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DeadPersonDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  const { data: person, isLoading } = useQuery({
    queryKey: ['dead-person', personId],
    queryFn: async () => {
      const persons = await base44.entities.DeadPerson.filter({ id: personId });
      return persons[0];
    },
    enabled: !!personId
  });

  const { data: grave } = useQuery({
    queryKey: ['grave', person?.grave_id],
    queryFn: async () => {
      if (!person?.grave_id) return null;
      const graves = await base44.entities.Grave.filter({ id: person.grave_id });
      return graves[0];
    },
    enabled: !!person?.grave_id
  });

  const openDirections = () => {
    if (grave?.gps_lat && grave?.gps_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.gps_lat},${grave.gps_lng}`, '_blank');
    }
  };

  const openPersonDirections = () => {
    if (person?.gps_lat && person?.gps_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${person.gps_lat},${person.gps_lng}`, '_blank');
    }
  };

  const shareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: person?.name,
          text: `Profil: ${person?.name}`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          alert('Pautan telah disalin!');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Pautan telah disalin!');
    }
  };

  const calculateAge = (dob, dod) => {
    if (!dob || !dod) return null;
    const birth = new Date(dob);
    const death = new Date(dod);
    let age = death.getFullYear() - birth.getFullYear();
    const m = death.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--;
    return age;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse pb-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (!person) {
    return (
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Maklumat tidak dijumpai</p>
        </CardContent>
      </Card>
    );
  }

  const age = calculateAge(person.date_of_birth, person.date_of_death);

  return (
    <div className="space-y-3 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{person.name}</h1>
      </div>

      {/* Person Info */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          {person.ic_number && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">No. IC</p>
              <p className="text-sm font-medium dark:text-white">{person.ic_number}</p>
            </div>
          )}
          {person.date_of_birth && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tarikh Lahir</p>
              <p className="text-sm font-medium dark:text-white">
                {new Date(person.date_of_birth).toLocaleDateString('ms-MY')}
              </p>
            </div>
          )}
          {person.date_of_death && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tarikh Meninggal</p>
              <p className="text-sm font-medium dark:text-white">
                {new Date(person.date_of_death).toLocaleDateString('ms-MY')}
                {age && ` (${age} tahun)`}
              </p>
            </div>
          )}
          {person.biography && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Biografi</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{person.biography}</p>
            </div>
          )}
          {person.gps_lat && person.gps_lng && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={openPersonDirections}
                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Arah
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareProfile}
                className="flex-1 h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Kongsi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grave Location */}
      {grave && (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Lokasi Kubur</h2>
            // <Link to={createPageUrl('GraveDetails') + `?id=${grave.id}`}>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mb-2">
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                </div>
                <div>
                  <p className="font-medium text-sm dark:text-white">{grave.cemetery_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{grave.state}</p>
                </div>
              </div>
            // </Link>
            <div className="flex gap-2">
              {grave.gps_lat && grave.gps_lng && (
                <Button onClick={openDirections} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                  <Navigation className="w-3 h-3 mr-1" />
                  Arah
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={shareProfile} className="h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                <Share2 className="w-3 h-3 mr-1" />
                Kongsi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}