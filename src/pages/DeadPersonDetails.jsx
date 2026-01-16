import { useSearchParams } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackNavigation from '@/components/BackNavigation';
import { createPageUrl } from '@/utils';
import { calculateAge } from '@/utils/helpers';
import PageLoadingComponent from '@/components/PageLoadingComponent';

export default function DeadPersonDetails() {
  const [searchParams] = useSearchParams();
  const personId = Number(searchParams.get('id'));

  const {
    data: person,
    isLoading,
    isError,
  } = trpc.deadperson.getById.useQuery(personId, {
    enabled: !!personId,
  });

  const grave = person?.grave;

  const openDirections = () => {
    if (grave?.latitude && grave?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${grave.latitude},${grave.longitude}`,
        '_blank'
      );
    }
  };

  const openPersonDirections = () => {
    if (person?.latitude && person?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${person.latitude},${person.longitude}`,
        '_blank'
      );
    }
  };

  const shareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: person?.name,
          text: `Profil: ${person?.name}`,
          url,
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

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse pb-2 p-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (isError || !person) {
    return (
      <Card className="border-0 shadow-sm dark:bg-gray-800 m-4">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Maklumat tidak dijumpai
          </p>
        </CardContent>
      </Card>
    );
  }

  const age = calculateAge(person.dateofbirth, person.dateofdeath);

  return (
    <div className="space-y-3 pb-2 p-4">
      <BackNavigation title={person.name} />

      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-4 space-y-4">
          {person.photourl && (
            <div className="flex justify-center">
              <img
                src={`/api/file/bucket-grave/${encodeURIComponent(person.photourl)}`}
                alt="Preview"
                className="w-24 h-32 object-cover rounded-md"
              />
            </div>
          )}
          <div className="space-y-3">
            {person.icnumber && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">No. IC</p>
                <p className="text-sm font-medium dark:text-white">
                  {person.icnumber}
                </p>
              </div>
            )}
            <div className="flex justify-between gap-4">
              {person.dateofbirth && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tarikh Lahir</p>
                  <p className="text-sm font-medium dark:text-white">
                    {new Date(person.dateofbirth).toLocaleDateString('ms-MY')}
                  </p>
                </div>
              )}
              <div className="mr-4">
                {person.dateofdeath && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tarikh Meninggal
                    </p>
                    <p className="text-sm font-medium dark:text-white">
                      {new Date(person.dateofdeath).toLocaleDateString('ms-MY')}
                      {age && ` (${age} tahun)`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {person.biography && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Biografi</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {person.biography}
                </p>
              </div>
            )}
          </div>
          {(person.latitude && person.longitude) && (
            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
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
      {grave && (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Lokasi Kubur
            </h2>

            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mb-2">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-300" />
              </div>
              <div>
                <p className="font-medium text-sm dark:text-white">
                  {grave.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {grave.state}
                </p>
              </div>
            </div>

            {(grave.latitude && grave.longitude) && (
            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
              <Button
                size="sm"
                onClick={openDirections}
                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Arah
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  
                  const url = `${window.location.origin}${createPageUrl('GraveDetails')}?id=${grave.id}`;
                  if (navigator.share) {
                    navigator.share({ title: grave.name, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    alert('Pautan telah disalin!');
                  }
                }}
                className="flex-1 h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Kongsi
              </Button>
            </div>
          )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}