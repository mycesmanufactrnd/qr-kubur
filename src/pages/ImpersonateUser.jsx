import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from "@/components/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserX, UserSearch, X } from "lucide-react";
import { impersonateUser } from "@/utils/auth";
import { useGetUserPaginated } from "@/hooks/useUserMutations";
import Pagination from "@/components/Pagination";
import { translate } from "@/utils/translations";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import InlineLoadingComponent from '@/components/InlineLoadingComponent';

export default function ImpersonateUser() {
  // 🔹 1. URL Source of Truth (Supervisor Rule)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  // 🔹 2. Temporary Input States (Doesn't trigger filter until Search is clicked)
  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔹 3. Sync UI with URL (Ensures Reset button and Back button work)
  useEffect(() => {
    setTempSearch(urlSearch);
  }, [urlSearch]);

  // 🔹 4. Backend Query (Only listens to URL parameters)
  const { userList: users, totalPages, isLoading: loadingUsers } = useGetUserPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
  });

  // 🔹 5. Search Handlers
  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({}); // Clears URL, useEffect handles UI clearing
  };

  if (loadingUsers) return <PageLoadingComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' },
        { label: translate('Impersonate User'), page: 'ImpersonateUser' }
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{translate('Impersonate User')}</h1>
        </div>
      </div>

      {/* 🔹 Unified Filter Card (Supervisor Style) */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Enter user\'s name or email...')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700 px-6 text-white">
              {translate('Search')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <X className="w-4 h-4 mr-2" />
              {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md overflow-hidden dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900">
              <TableRow>
                <TableHead className="w-[300px]">{translate('Username')}</TableHead>
                <TableHead>{translate('Email')}</TableHead>
                <TableHead className="text-center">{translate('Role')}</TableHead>
                <TableHead className="text-center">{translate('Phone No.')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <InlineLoadingComponent isTable={true} colSpan={5} />
              ) : users.items.length === 0 ? (
                <NoDataTableComponent colSpan={5} message={translate("noUserFound")} />
              ) : (
                users.items.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                          {user.fullname?.[0] || 'X'}
                        </div>
                        <span className="dark:text-white">{user.fullname || 'Tiada Nama'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{user.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center dark:text-gray-300">
                      {user.phoneno || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={() => impersonateUser(user)}
                      >
                        <UserSearch className="w-4 h-4 mr-2" />
                        {translate('Login As')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {users.total > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
            }}
            totalItems={users.total}
          />
        )}
      </Card>
    </div>
  );
}