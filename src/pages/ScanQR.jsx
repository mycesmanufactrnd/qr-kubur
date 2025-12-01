import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { QrCode, Camera, Upload, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ScanQR() {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    // Search for grave or person with this QR code
    const graves = await base44.entities.Grave.filter({ qr_code: manualCode.trim() });
    
    if (graves.length > 0) {
      // Log visit
      await base44.entities.VisitLog.create({
        grave_id: graves[0].id,
        visit_type: 'qr_scan'
      });
      
      setResult({ type: 'grave', data: graves[0] });
    } else {
      // Try searching by ID
      const gravesById = await base44.entities.Grave.filter({ id: manualCode.trim() });
      if (gravesById.length > 0) {
        await base44.entities.VisitLog.create({
          grave_id: gravesById[0].id,
          visit_type: 'qr_scan'
        });
        setResult({ type: 'grave', data: gravesById[0] });
      } else {
        setError('Kod QR tidak dijumpai. Sila pastikan kod yang dimasukkan adalah betul.');
      }
    }
    
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Upload and process the QR image
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    // Use LLM to extract QR code
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract the QR code content from this image. If you can see a QR code, return its content. If no QR code is visible, return "NOT_FOUND".`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          qr_content: { type: "string" },
          found: { type: "boolean" }
        }
      }
    });

    if (response.found && response.qr_content && response.qr_content !== "NOT_FOUND") {
      setManualCode(response.qr_content);
      // Search for the grave
      const graves = await base44.entities.Grave.filter({ qr_code: response.qr_content });
      if (graves.length > 0) {
        await base44.entities.VisitLog.create({
          grave_id: graves[0].id,
          visit_type: 'qr_scan'
        });
        setResult({ type: 'grave', data: graves[0] });
      } else {
        setError('Kod QR dijumpai tetapi tiada rekod dalam sistem.');
      }
    } else {
      setError('Tidak dapat membaca kod QR dari gambar. Sila cuba lagi atau masukkan kod secara manual.');
    }
    
    setLoading(false);
  };

  const navigateToResult = () => {
    if (result?.type === 'grave') {
      window.location.href = createPageUrl('GraveDetails') + `?id=${result.data.id}`;
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Imbas Kod QR</h1>
        <p className="text-gray-500 mt-2">Imbas kod QR pada batu nisan untuk melihat maklumat si mati</p>
      </div>

      {/* Manual Input */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Masukkan Kod Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSearch} className="space-y-4">
            <Input
              type="text"
              placeholder="Contoh: QRK-001234"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="text-center text-lg"
            />
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={loading || !manualCode.trim()}
            >
              {loading ? 'Mencari...' : 'Cari'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upload QR Image */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Muat Naik Gambar QR</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-gray-500">Klik untuk muat naik gambar kod QR</span>
          </Button>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-700">Rekod Dijumpai!</p>
                <p className="text-sm text-gray-600">
                  {result.type === 'grave' ? 'Tanah Perkuburan' : 'Rekod Si Mati'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-bold text-lg text-gray-900">
                {result.data.cemetery_name || result.data.name}
              </h3>
              {result.data.state && (
                <p className="text-gray-500">{result.data.state}</p>
              )}
              {result.data.block && (
                <p className="text-sm text-gray-500 mt-1">Blok: {result.data.block}, Lot: {result.data.lot}</p>
              )}
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={navigateToResult}
            >
              Lihat Butiran Penuh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-0 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Cara Menggunakan:</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li>1. Cari kod QR pada batu nisan</li>
            <li>2. Ambil gambar kod QR tersebut</li>
            <li>3. Muat naik gambar atau masukkan kod secara manual</li>
            <li>4. Sistem akan memaparkan maklumat si mati</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}