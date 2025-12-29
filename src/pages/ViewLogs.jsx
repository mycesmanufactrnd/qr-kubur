import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Filter, Calendar, User, FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';
import Pagination from '../components/Pagination';

export default function ViewLogs() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        setUser(JSON.parse(appUserAuth));
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => base44.entities.LogActivity.list('-created_date', 500),
    enabled: !!user && isSuperAdmin
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!user || !isSuperAdmin) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Hanya superadmin boleh melihat log aktiviti.</p>
        </CardContent>
      </Card>
    );
  }

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const activityMatch = filterActivity === 'all' || log.activity_type === filterActivity;
    return levelMatch && activityMatch;
  });

  const getLevelBadge = (level) => {
    const colors = {
      info: 'bg-blue-100 text-blue-700',
      warn: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      debug: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={colors[level] || colors.info}>{level}</Badge>;
  };

  const activityTypes = [...new Set(logs.map(l => l.activity_type))];

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Super Admin', page: 'SuperadminDashboard' },
        { label: 'Log Aktiviti', page: 'ViewLogs' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Log Aktiviti
          </h1>
          <p className="text-gray-500">{filteredLogs.length} rekod log</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Level</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterActivity} onValueChange={setFilterActivity}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Aktiviti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aktiviti</SelectItem>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Masa</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Aktiviti</TableHead>
                <TableHead>Fungsi</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Ringkasan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">Tiada log</TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.created_date).toLocaleString('ms-MY')}
                    </TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell className="font-medium">{log.activity_type}</TableCell>
                    <TableCell className="text-sm text-gray-600">{log.function_name}</TableCell>
                    <TableCell className="text-sm">{log.user_email || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{log.summary}</TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge className="bg-green-100 text-green-700">Berjaya</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">Gagal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredLogs.length > 0 && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredLogs.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}