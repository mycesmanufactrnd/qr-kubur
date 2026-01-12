import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle, ArrowLeft, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageTextCaptcha from '../components/ImageTextCaptcha';
import { showSuccess, showError, showWarning } from '../components/ToastrNotification';
import BackNavigation from '@/components/BackNavigation';
import { Controller, useForm } from 'react-hook-form';
import { validateFields } from '@/utils/validations';
import { trpc } from '@/utils/trpc';
import { useCreateSuggestion, useRecentCountSuggestion } from '@/hooks/useSuggestionMutations';

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

  const { data: graves = [] } = useQuery({
    queryKey: ['graves-nearby'],
    queryFn: () => base44.entities.Grave.list(),
    enabled: watchType === 'grave' || watchType === 'person'
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons-by-grave', watchSelectedGrave],
    queryFn: () => base44.entities.DeadPerson.filter({ grave_id: watchSelectedGrave }),
    enabled: watchType === 'person' || !!watchSelectedGrave
  });

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: 'type', label: 'Record Type', type: 'select' },
      { field: 'entityId', label: 'Record', type: 'select' },
      { field: 'suggestedchanges', label: 'Suggested Changes', type: 'text' },
    ]);

    if (!isValid) return;
      
    const { type, entityId, watchSelectedGrave, suggestedchanges, reason } = formData;

    const suggestionData = {
      type: type,
      suggestedchanges: suggestedchanges,
      reason,
      status: 'pending'
    };

    if (recentCount >= 3) {
      showWarning("Anda telah mencapai had 3 cadangan sejam");
      return;
    }

    if (type === 'person') {
      //check apa yg diorg buat
      suggestionData.grave = { id: watchSelectedGrave };
      suggestionData.deadperson = { id: entityId };
    }

    if (type === 'grave') {
      //check apa yg diorg buat
      suggestionData.grave = { id: entityId };
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
      <BackNavigation title="Suggestion" />
      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="type" className="dark:text-gray-300">Jenis Rekod</Label>
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
                      <SelectValue placeholder="Pilih jenis rekod" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">Rekod Si Mati</SelectItem>
                      <SelectItem value="grave">Tanah Perkuburan</SelectItem>
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
                      <Label className="dark:text-gray-300">Pilih Kubur <span className="text-red-500">*</span></Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Pilih kubur" /></SelectTrigger>
                        <SelectContent>
                          {graves.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.cemetery_name}</SelectItem>
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
                    <Label className="dark:text-gray-300">Pilih Si Mati <span className="text-red-500">*</span></Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Pilih si mati" /></SelectTrigger>
                      <SelectContent>
                        {persons.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                    <Label>Pilih Kubur <span className="text-red-500">*</span></Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kubur berdekatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {graves.slice(0, 20).map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {g.cemetery_name} - {g.state}
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
              <Label htmlFor="suggestedchanges" className="dark:text-gray-300">Cadangan Pembetulan <span className="text-red-500">*</span></Label>
              <Controller
                name="suggestedchanges"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Textarea {...field} rows={5} placeholder="Nyatakan pembetulan..." />
                )}
              />

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Contoh: "Nama sepatutnya Ahmad bin Abu, bukan Ahmad bin Bakar"
              </p>
            </div>

            <div>
              <Label htmlFor="reason" className="dark:text-gray-300">Sebab / Justifikasi</Label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Textarea {...field} rows={3} placeholder="Sebab..." />
                )}
              />
            </div>

            <Button type="submit" disabled={!watch('type') || !watch('entityId') || !watch('suggestedchanges')}>
              Hantar Cadangan
            </Button>
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