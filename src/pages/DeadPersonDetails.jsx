import { useSearchParams } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import BackNavigation from '@/components/BackNavigation';
import { createPageUrl } from '@/utils';
import { calculateAge, openDirections, shareLink } from '@/utils/helpers';
import { translate } from '@/utils/translations';

export default function DeadPersonDetails() {
  const [searchParams] = useSearchParams();
  const personId = Number(searchParams.get('id'));

  const {
    data: deadPersonDetails, isLoading, isError,
  } = trpc.deadperson.getDeadPersonById.useQuery(
    { id: personId }, 
    { enabled: !!personId }
  );

  const graveDetails = deadPersonDetails?.grave;

  if (isLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (isError || !deadPersonDetails) {
    return (
      <NoDataCardComponent
        isPage={true}
        description="Tiada Maklumat Dijumpai"
      />
    );
  }

  const age = calculateAge(deadPersonDetails.dateofbirth, deadPersonDetails.dateofdeath);

  return (
    <div className="space-y-3 pb-2 p-4">
      <BackNavigation title={deadPersonDetails.name} />
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-4 space-y-4">
          {deadPersonDetails.photourl && (
            <div className="flex justify-center">
              <img
                src={`/api/file/bucket-grave/${encodeURIComponent(person.photourl)}`}
                alt={translate('Preview')}
                className="w-24 h-32 object-cover rounded-md"
              />
            </div>
          )}
          <div className="space-y-3">
            {deadPersonDetails.icnumber && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{translate('IC Number')}</p>
                <p className="text-sm font-medium dark:text-white">
                  {deadPersonDetails.icnumber}
                </p>
              </div>
            )}
            <div className="flex justify-between gap-4">
              {deadPersonDetails.dateofbirth && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{translate('Date of Birth')}</p>
                  <p className="text-sm font-medium dark:text-white">
                    {new Date(deadPersonDetails.dateofbirth).toLocaleDateString('ms-MY')}
                  </p>
                </div>
              )}
              <div className="mr-4">
                {deadPersonDetails.dateofdeath && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {translate('Date of Death')}
                    </p>
                    <p className="text-sm font-medium dark:text-white">
                      {new Date(person.dateofdeath).toLocaleDateString('ms-MY')}
                      {age && ` (${age} ${translate('years')})`}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {deadPersonDetails.biography && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{translate('Biography')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {deadPersonDetails.biography}
                </p>
              </div>
            )}
          </div>
          {(deadPersonDetails.latitude && deadPersonDetails.longitude) && (
            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openDirections(person.latitude, person.longitude)
                }}
                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <Navigation className="w-3 h-3 mr-1" />{translate('Direction')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  shareLink({
                    title: person?.name || 'Name',
                    text: `Name: ${person?.name}`,
                  })
                }}
                className="flex-1 h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                <Share2 className="w-3 h-3 mr-1" />
                {translate('Share')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {graveDetails && (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {translate('Grave Location')}
            </h2>

            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mb-2">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-300" />
              </div>
              <div>
                <p className="font-medium text-sm dark:text-white">
                  {graveDetails.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {graveDetails.state}
                </p>
              </div>
            </div>

            {(graveDetails.latitude && graveDetails.longitude) && (
            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openDirections(grave.latitude, grave.longitude)
                }}
                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <Navigation className="w-3 h-3 mr-1" />{translate('Direction')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();

                  const url = `${window.location.origin}${createPageUrl('GraveDetails')}?id=${grave.id}`;
                  shareLink({
                    title: grave?.name || 'Lokasi Kubur',
                    text: `Grave: ${grave?.name}`,
                    url
                  })
                }}
                className="flex-1 h-8 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                <Share2 className="w-3 h-3 mr-1" />
                {translate('Share')}
              </Button>
            </div>
          )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}