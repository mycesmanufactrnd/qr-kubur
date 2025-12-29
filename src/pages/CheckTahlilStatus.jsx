import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const SERVICE_LABELS = {
  'tahlil_ringkas': 'Tahlil Ringkas',
  'tahlil_panjang': 'Tahlil Panjang',
  'yasin': 'Bacaan Yasin',
  'doa_arwah': 'Doa Arwah',
  'custom': 'Perkhidmatan Khas'
};

export default function CheckTahlilStatus() {
  const [referenceId, setReferenceId] = useState('');
  const [searching, setSearching] = useState(false);
  const [request, setRequest] = useState(null);
  const [tahfizCenter, setTahfizCenter] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = async () => {
    if (!referenceId.trim()) {
      toast.error('Sila masukkan ID rujukan');
      return;
    }

    setSearching(true);
    try {
      const requests = await base44.entities.TahlilRequest.filter({ reference_id: referenceId.trim() });
      
      if (requests.length === 0) {
        toast.error('Permohonan tidak dijumpai');
        setSearching(false);
        return;
      }

      const foundRequest = requests[0];
      setRequest(foundRequest);

      // Fetch tahfiz center details
      if (foundRequest.tahfiz_center_id) {
        const centers = await base44.entities.TahfizCenter.filter({ id: foundRequest.tahfiz_center_id });
        if (centers.length > 0) {
          setTahfizCenter(centers[0]);
        }
      }

      setIsDialogOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ralat semasa mencari permohonan');
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 text-lg px-4 py-2">
            <Clock className="w-5 h-5 mr-2" />
            Menunggu
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            Diterima
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            Selesai
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 text-lg px-4 py-2">
            <XCircle className="w-5 h-5 mr-2" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-lg px-4 py-2">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:bg-gray-800">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-600 mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Semak Status Permohonan Tahlil</h1>
          <p className="text-gray-600 dark:text-gray-400">Masukkan ID rujukan untuk menyemak status permohonan anda</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Carian Permohonan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Rujukan
              </label>
              <Input
                placeholder="ID Rujukan"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={searching}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white"
              size="lg"
            >
              <Search className="w-5 h-5 mr-2" />
              {searching ? 'Mencari...' : 'Cari'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 text-center">
              💡 <strong>Tip:</strong> ID rujukan boleh didapati daripada resit pembayaran FPX anda.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full max-h-full w-full h-full">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Status Permohonan Tahlil</DialogTitle>
          </DialogHeader>
          {request && (
            <div className="space-y-6">
              <div className="text-center py-4">
                {getStatusBadge(request.status)}
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">ID Rujukan</p>
                  <p className="font-mono font-semibold text-lg">{request.reference_id}</p>
                </div>

                {request.requester_name && (
                  <div>
                    <p className="text-sm text-gray-500">Pemohon</p>
                    <p className="font-semibold">{request.requester_name}</p>
                  </div>
                )}

                {request.deceased_name && (
                    <div>
                      <p className="text-sm text-gray-500">Nama Arwah</p>
                      <p className="font-semibold">{request.deceased_name}</p>
                    </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Jenis Perkhidmatan</p>
                  <p className="font-semibold">
                    {(request.service_type || '')
                      .split(',')
                      .filter(Boolean)
                      .map(type => SERVICE_LABELS[type] || type)
                      .join(', ')
                    }
                  </p>
                </div>

                {tahfizCenter && (
                  <div>
                    <p className="text-sm text-gray-500">Pusat Tahfiz</p>
                    <p className="font-semibold">{tahfizCenter.name}</p>
                  </div>
                )}

                {request.preferred_date && (
                  <div>
                    <p className="text-sm text-gray-500">Tarikh Pilihan</p>
                    <p className="font-semibold">
                      {new Date(request.preferred_date).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                )}

                {request.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="text-gray-700">{request.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Tarikh Permohonan</p>
                  <p className="font-semibold">
                    {new Date(request.created_date).toLocaleDateString('ms-MY', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full"
              >
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}