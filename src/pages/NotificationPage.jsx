import { useState } from 'react';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { translate } from '@/utils/translations';
import { useGetNotificationPaginated, useUpdateNotification } from '@/hooks/useNotificationMutations';
import Pagination from '@/components/Pagination';
import Breadcrumb from '@/components/Breadcrumb';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useAdminAccess } from '@/utils/auth';
import PageLoadingComponent from '@/components/PageLoadingComponent';

export default function NotificationPage() {
  const { 
    isSuperAdmin, 
    userEmail
  } = useAdminAccess();
  const [unreadPage, setUnreadPage] = useState(1);
  const [readPage, setReadPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("unread");

  const {
    notificationList: unreadNotifications,
    totalPages: unreadTotalPages,
    isLoading: unreadLoading,
  } = useGetNotificationPaginated({
    page: unreadPage,
    pageSize: itemsPerPage,
    receiveremail: userEmail,
    isread: false,
  });

  const {
    notificationList: readNotifications,
    totalPages: readTotalPages,
    isLoading: readLoading,
  } = useGetNotificationPaginated({
    page: readPage,
    pageSize: itemsPerPage,
    receiveremail: userEmail,
    isread: true,
  });

  const updateMutation = useUpdateNotification();

  const handleNotificationClick = (notification) => {
    if (!notification.isread) {
      updateMutation.mutateAsync({
        id: notification.id,
        data: { isread: true },
      })
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };
  
  if (unreadLoading || readLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  const NotificationTable = ({ items }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100 dark:bg-gray-800">
            <th className="p-3 text-left text-sm font-semibold">Status</th>
            <th className="p-3 text-left text-sm font-semibold">Title</th>
            <th className="p-3 text-left text-sm font-semibold">Message</th>
            <th className="p-3 text-left text-sm font-semibold">Date</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <NoDataTableComponent colSpan={4}/>
          ) : (
            items.map((notification) => (
              <tr
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !notification.isread
                    ? "bg-blue-50 dark:bg-blue-900/30 font-semibold"
                    : ""
                }`}
              >
                <td className="p-3">{getStatusIcon(notification.status)}</td>
                <td className="p-3">{notification.title}</td>
                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                  {notification.message}
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {format(new Date(notification.createdat), "dd MMM yyyy, HH:mm")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {activeTab === "unread" && unreadTotalPages > 0 && (
        <Pagination
          currentPage={unreadPage}
          totalPages={unreadTotalPages}
          onPageChange={setUnreadPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setUnreadPage(1);
            setReadPage(1);
          }}
          totalItems={unreadNotifications.total}
        />
      )}

      {activeTab === "read" && readTotalPages > 0 && (
        <Pagination
          currentPage={readPage}
          totalPages={readTotalPages}
          onPageChange={setReadPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setUnreadPage(1);
            setReadPage(1);
          }}
          totalItems={readNotifications.total}
        />
        )}
    </div>
  );

  return (
  <div className="space-y-6">
    <Breadcrumb items={[
      { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
      { label: translate('Notification'), page: 'NotificationPage' }
    ]} />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
          <TabsTrigger value="unread" className="relative dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
            {translate('unread')}
            {unreadNotifications.items.length > 0 && (
              <Badge className="ml-2 bg-red-500">{unreadNotifications.items.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
            {translate('read')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          <NotificationTable items={unreadNotifications.items} />
        </TabsContent>

        <TabsContent value="read" className="mt-4">
          <NotificationTable items={readNotifications.items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}