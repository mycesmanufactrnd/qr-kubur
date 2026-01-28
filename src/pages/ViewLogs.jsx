import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '../components/Breadcrumb';
import Pagination from '../components/Pagination';
import { useAdminAccess } from '@/utils/auth';
import { useGetActivityLogPaginated } from '@/hooks/useActivityLogMutations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '../components/PageLoadingComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';

export default function ViewLogs() {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { 
    loadingUser, 
    isSuperAdmin, 
  } = useAdminAccess();

  const {
    activityLogList: logs,
    totalPages,
    isLoading,
  } = useGetActivityLogPaginated({
    page,
    pageSize: itemsPerPage,
  });

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'Super Admin', page: 'SuperadminDashboard' },
          { label: 'Log Aktiviti', page: 'ViewLogs' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  const getLevelBadge = (level) => {
    const colors = {
      info: 'bg-blue-100 text-blue-700',
      warn: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      debug: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={colors[level] || colors.info}>{level}</Badge>;
  };

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
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Masa</TableHead>
                <TableHead className="text-center">Level</TableHead>
                <TableHead className="text-center">Aktiviti</TableHead>
                <TableHead className="text-center">Fungsi</TableHead>
                <TableHead className="text-center">Pengguna</TableHead>
                <TableHead className="text-center">Ringkasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={6}/>
              ) : logs.items.length === 0 ? (
                <NoDataTableComponent colSpan={6}/>
              ) : (
                logs.items.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-center">
                      {new Date(log.createdat).toLocaleString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-center">{getLevelBadge(log.level)}</TableCell>
                    <TableCell className="text-center font-medium">{log.activitytype}</TableCell>
                    <TableCell className="text-center text-sm text-gray-600">{log.functionname}</TableCell>
                    <TableCell className="text-center text-sm">{log.useremail || '-'}</TableCell>
                    <TableCell className="text-center max-w-xs truncate text-sm">{log.summary}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setPage(1);
              }}
              totalItems={logs.total}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}