import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, Clock, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function ManageSuggestions() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['admin-suggestions'],
    queryFn: () => base44.entities.Suggestion.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Suggestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-suggestions']);
      setIsDialogOpen(false);
      setSelectedSuggestion(null);
      toast.success('Cadangan telah dikemaskini');
    }
  });

  const filteredSuggestions = suggestions.filter(s => {
    return filterStatus === 'all' || s.status === filterStatus;
  });

  const openDetailDialog = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminNotes(suggestion.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedSuggestion) return;
    updateMutation.mutate({
      id: selectedSuggestion.id,
      data: { status: 'approved', admin_notes: adminNotes }
    });
  };

  const handleReject = () => {
    if (!selectedSuggestion) return;
    updateMutation.mutate({
      id: selectedSuggestion.id,
      data: { status: 'rejected', admin_notes: adminNotes }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Diluluskan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      person: 'Rekod Si Mati',
      grave: 'Tanah Perkuburan',
      organisation: 'Organisasi',
      tahfiz: 'Pusat Tahfiz'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600" />
            Urus Cadangan
          </h1>
          <p className="text-gray-500">
            {suggestions.filter(s => s.status === 'pending').length} menunggu semakan
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Menunggu', value: suggestions.filter(s => s.status === 'pending').length, color: 'yellow' },
          { label: 'Diluluskan', value: suggestions.filter(s => s.status === 'approved').length, color: 'green' },
          { label: 'Ditolak', value: suggestions.filter(s => s.status === 'rejected').length, color: 'red' }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Diluluskan</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis</TableHead>
                <TableHead>Cadangan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : filteredSuggestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tiada cadangan</TableCell>
                </TableRow>
              ) : (
                filteredSuggestions.map(suggestion => (
                  <TableRow key={suggestion.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {getEntityTypeLabel(suggestion.entity_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {suggestion.suggested_changes?.substring(0, 50)}...
                    </TableCell>
                    <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                    <TableCell>
                      {new Date(suggestion.created_date).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(suggestion)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Butiran Cadangan</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Jenis Rekod</p>
                <p className="font-semibold">{getEntityTypeLabel(selectedSuggestion.entity_type)}</p>
              </div>
              {selectedSuggestion.entity_id && (
                <div>
                  <p className="text-sm text-gray-500">ID Rekod</p>
                  <p className="font-mono text-sm">{selectedSuggestion.entity_id}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Cadangan Perubahan</p>
                <div className="p-3 bg-gray-50 rounded-lg mt-1">
                  <p className="whitespace-pre-wrap">{selectedSuggestion.suggested_changes}</p>
                </div>
              </div>
              {selectedSuggestion.reason && (
                <div>
                  <p className="text-sm text-gray-500">Sebab / Justifikasi</p>
                  <p>{selectedSuggestion.reason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status Semasa</p>
                {getStatusBadge(selectedSuggestion.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Catatan Admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambah catatan..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Tutup
            </Button>
            {selectedSuggestion?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Luluskan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}