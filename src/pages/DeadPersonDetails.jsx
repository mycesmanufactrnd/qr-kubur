import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, Calendar, MapPin, Navigation, Share2, Heart, 
  BookOpen, ArrowLeft, Edit, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DeadPersonDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', personId],
    queryFn: async () => {
      const persons = await base44.entities.DeadPerson.filter({ id: personId });
      return persons[0];
    },
    enabled: !!personId
  });

  const { data: grave } = useQuery({
    queryKey: ['person-grave', person?.grave_id],
    queryFn: async () => {
      if (!person?.grave_id) return null;
      const graves = await base44.entities.Grave.filter({ id: person.grave_id });
      return graves[0];
    },
    enabled: !!person?.grave_id
  });

  // Log visit
  React.useEffect(() => {
    if (personId) {
      base44.entities.VisitLog.create({
        dead_person_id: personId,
        visit_type: 'direct'
      }).catch(() => {});
    }
  }, [personId]);

  const openDirections = () => {
    if (grave?.gps_lat && grave?.gps_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.gps_lat},${grave.gps_lng}`, '_blank');
    }
  };

  const shareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: person?.name,
        text: `Profil: ${person?.name}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Pautan telah disalin!');
    }
  };

  const calculateAge = (birthDate, deathDate) => {
    if (!birthDate || !deathDate) return null;
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!person) {
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

  const age = calculateAge(person.date_of_birth, person.date_of_death);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl('SearchGrave')}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </Link>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white text-center">
          {person.photo_url ? (
            <img 
              src={person.photo_url} 
              alt={person.name}
              className="w-32 h-32 rounded-2xl object-cover mx-auto border-4 border-white/30 shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center mx-auto border-4 border-white/30">
              <User className="w-16 h-16 text-white/80" />
            </div>
          )}
          <h1 className="text-2xl font-bold mt-4">{person.name}</h1>
          {person.ic_number && (
            <p className="text-emerald-100 mt-1">IC: {person.ic_number}</p>
          )}
        </div>

        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {person.date_of_birth && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Tarikh Lahir</p>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {new Date(person.date_of_birth).toLocaleDateString('ms-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            {person.date_of_death && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Tarikh Meninggal</p>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {new Date(person.date_of_death).toLocaleDateString('ms-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            {age !== null && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Umur Ketika Meninggal</p>
                <p className="font-semibold">{age} tahun</p>
              </div>
            )}
            {person.cause_of_death && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Sebab Kematian</p>
                <p className="font-semibold">{person.cause_of_death}</p>
              </div>
            )}
          </div>

          {person.biography && (
            <>
              <Separator className="my-6" />
              <div>
                <p className="text-sm text-gray-500 mb-2">Biografi</p>
                <p className="text-gray-700 whitespace-pre-wrap">{person.biography}</p>
              </div>
            </>
          )}

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {grave?.gps_lat && grave?.gps_lng && (
              <Button onClick={openDirections} className="bg-emerald-600 hover:bg-emerald-700">
                <Navigation className="w-4 h-4 mr-2" />
                Arah ke Kubur
              </Button>
            )}
            <Button variant="outline" onClick={shareProfile}>
              <Share2 className="w-4 h-4 mr-2" />
              Kongsi
            </Button>
            <Link to={createPageUrl('SurahPage')}>
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Baca Yasin
              </Button>
            </Link>
            <Link to={createPageUrl('TahlilRequestPage') + `?deceased=${encodeURIComponent(person.name)}`}>
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Mohon Tahlil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Grave Info */}
      {grave && (
        <Link to={createPageUrl('GraveDetails') + `?id=${grave.id}`}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Lokasi Kubur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-emerald-600 transition-colors">
                    {grave.cemetery_name}
                  </h3>
                  <p className="text-gray-500">{grave.state}</p>
                  <div className="flex gap-2 mt-2">
                    {grave.block && <span className="text-sm text-gray-500">Blok: {grave.block}</span>}
                    {grave.lot && <span className="text-sm text-gray-500">Lot: {grave.lot}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Suggest Edit */}
      <Card className="border-0 bg-amber-50 shadow-md">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Edit className="w-8 h-8 text-amber-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Maklumat tidak tepat?</h3>
              <p className="text-sm text-gray-600">Hantar cadangan pembetulan kepada admin.</p>
            </div>
          </div>
          <Link to={createPageUrl('SubmitSuggestion') + `?type=person&id=${person.id}`}>
            <Button variant="outline" className="border-amber-300 hover:bg-amber-100">
              <FileText className="w-4 h-4 mr-2" />
              Cadang Pembetulan
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}