import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Search, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import Pagination from '@/components/Pagination';
import { useAdminAccess } from '@/utils/auth';
import { useGetActivityLogPaginated } from '@/hooks/useActivityLogMutations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { translate } from '@/utils/translations';

export default function ViewLogs() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';
  const urlLevel = searchParams.get('level') || 'all';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempLevel, setTempLevel] = useState(urlLevel);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setTempSearch(urlSearch);
    setTempLevel(urlLevel);
  }, [urlSearch, urlLevel]);

  const {
    activityLogList: logs,
    totalPages,
    isLoading,
  } = useGetActivityLogPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    level: urlLevel === 'all' ? undefined : urlLevel,
    hasAccess: isSuperAdmin
  });

  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    if (tempLevel !== 'all') params.level = tempLevel;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  if (loadingUser) return <PageLoadingComponent/>;
  if (!isSuperAdmin) return <AccessDeniedComponent/>;

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
        { label: translate('Super Admin'), page: 'SuperadminDashboard' },
        { label: translate('Activity Logs'), page: 'ViewLogs' }
      ]} />

      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate('Activity Logs')}
        </h1>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Search by User, Activity, or Summary...')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 px-6">
              {translate('Search')}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={tempLevel} onValueChange={setTempLevel}>
              <SelectTrigger>
                <SelectValue placeholder={translate('Filter by Level')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All Levels')}</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleReset}>
              <X className="w-4 h-4 mr-2" /> {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">{translate('Time')}</TableHead>
                <TableHead className="text-center">{translate('Level')}</TableHead>
                <TableHead className="text-center">{translate('Activity')}</TableHead>
                <TableHead className="text-center">{translate('Function')}</TableHead>
                <TableHead className="text-center">{translate('User')}</TableHead>
                <TableHead className="text-center">{translate('Summary')}</TableHead>
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
        </CardContent>
        {logs.total > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }}
            totalItems={logs.total}
          />
        )}
      </Card>
    </div>
  );
}