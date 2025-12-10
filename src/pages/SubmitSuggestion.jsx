import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function SubmitSuggestion() {
  const urlParams = new URLSearchParams(window.location.search);
  const preType = urlParams.get('type') || '';
  const preId = urlParams.get('id') || '';

  const [entityType, setEntityType] = useState(preType);
  const [entityId, setEntityId] = useState(preId);
  const [suggestedChanges, setSuggestedChanges] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const createSuggestion = useMutation({
    mutationFn: (data) => base44.entities.Suggestion.create(data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries(['suggestions']);
      toast.success('Cadangan telah dihantar!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!entityType || !suggestedChanges) {
      toast.error('Sila lengkapkan maklumat cadangan');
      return;
    }

    createSuggestion.mutate({
      entity_type: entityType,
      entity_id: entityId,
      suggested_changes: suggestedChanges,
      reason: reason,
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadangan Dihantar!</h2>
            <p className="text-gray-600 mb-6">
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

  const navigate = useNavigate();
  
  return (
    <div className="max-w-lg mx-auto space-y-4 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Cadangan</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="entityType">Jenis Rekod</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis rekod" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Rekod Si Mati</SelectItem>
                  <SelectItem value="grave">Tanah Perkuburan</SelectItem>
                  <SelectItem value="organisation">Organisasi</SelectItem>
                  <SelectItem value="tahfiz">Pusat Tahfiz</SelectItem>
                </SelectContent>
              </Select>
            </div>



            <div>
              <Label htmlFor="suggestedChanges">Cadangan Pembetulan *</Label>
              <Textarea
                id="suggestedChanges"
                value={suggestedChanges}
                onChange={(e) => setSuggestedChanges(e.target.value)}
                placeholder="Nyatakan maklumat yang perlu diperbetulkan dan maklumat yang betul..."
                rows={5}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Contoh: "Nama sepatutnya Ahmad bin Abu, bukan Ahmad bin Bakar"
              </p>
            </div>

            <div>
              <Label htmlFor="reason">Sebab / Justifikasi</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nyatakan sebab atau bukti untuk pembetulan ini..."
                rows={3}
              />
            </div>

            <Button 
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              disabled={createSuggestion.isPending || !entityType || !suggestedChanges}
            >
              {createSuggestion.isPending ? 'Menghantar...' : 'Hantar Cadangan'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}