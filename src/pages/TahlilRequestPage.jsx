import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, User, Phone, Mail, Calendar, CheckCircle, Building2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedTahfiz = urlParams.get('tahfiz');
  const preSelectedDeceased = urlParams.get('deceased');

  const [selectedTahfiz, setSelectedTahfiz] = useState(preSelectedTahfiz || '');
  const [serviceTypes, setServiceTypes] = useState(['tahlil_ringkas']);
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [deceasedNames, setDeceasedNames] = useState([preSelectedDeceased || '']);
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customService, setCustomService] = useState('');
  const [referenceId, setReferenceId] = useState('');
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

  const addDeceasedName = () => {
    setDeceasedNames([...deceasedNames, '']);
  };

  const removeDeceasedName = (index) => {
    if (deceasedNames.length > 1) {
      setDeceasedNames(deceasedNames.filter((_, i) => i !== index));
    }
  };

  const updateDeceasedName = (index, value) => {
    const updated = [...deceasedNames];
    updated[index] = value;
    setDeceasedNames(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTahfiz) {
      toast.error('Sila pilih pusat tahfiz');
      return;
    }
    if (!requesterName) {
      toast.error('Sila masukkan nama pemohon');
      return;
    }
    if (!requesterPhone) {
      toast.error('Sila masukkan nombor telefon');
      return;
    }
    if (deceasedNames.filter(n => n.trim()).length === 0) {
      toast.error('Sila masukkan sekurang-kurangnya satu nama arwah');
      return;
    }
    if (!referenceId) {
      toast.error('Sila masukkan ID rujukan transaksi');
      return;
    }

    const finalNotes = serviceTypes.includes('custom') && customService
      ? `${notes}\n\nPerkhidmatan Khas: ${customService}`.trim()
      : notes;

    // Convert array to object with indices as keys
    const deceasedNamesObject = {};
    deceasedNames.forEach((name, index) => {
      if (name.trim()) {
        deceasedNamesObject[index] = name.trim();
      }
    });

    createRequest.mutate({
      tahfiz_center_id: selectedTahfiz,
      service_type: serviceTypes.join(','),
      requester_name: requesterName,
      requester_phone: requesterPhone,
      requester_email: requesterEmail,
      deceased_names: deceasedNamesObject,
      preferred_date: preferredDate,
      notes: finalNotes,
      reference_id: referenceId,
      status: 'pending'
    });
  };

  const toggleServiceType = (value) => {
    setServiceTypes(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Permohonan Dihantar!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Permohonan tahlil untuk <span className="font-bold dark:text-emerald-300">{Object.values(deceasedNames).filter(n => n).join(', ')}</span> telah dihantar kepada pusat tahfiz.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Pihak pusat tahfiz akan menghubungi anda untuk pengesahan.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setDeceasedNames(['']);
                setNotes('');
                setPreferredDate('');
                setReferenceId('');
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
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mohon Servis</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Tahfiz Center */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Pilih Pusat Tahfiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTahfiz} onValueChange={setSelectedTahfiz}>
              <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder="Pilih pusat tahfiz" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700">
                {tahfizCenters.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    <div className="flex flex-col items-start">
                      <span>{center.name}</span>
                      <span className="text-xs text-gray-500">{center.state}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Service Type */}
        {selectedCenter && selectedCenter.services_offered?.length > 0 && (
            <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-lg dark:text-white">Jenis Perkhidmatan (Boleh pilih lebih dari satu)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                {SERVICE_TYPES
                  .filter(serviceType => 
                    selectedCenter.services_offered.includes(serviceType.value) || 
                    serviceType.value === 'custom'
                  )
                  .map(service => {
                    const price = selectedCenter?.service_prices?.[service.value];
                    return (
                      <Label 
                      key={service.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          serviceTypes.includes(service.value) ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'dark:border-gray-600'
                      }`}
                      >
                      <Checkbox 
                          checked={serviceTypes.includes(service.value)}
                          onCheckedChange={() => toggleServiceType(service.value)}
                          className="mt-1"
                      />
                      <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold dark:text-white">{service.label}</span>
                            {price && <span className="text-violet-600 dark:text-violet-400 font-bold">RM {price}</span>}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                      </div>
                      </Label>
                    );
                  })}
                </div>

                {serviceTypes.includes('custom') && (
                  <div className="mt-4">
                    <Label htmlFor="customService" className="dark:text-gray-300">
                      Nyatakan Perkhidmatan Khas <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="customService"
                      placeholder="Jelaskan perkhidmatan khas yang anda perlukan..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
            </CardContent>
            </Card>
        )}

        {/* Deceased Info */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg dark:text-white">Maklumat Arwah</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDeceasedName}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {deceasedNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`deceased-${index}`} className="dark:text-gray-300">
                    Nama Arwah {deceasedNames.length > 1 ? `${index + 1}` : ''} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`deceased-${index}`}
                    placeholder="Nama penuh arwah"
                    value={name}
                    onChange={(e) => updateDeceasedName(index, e.target.value)}
                    required
                  />
                </div>
                {deceasedNames.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeceasedName(index)}
                    className="mt-7 h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Requester Info */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Maklumat Pemohon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requesterName" className="dark:text-gray-300">Nama Pemohon <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="requesterPhone" className="dark:text-gray-300">No. Telefon <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="requesterEmail" className="dark:text-gray-300">Email</Label>
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
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Tarikh & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferredDate" className="dark:text-gray-300">Tarikh Pilihan</Label>
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
              <Label htmlFor="notes" className="dark:text-gray-300">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Sebarang maklumat tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="border-0 shadow-md dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">
              Butiran Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Penting:</strong> Selepas membuat pembayaran melalui FPX, sila masukkan ID rujukan transaksi yang anda terima dari resit pembayaran.
              </p>
            </div>
            <div>
              <Label htmlFor="referenceId" className="dark:text-gray-300">
                ID Rujukan Transaksi (Reference ID) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="referenceId"
                placeholder="Masukkan ID rujukan dari transaksi FPX"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                required
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit"
          className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-200"
          disabled={createRequest.isPending || !selectedTahfiz || !requesterName || deceasedNames.filter(n => n.trim()).length === 0 || !requesterPhone || !referenceId}
        >
          {createRequest.isPending ? 'Menghantar...' : 'Hantar Permohonan'}
        </Button>
      </form>
    </div>
  );
}