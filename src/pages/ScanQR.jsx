import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { QrCode, Camera, X, AlertCircle, CheckCircle, Keyboard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QrScanner from 'react-qr-scanner';
import { getTranslation, getCurrentLanguage } from '../components/translations';

export default function ScanQR() {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [lang, setLang] = useState('ms');

  useEffect(() => {
    setLang(getCurrentLanguage());
  }, []);

  const t = (key) => getTranslation(key, lang);

  const handleScan = async (data) => {
    if (data && !loading) {
      setLoading(true);
      setError(null);
      setScanning(false);

      const qrCode = data.text || data;
      
      try {
        // Get visitor IP
        const { ip } = await base44.functions.invoke('getClientIp');
        
        // Check graves first
        const graves = await base44.entities.Grave.filter({ qr_code: qrCode });
        
        if (graves.length > 0) {
          await base44.entities.VisitLog.create({
            grave_id: graves[0].id,
            visitor_ip: ip,
            visit_type: 'qr_scan'
          });
          setResult({ type: 'grave', data: graves[0] });
        } else {
          const gravesById = await base44.entities.Grave.filter({ id: qrCode });
          if (gravesById.length > 0) {
            await base44.entities.VisitLog.create({
              grave_id: gravesById[0].id,
              visitor_ip: ip,
              visit_type: 'qr_scan'
            });
            setResult({ type: 'grave', data: gravesById[0] });
          } else {
            // Check dead persons
            const persons = await base44.entities.DeadPerson.filter({ qr_code: qrCode });
            if (persons.length > 0) {
              await base44.entities.VisitLog.create({
                dead_person_id: persons[0].id,
                visitor_ip: ip,
                visit_type: 'qr_scan'
              });
              setResult({ type: 'person', data: persons[0] });
            } else {
              const personsById = await base44.entities.DeadPerson.filter({ id: qrCode });
              if (personsById.length > 0) {
                await base44.entities.VisitLog.create({
                  dead_person_id: personsById[0].id,
                  visitor_ip: ip,
                  visit_type: 'qr_scan'
                });
                setResult({ type: 'person', data: personsById[0] });
              } else {
                setError('Kod QR tidak dijumpai dalam sistem.');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error logging visit:', error);
        setError('Kod QR tidak dijumpai dalam sistem.');
      }
      
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError(t('cameraError'));
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get visitor IP
      const { ip } = await base44.functions.invoke('getClientIp');
      
      const graves = await base44.entities.Grave.filter({ qr_code: manualCode.trim() });
      
      if (graves.length > 0) {
        await base44.entities.VisitLog.create({
          grave_id: graves[0].id,
          visitor_ip: ip,
          visit_type: 'qr_scan'
        });
        setResult({ type: 'grave', data: graves[0] });
      } else {
        const gravesById = await base44.entities.Grave.filter({ id: manualCode.trim() });
        if (gravesById.length > 0) {
          await base44.entities.VisitLog.create({
            grave_id: gravesById[0].id,
            visitor_ip: ip,
            visit_type: 'qr_scan'
          });
          setResult({ type: 'grave', data: gravesById[0] });
        } else {
          // Check dead persons
          const persons = await base44.entities.DeadPerson.filter({ qr_code: manualCode.trim() });
          if (persons.length > 0) {
            await base44.entities.VisitLog.create({
              dead_person_id: persons[0].id,
              visitor_ip: ip,
              visit_type: 'qr_scan'
            });
            setResult({ type: 'person', data: persons[0] });
          } else {
            const personsById = await base44.entities.DeadPerson.filter({ id: manualCode.trim() });
            if (personsById.length > 0) {
              await base44.entities.VisitLog.create({
                dead_person_id: personsById[0].id,
                visitor_ip: ip,
                visit_type: 'qr_scan'
              });
              setResult({ type: 'person', data: personsById[0] });
            } else {
              setError(t('codeNotFound'));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(t('codeNotFound'));
    }
    
    setLoading(false);
  };

  const navigateToResult = () => {
    if (result?.type === 'grave') {
      window.location.href = createPageUrl('GraveDetails') + `?id=${result.data.id}`;
    } else if (result?.type === 'person') {
      window.location.href = createPageUrl('DeadPersonDetails') + `?id=${result.data.id}`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-2">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('scanQRCode')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('useCamera')}</p>
      </div>

      {/* Camera Scanner */}
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('scanWithCamera')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('pointCamera')}</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => setScanning(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t('openCamera')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowManual(!showManual)}
                    className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    {t('typeCode')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Input */}
      {showManual && !result && (
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardContent className="p-4">
            <form onSubmit={handleManualSearch} className="space-y-3">
              <Input
                type="text"
                placeholder={t('enterQRCode')}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-center dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading || !manualCode.trim()}
              >
                {loading ? t('searching') : t('search')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Card className="border-0 shadow-lg bg-emerald-50 dark:bg-emerald-900/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{t('recordFound')}</p>
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
                {t('viewDetails')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setManualCode('');
                }}
                className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                {t('scanAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}