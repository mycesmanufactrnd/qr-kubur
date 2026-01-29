import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { translate } from '@/utils/translations';

export default function AccessDeniedComponent() {
  return (
    <Card className="max-w-lg mx-auto mt-16 border-0 shadow-lg">
      <CardContent className="p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-7 w-7 text-red-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {translate('Access Denied')}
        </h2>

        <p className="text-sm text-gray-600">
          {translate('No Permission')}
        </p>
      </CardContent>
    </Card>
  );
}
