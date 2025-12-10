import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function LoadingUser() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="p-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </CardContent>
    </Card>
  );
}