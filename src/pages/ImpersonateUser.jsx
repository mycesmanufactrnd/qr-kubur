import { base44 } from "@/api/base44Client";
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
import { useAdminAccess } from "@/utils/index.jsx";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Search, UserX, UserSearch, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { translate } from "@/utils/translations";
import { impersonateUser } from "@/utils/auth.jsx";

export default function ImpersonateUser() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, isSuperAdmin } = useAdminAccess();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['app-users', isSuperAdmin],
    queryFn: () => base44.entities.AppUser.list('-created_date'),
    enabled: !!currentUser,
    // queryFn: () => isSuperAdmin ? base44.entities.AppUser.list('-created_date') : [],
    // enabled: !!currentUser && isSuperAdmin,
  });

  const filteredUsers = users.filter(u =>
    (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Superadmin Dashboard', page: 'SuperadminDashboard' },
        { label: 'Impersonate User', page: 'ImpersonateUser' }
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impersonate User</h1>
        </div>
      </div>

      {/* Search Header */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">Cari Pengguna</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Nama atau email pengguna..."
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
                <TableHead className="w-[300px]">Nama Pengguna</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Peranan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    Memuatkan senarai pengguna...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    Tiada pengguna dijumpai.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                          {user.full_name?.[0] || 'U'}
                        </div>
                        {user.full_name || 'Tiada Nama'}
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
                        {user.is_active !== false ? 'Aktif' : 'Disekat'}
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
                        Log Masuk Sebagai
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View (for small screens) */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.map(user => (
           <Card key={user.id} className="border-0 shadow-sm">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => impersonateUser(user)}>
                  <UserSearch className="w-4 h-4" />
                </Button>
             </CardContent>
           </Card>
        ))}
      </div>
    </div>
  );
}