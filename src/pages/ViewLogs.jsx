import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LoadingUser from '../components/LoadingUser';

export default function ViewLogs() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = localStorage.getItem('appUserAuth');
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        } else {
          const userData = await base44.auth.me();
          setCurrentUser(userData);
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => base44.entities.LogActivity.list('-created_date', 50)
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (isLoading) {
    return <div className="p-6">Loading logs...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      
      <Accordion type="single" collapsible className="space-y-2">
        {logs.map((log, index) => (
          <AccordionItem key={log.id} value={`log-${index}`} className="border-0">
            <Card>
              <CardHeader className="p-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <CardTitle className="text-lg">{log.summary}</CardTitle>
                      <p className="text-sm text-gray-500 font-normal">
                        {log.function_name} - {log.user_email} - {new Date(log.created_date).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={log.success ? 'default' : 'destructive'}>
                      {log.level}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="pt-0">
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}