import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, User, Phone, Mail, Calendar, CheckCircle, Building2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SERVICE_TYPES = [
  { value: 'tahlil_ringkas', label: 'Tahlil Ringkas', description: 'Bacaan tahlil ringkas untuk arwah' },
  { value: 'tahlil_panjang', label: 'Tahlil Panjang', description: 'Bacaan tahlil lengkap dengan surah-surah pilihan' },
  { value: 'yasin', label: 'Bacaan Yasin', description: 'Pembacaan Surah Yasin untuk arwah' },
  { value: 'doa_arwah', label: 'Doa Arwah', description: 'Doa khusus untuk arwah' },
  { value: 'custom', label: 'Perkhidmatan Khas', description: 'Perkhidmatan mengikut permintaan' }
];

export default function TahlilRequestPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedTahfiz = urlParams.get('tahfiz');
  const preSelectedDeceased = urlParams.get('deceased');

  const [selectedTahfiz, setSelectedTahfiz] = useState(preSelectedTahfiz || '');
  const [serviceType, setServiceType] = useState('tahlil_ringkas');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [deceasedName, setDeceasedName] = useState(preSelectedDeceased || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const { data: tahfizCenters = [], isLoading } = useQuery({
    queryKey: ['tahfiz-centers'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  const selectedCenter = tahfizCenters.find(c => c.id === selectedTahfiz);

  const createRequest = useMutation({
    mutationFn: (data) => base44.entities.TahlilRequest.create(data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries(['tahlil-requests']);
      toast.success('Permohonan tahlil telah dihantar!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTahfiz || !requesterName || !deceasedName || !requesterPhone) {
      toast.error('Sila lengkapkan maklumat yang diperlukan');
      return;
    }

    createRequest.mutate({
      tahfiz_center_id: selectedTahfiz,
      service_type: serviceType,
      requester_name: requesterName,
      requester_phone: requesterPhone,
      requester_email: requesterEmail,
      deceased_name: deceasedName,
      preferred_date: preferredDate,
      notes: notes,
      status: 'pending'
    });
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Permohonan Dihantar!</h2>
            <p className="text-gray-600 mb-4">
              Permohonan tahlil untuk <span className="font-bold">{deceasedName}</span> telah dihantar kepada pusat tahfiz.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Pihak pusat tahfiz akan menghubungi anda untuk pengesahan.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setDeceasedName('');
                setNotes('');
                setPreferredDate('');
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Buat Permohonan Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navigate = useNavigate();
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Mohon Tahlil</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Tahfiz Center */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-600" />
              Pilih Pusat Tahfiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTahfiz} onValueChange={setSelectedTahfiz}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pusat tahfiz" />
              </SelectTrigger>
              <SelectContent>
                {tahfizCenters.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    <div className="flex flex-col">
                      <span>{center.name}</span>
                      <span className="text-xs text-gray-500">{center.state}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCenter && selectedCenter.services_offered?.length > 0 && (
              <div className="mt-4 p-4 bg-violet-50 rounded-xl">
                <p className="text-sm text-violet-800 font-semibold mb-2">Perkhidmatan tersedia:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCenter.services_offered.map(service => (
                    <Badge key={service} variant="secondary" className="bg-violet-100 text-violet-700">
                      {SERVICE_TYPES.find(s => s.value === service)?.label || service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Type */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Jenis Perkhidmatan</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={serviceType} onValueChange={setServiceType}>
              <div className="grid gap-3">
                {SERVICE_TYPES.map(service => (
                  <Label 
                    key={service.value}
                    className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors [&:has(:checked)]:border-violet-500 [&:has(:checked)]:bg-violet-50"
                  >
                    <RadioGroupItem value={service.value} className="mt-1" />
                    <div>
                      <span className="font-semibold">{service.label}</span>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Deceased Info */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Maklumat Arwah</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="deceasedName">Nama Arwah *</Label>
              <Input
                id="deceasedName"
                placeholder="Nama penuh arwah"
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Requester Info */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Maklumat Pemohon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requesterName">Nama Pemohon *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="requesterName"
                  placeholder="Nama anda"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="requesterPhone">No. Telefon *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="requesterPhone"
                  placeholder="01X-XXXXXXX"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="requesterEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="requesterEmail"
                  type="email"
                  placeholder="email@contoh.com"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Date */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Tarikh & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferredDate">Tarikh Pilihan</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="preferredDate"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Sebarang maklumat tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit"
          className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-200"
          disabled={createRequest.isPending || !selectedTahfiz || !requesterName || !deceasedName || !requesterPhone}
        >
          {createRequest.isPending ? 'Menghantar...' : 'Hantar Permohonan'}
        </Button>
      </form>
    </div>
  );
}