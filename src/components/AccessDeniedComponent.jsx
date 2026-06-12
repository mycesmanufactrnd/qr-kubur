// @ts-nocheck
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { translate } from '@/utils/translations';
import { useIsNarrow } from '@/hooks/useIsNarrow';

export default function AccessDeniedComponent({ isPage }) {
  const isNarrow = useIsNarrow(640);

  const content = (
    <>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <ShieldAlert className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5">
        {translate('Access Denied')}
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500">
        {translate('No Permission')}
      </p>
    </>
  );

  if (isNarrow) {
    return (
      <div className={`flex flex-col items-center justify-center text-center px-8 ${isPage ? 'fixed inset-0' : 'py-20'}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={isPage ? 'fixed inset-0 flex items-center justify-center' : 'py-10'}>
      <Card className="w-full max-w-sm mx-auto border border-slate-100 dark:border-slate-700 shadow-sm dark:bg-slate-800">
        <CardContent className="p-10 text-center">
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
