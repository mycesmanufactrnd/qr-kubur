import { useEffect, useState } from 'react';
import { Search, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showError } from '@/components/ToastrNotification';
import { TahlilStatus } from '@/utils/enums';
import BackNavigation from '@/components/BackNavigation';
import JoinLiveButton from '@/components/jitsi/JoinLiveButton';
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

      <div className="max-w-2xl mx-auto space-y-6 py-1">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-600 mb-2">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h5 className="text-lg font-bold text-gray-900 dark:text-white">{translate('Check Tahlil Application Status')}</h5>
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
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white dark:bg-gray-900">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="text-center text-base font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-4">
              Status Permohonan
            </DialogTitle>
            {request && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-3xl font-bold tracking-widest font-mono text-gray-900 dark:text-white">
                  {request.referenceno}
                </p>
                {getStatusBadge(request.status)}
              </div>
            )}
          </div>

          {request && (
            <div className="px-6 py-5 space-y-5">

              {/* Live */}
              {request.liveurl && (
                <div className="flex justify-center">
                  <JoinLiveButton room={request.liveurl} />
                </div>
              )}

              {/* Info rows */}
              <div className="space-y-3">
                {request.requestorname && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs uppercase tracking-widest text-gray-400">Pemohon</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{request.requestorname}</span>
                  </div>
                )}
                {tahfizCenter && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs uppercase tracking-widest text-gray-400">Pusat Tahfiz</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm text-right max-w-[60%]">{tahfizCenter.name}</span>
                  </div>
                )}
                {request.preferreddate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs uppercase tracking-widest text-gray-400">Tarikh Pilihan</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{new Date(request.preferreddate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs uppercase tracking-widest text-gray-400">Tarikh Mohon</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{new Date(request.createdat).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Deceased */}
              {request.deceasednames?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Nama Arwah</p>
                  <div className="space-y-2">
                    {request.deceasednames.map((name, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {request.selectedservices?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Perkhidmatan</p>
                  <div className="flex flex-wrap gap-2">
                    {request.selectedservices.map((type, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {request.notes && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <p className="text-xs uppercase tracking-widest text-amber-500 mb-1.5">Catatan</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{request.notes}</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => { setIsDialogOpen(false); setSearchKey(null); }}
                className="w-full rounded-xl h-11 text-sm font-medium"
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
