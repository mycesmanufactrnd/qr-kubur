import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ViewLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => base44.entities.LogActivity.list('-created_date', 50)
  });

  if (isLoading) {
    return <div className="p-6">Loading logs...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      
      {logs.map(log => (
        <Card key={log.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{log.summary}</CardTitle>
              <Badge variant={log.success ? 'default' : 'destructive'}>
                {log.level}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {log.function_name} - {log.user_email} - {new Date(log.created_date).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}