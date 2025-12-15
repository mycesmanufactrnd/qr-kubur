import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function NotificationPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const appUserAuth = localStorage.getItem('appUserAuth');
    if (appUserAuth) {
      const appUser = JSON.parse(appUserAuth);
      setUserEmail(appUser.email);
    }
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const NotificationList = ({ items }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-500">
            Tiada notifikasi
          </CardContent>
        </Card>
      ) : (
        items.map(notification => (
          <Card 
            key={notification.id} 
            className={`border cursor-pointer hover:shadow-md transition-all ${
              !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  {getStatusIcon(notification.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.is_read && (
                      <Badge className="bg-blue-500">Baru</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(notification.status)}>
                      {notification.status === 'approved' && 'Diluluskan'}
                      {notification.status === 'verified' && 'Disahkan'}
                      {notification.status === 'rejected' && 'Ditolak'}
                      {notification.status === 'pending' && 'Menunggu'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(new Date(notification.created_date), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-2">
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
        {unreadNotifications.length > 0 && (
          <Badge className="bg-red-500">{unreadNotifications.length}</Badge>
        )}
      </div>

      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unread" className="relative">
            Belum Dibaca
            {unreadNotifications.length > 0 && (
              <Badge className="ml-2 bg-red-500">{unreadNotifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">
            Sudah Dibaca
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          <NotificationList items={unreadNotifications} />
        </TabsContent>

        <TabsContent value="read" className="mt-4">
          <NotificationList items={readNotifications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}