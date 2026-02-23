import { useEffect, useState } from 'react';
import { createPageUrl } from '../utils/index';
import { Camera, X, AlertCircle, CheckCircle, ScanLine, RefreshCw, MapPin } from 'lucide-react';
import QrScanner from 'react-qr-scanner';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { trpc } from '@/utils/trpc';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { showSuccess } from '@/components/ToastrNotification';
import { ipAddressQueryOptions } from '@/utils/queryOptions';
import { Button } from '@/components/ui/button';

export default function ScanQR() {
  const { data: visitorIp } = trpc.auth.getClientIp.useQuery(undefined, {
    ...ipAddressQueryOptions,
  });

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedGraveId, setScannedGraveId] = useState(null);
  const [scannedDeadPersonId, setScannedDeadPersonId] = useState(null);

  const { data: selectedGrave, isLoading: graveLoading } = trpc.grave.getGraveById.useQuery(
    { id: scannedGraveId },
    { enabled: typeof scannedGraveId === 'number' }
  );

  const { data: selectedDeadPerson, isLoading: personLoading } = trpc.deadperson.getDeadPersonById.useQuery(
    { id: scannedDeadPersonId },
    { enabled: typeof scannedDeadPersonId === 'number' }
  );

  const result =
    selectedGrave
      ? { type: 'grave', data: selectedGrave }
      : selectedDeadPerson
      ? { type: 'deadperson', data: selectedDeadPerson }
      : null;

  useEffect(() => {
    if (selectedGrave) showSuccess(`Found grave: ${selectedGrave.name}`);
    if (selectedDeadPerson) showSuccess(`Found Dead Person: ${selectedDeadPerson.name}`);
  }, [selectedGrave, selectedDeadPerson]);

  const createMutation = trpc.visitLogs.create.useMutation();

  const createVisitLog = async (type, id) => {
    if (!visitorIp) return;
    try {
      await createMutation.mutateAsync({
        grave: type === 'grave' ? { id } : null,
        deadperson: type === 'deadperson' ? { id } : null,
        visitorip: visitorIp,
      });
    } catch (err) {
      console.error('Failed to log visit', err);
    }
  };

  const handleScan = async (data) => {
    if (data && !loading) {
      setLoading(true);
      setError("");
      setScanning(false);
      const qrCode = data.text || data;
      try {
        const parsed = JSON.parse(qrCode);
        const { type, id } = parsed;
        const numericId = Number(id);
        if (isNaN(numericId) || !type || !id) {
          setError('Kod QR tidak sah.');
          setLoading(false);
          return;
        }
        if (type === 'grave') {
          setScannedGraveId(numericId);
          await createVisitLog(type, numericId);
        } else if (type === 'deadperson') {
          setScannedDeadPersonId(numericId);
          await createVisitLog(type, numericId);
        } else {
          setError('Kod QR tidak dijumpai dalam sistem.');
        }
      } catch (err) {
        console.error('Error processing QR:', err);
        setError('Kod QR tidak sah.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (err) => {
    setError(translate('Camera Error'));
  };

  const navigateToResult = () => {
    if (result?.type === 'grave') {
      window.location.href = createPageUrl('GraveDetails') + `?id=${result.data.id}`;
    } else if (result?.type === 'deadperson') {
      window.location.href = createPageUrl('DeadPersonDetails') + `?id=${result.data.id}`;
    }
  };

  const handleReset = () => {
    setError("");
    setScannedGraveId(null);
    setScannedDeadPersonId(null);
  };

  if (graveLoading || personLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BackNavigation title={translate('Scan QR')} />
        <PageLoadingComponent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <BackNavigation title={translate('Scan QR')} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {!result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {scanning ? (
              <div className="relative aspect-square w-full">
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  constraints={{ video: { facingMode: 'environment' } }}
                />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-56 h-56">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />
                    <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-emerald-400/70 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                  <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                    <p className="text-white text-xs font-medium">Arahkan kamera ke kod QR</p>
                  </div>
                </div>

                <Button
                  onClick={() => setScanning(false)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <ScanLine className="w-9 h-9 text-white" />
                  </div>
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">{translate('Scan with Camera')}</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-[220px]">
                  Imbas kod QR pada batu nisan atau rekod untuk melihat maklumat.
                </p>

                <Button
                  onClick={() => setScanning(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-200 active:opacity-80 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {translate('Open Camera')}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && error !== "" && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-100 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600 flex-1">{error}</p>
            <Button
              onClick={() => { setError(null); setScanning(true); }}
              className="text-xs text-red-400 font-semibold underline underline-offset-2 shrink-0"
            >
              Cuba lagi
            </Button>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Green header strip */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white" />
              <p className="text-xs font-semibold text-white uppercase tracking-widest">{translate('Record Found')}</p>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">{result.data.name}</h3>

                {result.type === 'grave' && result.data.state && (
                  <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {result.data.state}
                  </p>
                )}
                {result.type === 'grave' && result.data.block && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    {translate('Blok')} {result.data.block}, {translate('Lot')} {result.data.lot}
                  </p>
                )}
                {result.type === 'deadperson' && result.data.dateofdeath && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    {new Date(result.data.dateofdeath).toLocaleDateString('ms-MY')}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={navigateToResult}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold shadow-sm shadow-emerald-200 active:opacity-80 transition-all"
                >
                  {translate('View Details')}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold active:opacity-70 transition-opacity"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {translate('Scan Again')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}