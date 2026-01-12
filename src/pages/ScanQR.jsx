import { useEffect, useState } from 'react';
import { createPageUrl } from '../utils/index';
import { Camera, X, AlertCircle, CheckCircle, Keyboard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QrScanner from 'react-qr-scanner';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { trpc } from '@/utils/trpc';
import PageLoadingComponent from '@/components/PageLoadingComponent';

export default function ScanQR() {
  const { data: visitorIp } = trpc.auth.getClientIp.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannedGraveId, setScannedGraveId] = useState(null);
  const [scannedDeadPersonId, setScannedDeadPersonId] = useState(null);

  const { data: selectedGrave, isLoading: graveLoading } = trpc.grave.getGraveById.useQuery(
    { id: scannedGraveId ?? 0 },
    { enabled: scannedGraveId !== null }
  );

  const { data: selectedDeadPerson, isLoading: personLoading } = trpc.deadperson.getDeadPersonById.useQuery(
    { id: scannedDeadPersonId ?? 0 },
    { enabled: scannedDeadPersonId !== null }
  );

  useEffect(() => {
    if (selectedGrave && scannedGraveId !== null) {
      setResult({ type: 'grave', data: selectedGrave });
    }
  }, [selectedGrave, scannedGraveId]);

  useEffect(() => {
    if (selectedDeadPerson && scannedDeadPersonId !== null) {
      setResult({ type: 'person', data: selectedDeadPerson });
    }
  }, [selectedDeadPerson, scannedDeadPersonId]);

  const createMutation = trpc.visitLogs.create.useMutation();

  const createVisitLog = async (type, id) => {
    if (!visitorIp) return;

    let graveId = null;
    let deadpersonId = null;

    if (type === 'grave') graveId = id;
    else if (type === 'deadperson') deadpersonId = id;

    try {
      await createMutation.mutateAsync({
        grave: graveId ? { id: graveId } : null,
        deadperson: deadpersonId ? { id: deadpersonId } : null,
        visitorip: visitorIp,
      });
    } catch (err) {
      console.error('Failed to log visit', err);
    }
  };

  const handleScan = async (data) => {
    if (data && !loading) {
      setLoading(true);
      setError(null);
      setScanning(false);

      const qrCode = data.text || data;

      try {
        const parsed = JSON.parse(qrCode);
        const { type, id } = parsed;

        if (!type || !id) {
          setError('Kod QR tidak sah.');
          setLoading(false);
          return;
        }

        if (type === 'grave') {
          setScannedGraveId(id); 
          await createVisitLog(type, id);
        } else if (type === 'deadperson') {
          setScannedDeadPersonId(id); 
          await createVisitLog(type, id);
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
    console.error(err);
    setError(translate('cameraError'));
  };

  const navigateToResult = () => {
    if (result?.type === 'grave') {
      window.location.href = createPageUrl('GraveDetails') + `?id=${result.data.id}`;
    } else if (result?.type === 'person') {
      window.location.href = createPageUrl('DeadPersonDetails') + `?id=${result.data.id}`;
    }
  };

  if (graveLoading || personLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 pb-2 text-center">
        <BackNavigation title="Scan QR" />
        <PageLoadingComponent/>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-2">
      <BackNavigation title="Scan QR" />
      {!result && (
        <Card className="border-0 shadow-lg overflow-hidden dark:bg-gray-800">
          <CardContent className="p-0">
            {scanning ? (
              <div className="relative">
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: '100%' }}
                  constraints={{
                    video: { facingMode: 'environment' }
                  }}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-emerald-500 m-12 rounded-2xl" />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-4 right-4 rounded-full"
                  onClick={() => setScanning(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{translate('scanWithCamera')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{translate('pointCamera')}</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => setScanning(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {translate('openCamera')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="border-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="border-0 shadow-lg bg-emerald-50 dark:bg-emerald-900/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{translate('recordFound')}</p>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-1">
                  {result.type === 'grave' ? result.data.cemetery_name : result.data.name}
                </h3>
                {result.type === 'grave' && result.data.state && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{result.data.state}</p>
                )}
                {result.type === 'grave' && result.data.block && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Blok {result.data.block}, Lot {result.data.lot}</p>
                )}
                {result.type === 'person' && result.data.date_of_death && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(result.data.date_of_death).toLocaleDateString('ms-MY')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={navigateToResult}
              >
                {translate('viewDetails')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                {translate('scanAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}