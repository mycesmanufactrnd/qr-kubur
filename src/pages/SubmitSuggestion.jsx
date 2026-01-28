import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { CheckCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageTextCaptcha from '../components/ImageTextCaptcha';
import { showError, showWarning } from '../components/ToastrNotification';
import BackNavigation from '@/components/BackNavigation';
import { Controller, useForm } from 'react-hook-form';
import { validateFields } from '@/utils/validations';
import { trpc } from '@/utils/trpc';
import { useCreateSuggestion, useRecentCountSuggestion } from '@/hooks/useSuggestionMutations';
import { useGetGraveCoordinates } from '@/hooks/useGraveMutations';
import { getDistanceFromLatLonInKm } from '@/utils/helpers';
import { translate } from '@/utils/translations';


export default function SubmitSuggestion() {
  const oneHourAgo = useMemo(() => new Date(Date.now() - 60 * 60 * 1000).toISOString(), []);

  const { data: visitorIp } = trpc.auth.getClientIp.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const recentCount = useRecentCountSuggestion(visitorIp, oneHourAgo); 

  const { 
    control, 
    handleSubmit: handleFormSubmit, 
    reset: handleResetForm, setValue, watch 
  } = useForm({
    defaultValues: {
      name: '',
      phoneno: '',
      type: '',
      watchSelectedGrave: '',
      entityId: '',
      suggestedchanges: '',
      reason: ''
    }
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const watchType = watch('type');
  const watchSelectedGrave = watch('watchSelectedGrave');

  const createMutation = useCreateSuggestion();

  // if no extension created in psql
  // docker exec -it <container_name_or_id> psql -U <db_user> -d <db_name>
  // CREATE EXTENSION IF NOT EXISTS cube;
  // CREATE EXTENSION IF NOT EXISTS earthdistance;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => setUserLocation(null)
      );
    }
  }, []);

  const { graves: nearbyGraves } = useGetGraveCoordinates({
    coordinates: userLocation,
    enabled: watchType === "grave" || watchType === "person",
  });

  const gravesWithDistance = nearbyGraves.map(g => {
    if (g.latitude != null && g.longitude != null) {
      const distance = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, g.latitude, g.longitude);
      return { ...g, distance };
    }
    return { ...g, distance: Infinity };
  });

  const { data: persons, isLoading: isPersonLoading } = trpc.deadperson.getDeadPersonByGraveId.useQuery(
    { graveId: Number(watchSelectedGrave) ?? 0 },
    { enabled: !!watchSelectedGrave }
  );

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: 'name', label: 'Name', type: 'text' },
      { field: 'phoneno', label: 'Phone No.', type: 'phone' },
      { field: 'type', label: 'Record Type', type: 'select' },
      { field: 'entityId', label: 'Record', type: 'select' },
      { field: 'suggestedchanges', label: 'Suggested Changes', type: 'text' },
      { field: 'reason', label: 'Reason', type: 'text' },
    ]);

    if (!isValid) return;
      
    const { name, phoneno, type, entityId, watchSelectedGrave, suggestedchanges, reason } = formData;

    const suggestionData = {
      name,
      phoneno,
      type,
      suggestedchanges: suggestedchanges,
      reason,
      status: 'pending',
      visitorip: visitorIp ?? null,
    };

    if (recentCount >= 3) {
      showWarning("Anda telah mencapai had 3 cadangan sejam");
      return;
    }

    if (type === 'person') {
      suggestionData.grave = { id: Number(watchSelectedGrave) };
      suggestionData.deadperson = { id: Number(entityId) };
    }

    if (type === 'grave') {
      suggestionData.grave = { id: Number(entityId) };
    }

    setPendingSubmission(suggestionData);
    setShowCaptcha(true);
  };

  const handleCaptchaVerified = async () => {
    if (!pendingSubmission) return;

    createMutation.mutateAsync(pendingSubmission)
    .then((res) => {
      if (res) {
        setSubmitted(true);
      }
    });
    setPendingSubmission(null);
  };

  const handleCaptchaFailed = () => {
    showError('Captcha gagal. Sila isi semula borang.');
    handleResetForm();
    setPendingSubmission(null);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cadangan Dihantar!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Cadangan anda telah dihantar kepada admin untuk semakan. 
              Kami akan memaklumkan anda selepas semakan selesai.
            </p>
            <Link to={createPageUrl('UserDashboard')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Kembali ke Utama
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-lg mx-auto space-y-4 pb-2">
      <BackNavigation title={translate('Suggestion')} />
      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-300">{translate('Name')}<span className="text-red-500">*</span></Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    {...field}
                    id="name" type="text"
                    placeholder={translate('Enter name')}
                    className="w-full border rounded px-3 py-1 mt-1"
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="phoneno" className="dark:text-gray-300">{translate('Phone No.')} <span className="text-red-500">*</span></Label>
              <Controller
                name="phoneno"
                control={control}
                rules={{ required: true }} 
                render={({ field }) => (
                  <input
                    {...field}
                    id="phoneno" type="text"
                    placeholder={translate('Enter phone. no')}
                    className="w-full border rounded px-3 py-1 mt-1"
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="type" className="dark:text-gray-300">{translate('Record Type')} <span className="text-red-500">*</span></Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setValue('watchSelectedGrave', '');
                      setValue('entityId', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={translate('Select Record Type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">{translate('Record Person')} </SelectItem>
                      <SelectItem value="grave">{translate('Record Grave')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Grave Selection for Person */}
              {watch('type') === 'person' && (
                <Controller
                  name="watchSelectedGrave"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <div>
                      <Label className="dark:text-gray-300">{translate('Select Grave')} <span className="text-red-500">*</span></Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder={translate('Select Grave')} /></SelectTrigger>
                        <SelectContent>
                          {gravesWithDistance.map(g => (
                            <SelectItem key={g.id} value={String(g.id)}> 
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {g.name}
                                {g.distance && g.distance !== Infinity && ` (${g.distance.toFixed(1)}km)`}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
            )}

            {/* Person Selection */}
            {watch('type') === 'person' && watch('watchSelectedGrave') && (
              <Controller
              name="entityId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                  <div>
                    <Label className="dark:text-gray-300">{translate('Select Deceased')} <span className="text-red-500">*</span></Label>
                    <Select value={String(field.value)} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder={translate('Select Deceased')} /></SelectTrigger> 
                      <SelectContent>
                        {!isPersonLoading && persons.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            )}

            {/* Grave Selection */}
            {watch('type') === 'grave' && (
              <Controller
                name="entityId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <div>
                    <Label>{translate('Select Grave')} <span className="text-red-500">*</span></Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={translate('Select nearby grave')} />
                      </SelectTrigger>
                      <SelectContent>
                        {gravesWithDistance.slice(0, 20).map(g => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {g.name}
                              {g.distance && g.distance !== Infinity && ` (${g.distance.toFixed(1)}km)`}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            )}

            <div>
              <Label htmlFor="suggestedchanges" className="dark:text-gray-300">{translate('Suggested Changes')} <span className="text-red-500">*</span></Label>
              <Controller 
                name="suggestedchanges"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Textarea {...field} rows={5} placeholder={translate('Specify Correction...')} /> 
                )}
              />

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"> 
                {translate("Example: 'The name should be Ahmad bin Abu, not Ahmad bin Bakar'")}
              </p>
            </div>

            <div>
              <Label htmlFor="reason" className="dark:text-gray-300">{translate("Reason / Justification")} <span className="text-red-500">*</span></Label>
              <Controller
                name="reason"
                control={control} 
                render={({ field }) => (
                  <Textarea {...field} rows={3} placeholder={translate("Reason...")} />
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !watch('type') ||
                  !watch('entityId') ||
                  !watch('suggestedchanges') 
                }
              >
                {translate("Submit Suggestion")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <ImageTextCaptcha
        open={showCaptcha}
        onOpenChange={setShowCaptcha}
        onVerified={handleCaptchaVerified}
        onFailed={handleCaptchaFailed}
      />
    </div>
  );
}