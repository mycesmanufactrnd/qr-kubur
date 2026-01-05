import React, { useState, useEffect } from 'react';
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

export default function SubmitSuggestion() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preType = urlParams.get('type') || '';
  const preId = urlParams.get('id') || '';

  const [entityType, setEntityType] = useState(preType);
  const [entityId, setEntityId] = useState(preId);
  const [selectedGrave, setSelectedGrave] = useState('');
  const [suggestedChanges, setSuggestedChanges] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => setUserLocation(null)
      );
    }
  }, []);

  const { data: graves = [] } = useQuery({
    queryKey: ['graves-nearby'],
    queryFn: () => base44.entities.Grave.list(),
    enabled: entityType === 'grave' || entityType === 'person'
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons-by-grave', selectedGrave],
    queryFn: () => base44.entities.DeadPerson.filter({ grave_id: selectedGrave }),
    enabled: entityType === 'person' && !!selectedGrave
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations-nearby'],
    queryFn: () => base44.entities.Organisation.list(),
    enabled: entityType === 'organisation'
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz-nearby'],
    queryFn: () => base44.entities.TahfizCenter.list(),
    enabled: entityType === 'tahfiz'
  });

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedGraves = userLocation 
    ? graves.map(g => ({
        ...g,
        distance: g.gps_lat && g.gps_lng 
          ? calculateDistance(userLocation.lat, userLocation.lng, g.gps_lat, g.gps_lng)
          : Infinity
      })).sort((a, b) => a.distance - b.distance)
    : graves;

  const sortedOrganisations = organisations;
  const sortedTahfiz = tahfizCenters;

  const createSuggestion = useMutation({
    mutationFn: (data) => base44.entities.Suggestion.create(data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries(['suggestions']);
      showSuccess('Cadangan telah dihantar!');
    },
    onError: (error) => {
      showError('Gagal menghantar cadangan. Sila cuba lagi.');
      console.error('Suggestion error:', error);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!entityType) {
      showError('Sila pilih jenis rekod');
      return;
    }
    if (!entityId) {
      showError('Sila pilih rekod yang ingin dicadangkan');
      return;
    }
    if (!suggestedChanges) {
      showError('Sila masukkan cadangan pembetulan');
      return;
    }

    let visitorIp = 'unknown';
    try {
      const { ip } = await base44.functions.invoke('getClientIp');
      visitorIp = ip;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentSuggestions = await base44.entities.Suggestion.filter({
        visitor_ip: visitorIp,
        created_date: { $gte: oneHourAgo }
      });

      if (recentSuggestions.length >= 3) {
        showWarning('Anda telah mencapai had cadangan (3 kali sejam). Sila cuba lagi kemudian.', 'Had Dicapai');
        return;
      }
    } catch (error) {
      console.error('Error getting IP or checking rate limit:', error);
    }

    const suggestionData = {
      entity_type: entityType,
      entity_id: entityId,
      suggested_changes: suggestedChanges,
      reason: reason,
      status: 'pending',
      visitor_ip: visitorIp
    };

    if (entityType === 'person') {
      suggestionData.grave_id = selectedGrave;
      suggestionData.dead_person_id = entityId;
      const grave = graves.find(g => g.id === selectedGrave);
      suggestionData.state_id = grave?.state;
    } else if (entityType === 'grave') {
      suggestionData.grave_id = entityId;
      const grave = graves.find(g => g.id === entityId);
      suggestionData.state_id = grave?.state;
    } else if (entityType === 'organisation') {
      suggestionData.organisation_id = entityId;
      const org = organisations.find(o => o.id === entityId);
      suggestionData.state_id = Array.isArray(org?.state) ? org.state[0] : org?.state;
    } else if (entityType === 'tahfiz') {
      suggestionData.tahfiz_center_id = entityId;
      const tahfiz = tahfizCenters.find(t => t.id === entityId);
      suggestionData.state_id = tahfiz?.state;
    }

    setPendingSubmission(suggestionData);
    setShowCaptcha(true);
  };

  const handleCaptchaVerified = async () => {
    if (!pendingSubmission) return;

    createSuggestion.mutate(pendingSubmission);
    setPendingSubmission(null);
  };

  const handleCaptchaFailed = () => {
    showError('Captcha gagal. Sila isi semula borang.');
    setEntityType(preType);
    setEntityId(preId);
    setSelectedGrave('');
    setSuggestedChanges('');
    setReason('');
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
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cadangan</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="entityType" className="dark:text-gray-300">Jenis Rekod</Label>
              <Select value={entityType} onValueChange={(val) => {
                setEntityType(val);
                setEntityId('');
                setSelectedGrave('');
              }}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Pilih jenis rekod" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  <SelectItem value="person">Rekod Si Mati</SelectItem>
                  <SelectItem value="grave">Tanah Perkuburan</SelectItem>
                  <SelectItem value="organisation">Organisasi</SelectItem>
                  <SelectItem value="tahfiz">Pusat Tahfiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grave Selection for Person */}
            {entityType === 'person' && (
              <div>
                <Label className="dark:text-gray-300">Pilih Kubur <span className="text-red-500">*</span></Label>
                <Select value={selectedGrave} onValueChange={(val) => {
                  setSelectedGrave(val);
                  setEntityId('');
                }}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih kubur berdekatan" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {sortedGraves.slice(0, 20).map(g => (
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

            {/* Person Selection */}
            {entityType === 'person' && selectedGrave && (
              <div>
                <Label className="dark:text-gray-300">Pilih Si Mati <span className="text-red-500">*</span></Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih si mati" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {persons.length === 0 ? (
                      <SelectItem value="none" disabled>Tiada rekod dijumpai</SelectItem>
                    ) : (
                      persons.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.ic_number || 'Tiada IC'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Grave Selection */}
            {entityType === 'grave' && (
              <div>
                <Label className="dark:text-gray-300">Pilih Kubur <span className="text-red-500">*</span></Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih kubur berdekatan" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {sortedGraves.slice(0, 20).map(g => (
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

            {/* Organisation Selection */}
            {entityType === 'organisation' && (
              <div>
                <Label className="dark:text-gray-300">Pilih Organisasi <span className="text-red-500">*</span></Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih organisasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {sortedOrganisations.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name} - {Array.isArray(o.state) ? o.state.join(', ') : o.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tahfiz Selection */}
            {entityType === 'tahfiz' && (
              <div>
                <Label className="dark:text-gray-300">Pilih Pusat Tahfiz <span className="text-red-500">*</span></Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih pusat tahfiz" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {sortedTahfiz.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} - {t.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="suggestedChanges" className="dark:text-gray-300">Cadangan Pembetulan <span className="text-red-500">*</span></Label>
              <Textarea
                id="suggestedChanges"
                value={suggestedChanges}
                onChange={(e) => setSuggestedChanges(e.target.value)}
                placeholder="Nyatakan maklumat yang perlu diperbetulkan dan maklumat yang betul..."
                rows={5}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Contoh: "Nama sepatutnya Ahmad bin Abu, bukan Ahmad bin Bakar"
              </p>
            </div>

            <div>
              <Label htmlFor="reason" className="dark:text-gray-300">Sebab / Justifikasi</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nyatakan sebab atau bukti untuk pembetulan ini..."
                rows={3}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            <Button 
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              disabled={createSuggestion.isPending || !entityType || !suggestedChanges || !entityId}
            >
              {createSuggestion.isPending ? 'Menghantar...' : 'Hantar Cadangan'}
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