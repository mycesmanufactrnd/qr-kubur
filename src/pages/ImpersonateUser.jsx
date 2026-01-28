import Breadcrumb from "@/components/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, UserX, UserSearch } from "lucide-react";
import { useState } from "react";
import { impersonateUser } from "@/utils/auth";
import { useGetUserPaginated } from "@/hooks/useUserMutations";
import Pagination from "@/components/Pagination";
import { translate } from "@/utils/translations";

export default function ImpersonateUser() {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const { userList: users, totalPages, isLoading: loadingUsers } = useGetUserPaginated({
    page,
    pageSize: itemsPerPage,
    search: searchQuery,
  });

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

      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">{translate('Search User')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Enter user\'s name or email...')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden lg:block border-0 shadow-md overflow-hidden dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900">
              <TableRow>
                <TableHead className="w-[300px]">{translate('Username')}</TableHead>
                <TableHead>{translate('Email')}</TableHead>
                <TableHead className="text-center">{translate('Role')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500"> 
                    {translate('loadingUserList...')}
                  </TableCell>
                </TableRow>
              ) : users.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500"> 
                    {translate('noUserFound')}
                  </TableCell>
                </TableRow>
              ) : (
                users.items.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                          {user.fullname?.[0] || 'U'}
                        </div>
                        {user.fullname || 'Tiada Nama'}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={user.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {user.is_active !== false ? translate('Active') : translate('Blocked')}
                      </Badge>
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
          {users.total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setPage(1);
              }}
              totalItems={users.total}
            />
          )}
        </CardContent>
      </Card>


      {/* Mobile Card View (for small screens) */}
      <div className="lg:hidden space-y-4">
        {users.items.map(user => (
           <Card key={user.id} className="border-0 shadow-sm">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{user.fullname}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => impersonateUser(user)}>
                  <UserSearch className="w-4 h-4" />
                </Button>
             </CardContent>
           </Card>
        ))}
        {users.total > 0 && (
         <Pagination
           currentPage={page}
           totalPages={totalPages}
           onPageChange={setPage}
           itemsPerPage={itemsPerPage}
           onItemsPerPageChange={(value) => {
             setItemsPerPage(value);
             setPage(1);
           }}
           totalItems={users.total}
         />
       )}
      </div>
    </div>
  );
}