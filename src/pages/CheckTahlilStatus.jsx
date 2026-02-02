import { useEffect, useState } from 'react';
import { Search, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showError } from '@/components/ToastrNotification';
import { SERVICE_TYPES, TahlilStatus } from '@/utils/enums';
import BackNavigation from '@/components/BackNavigation';
import { trpc } from '@/utils/trpc';
import { translate } from '@/utils/translations';

export default function CheckTahlilStatus() {
  const [referenceId, setReferenceId] = useState('');
  const [searchKey, setSearchKey] = useState(null);
  const [searching, setSearching] = useState(false);
  const [request, setRequest] = useState(null);
  const [tahfizCenter, setTahfizCenter] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: tahlilRequest,
    isLoading,
  } = trpc.tahlilRequest.getByReferenceNo.useQuery(
    searchKey ? { referenceno: searchKey } : null,
    { enabled: !!searchKey }
  );

  useEffect(() => {
    if (!searchKey) return;

    if (!isLoading) {
      setSearching(false);

      if (!tahlilRequest) {
        showError('Permohonan Tidak Dijumpa');
        return;
      }

      setRequest(tahlilRequest);

      if (tahlilRequest.tahfizcenter) {
        setTahfizCenter(tahlilRequest.tahfizcenter);
      }

      setIsDialogOpen(true);
    }
  }, [tahlilRequest, isLoading, searchKey]);

  const handleSearch = () => {
    if (!referenceId.trim()) {
      showError('Sila Masukkan ID Rujukan');
      return;
    }

    setSearching(true);
    setSearchKey(referenceId.trim());
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case TahlilStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 text-lg px-4 py-2">
            <Clock className="w-5 h-5 mr-2" />
            Menunggu
          </Badge>
        );
      case TahlilStatus.ACCEPTED:
        return (
          <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            Diterima
          </Badge>
        );
      case TahlilStatus.COMPLETED:
        return (
          <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            Selesai
          </Badge>
        );
      case TahlilStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-700 text-lg px-4 py-2">
            <XCircle className="w-5 h-5 mr-2" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <BackNavigation title="Tahlil Status" />

      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-600 mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{translate('Check Tahlil Application Status')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Masukkan ID rujukan untuk menyemak status permohonan anda
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Carian Permohonan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Rujukan Transaksi
              </label>
              <Input
                placeholder="ID Rujukan"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
              💡 <strong>Tip:</strong> ID rujukan boleh didapati daripada resit pembayaran anda.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSearchKey(null);
            setRequest(null);
            setTahfizCenter(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl w-full max-h-[95vh] overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-center text-xl font-bold tracking-wide">
              Status Permohonan Tahlil
            </DialogTitle>
          </DialogHeader>

          {request && (
            <div className="px-6 py-6 space-y-8">
              <div className="flex flex-col items-center space-y-3">
                <div className="text-3xl font-bold tracking-widest font-mono">
                  {request.referenceno}
                </div>
                {getStatusBadge(request.status)}
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {request.requestorname && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Pemohon</p>
                    <p className="font-semibold text-lg">{request.requestorname}</p>
                  </div>
                )}
                {tahfizCenter && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Pusat Tahfiz</p>
                    <p className="font-semibold text-lg">{tahfizCenter.name}</p>
                  </div>
                )}
                {request.preferreddate && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Tarikh Pilihan</p>
                    <p className="font-semibold">
                      {new Date(request.preferreddate).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Tarikh Permohonan</p>
                  <p className="font-semibold">
                    {new Date(request.createdat).toLocaleDateString('ms-MY')}
                  </p>
                </div>
              </div>
              {request.deceasednames?.length > 0 && (
                <div className="bg-white border rounded-xl p-5">
                  <p className="text-sm font-semibold mb-3">Nama Arwah</p>
                  <ol className="list-decimal pl-5 space-y-1 font-medium">
                    {request.deceasednames.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ol>
                </div>
              )}
              {request.selectedservices?.length > 0 && (
                <div className="bg-white border rounded-xl p-5">
                  <p className="text-sm font-semibold mb-3">Jenis Perkhidmatan</p>
                  <div className="flex flex-wrap gap-2">
                    {request.selectedservices.map((type, i) => {
                      const service = SERVICE_TYPES.find(s => s.value === type);

                      return (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                          title={service?.description || ''}
                        >
                          {service?.label || type}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {request.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-sm font-semibold mb-2">Catatan</p>
                  <p className="text-gray-700 leading-relaxed">{request.notes}</p>
                </div>
              )}
              <Button
                onClick={() => {
                  setIsDialogOpen(false);
                  setSearchKey(null);
                }}
                className="w-full h-12 text-lg rounded-xl"
                variant="outline"
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
