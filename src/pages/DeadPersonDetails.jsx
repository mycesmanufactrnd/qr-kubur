import { Link, useSearchParams } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Building2, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackNavigation from '@/components/BackNavigation';
import { calculateAge } from '@/utils/helpers';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import ShareButton from '@/components/ShareButton';
import DirectionButton from '@/components/DirectionButton';
import { translate } from '@/utils/translations';
import { createPageUrl } from '@/utils';
import InitialAvatarImage from '@/components/InitialAvatarImage';

export default function DeadPersonDetails() {
  const [searchParams] = useSearchParams();
  const personId = Number(searchParams.get('id'));

  const { data: deadPersonDetails, isLoading, isError } = 
    trpc.deadperson.getDeadPersonById.useQuery(
    { id: personId }, 
    { enabled: !!personId }
  );

  const graveDetails = deadPersonDetails?.grave;
  const graveState = graveDetails?.state?.trim() || '';

  const { data: graveServiceOrganisations = [], isLoading: isGraveServiceOrganisationsLoading } = 
    trpc.organisation.getGraveServiceByState.useQuery(
    { state: graveState },
    { enabled: !!graveState }
  );

  if (isLoading) {
    return <PageLoadingComponent />;
  }

  if (isError || !deadPersonDetails) {
    return (
      <>
        <BackNavigation />
        <NoDataCardComponent isPage/>
      </>
    );
  }

  const age = calculateAge(deadPersonDetails.dateofbirth, deadPersonDetails.dateofdeath);

  return (
    <div className="space-y-3 pb-2 p-1">
      <BackNavigation title={deadPersonDetails.name} />
      
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-center">
            <InitialAvatarImage
              src={
                deadPersonDetails.photourl
                  ? `/api/file/dead-person/${encodeURIComponent(deadPersonDetails.photourl)}`
                  : undefined
              }
              name={deadPersonDetails.name}
              className="w-32 h-32"
            />
          </div>
          <div className="space-y-3">
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
                      {new Date(deadPersonDetails.dateofdeath).toLocaleDateString('ms-MY')}
                      {age && ` (${age} tahun)`}
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
              <DirectionButton
                addClass="flex-1"
                latitude={deadPersonDetails.latitude}
                longitude={deadPersonDetails.longitude}
              />
              <ShareButton
                addClass="flex-1"
                title={deadPersonDetails?.name || 'Name'}
                textMessage={`Name: ${deadPersonDetails?.name || ''}`}
              />
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
                <DirectionButton
                  addClass="flex-1"
                  latitude={graveDetails.latitude}
                  longitude={graveDetails.longitude}
                />
                <ShareButton
                  addClass="flex-1"
                  title={graveDetails?.name || 'Grave'}
                  textMessage={`Lokasi Kubur: ${graveDetails?.name || ''}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {graveDetails && (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-3 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {translate('Grave Services')}
            </h2>

            {isGraveServiceOrganisationsLoading ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {translate('Loading...')}
              </p>
            ) : graveServiceOrganisations.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {translate('No grave service organisations available in this state')}
              </p>
            ) : (
              <div className="space-y-2">
                {graveServiceOrganisations.map((organisation) => (
                  <Link
                    key={organisation.id}
                    to={`${createPageUrl('OrganisationDetails')}?id=${organisation.id}&deadpersonId=${personId}`}
                    className="block"
                  >
                    <Card className="border border-gray-100 dark:border-gray-700 shadow-none hover:border-violet-300 dark:hover:border-violet-500 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                            {organisation.photourl ? (
                              <img
                                src={`/api/file/bucket-organisation/${encodeURIComponent(organisation.photourl)}`}
                                alt={organisation.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {organisation.name}
                              </p>
                              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {((organisation.serviceoffered || []).slice(0, 2)).map((serviceName) => (
                                <Badge
                                  key={`${organisation.id}-${serviceName}`}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {serviceName}
                                </Badge>
                              ))}

                              {(organisation.serviceoffered || []).length > 2 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  +{(organisation.serviceoffered || []).length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
