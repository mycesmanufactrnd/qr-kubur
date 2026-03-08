import { useMemo } from 'react';
import moment from 'moment';
import { FileText, Hash, Clock3 } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';
import { trpc } from '@/utils/trpc';
import { translate } from '@/utils/translations';

const ENTITY_NAME_MAP = {
  donation: 'Donation',
  tahlilrequest: 'Tahlil Request',
  quotation: 'Quotation',
};

const formatEntityName = (name) => {
  if (!name) return '-';
  const normalized = name.toLowerCase().trim();
  return ENTITY_NAME_MAP[normalized] || name;
};

const formatRelativeTime = (createdat) => {
  if (!createdat) return '-';
  const parsed = moment(createdat);
  return parsed.isValid() ? parsed.fromNow() : '-';
};

export default function UserTransactionRecords() {
  const googleUser = useMemo(() => {
    try {
      const storedUser = sessionStorage.getItem('googleAuth');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, []);

  const email = googleUser?.email || '';

  const {
    data: records = [],
    isLoading,
    error,
  } = trpc.google.getTransactionRecords.useQuery(
    { email },
    { enabled: !!email }
  );

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate('Transaction Record')} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate('Account')}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-slate-800 truncate">{googleUser?.name || '-'}</p>
            <p className="text-xs text-slate-400 truncate">{email || translate('Google account not found')}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate('Transaction Record')}
            </p>
          </div>

          {isLoading && (
            <div className="px-4 py-6 text-sm text-slate-500">{translate('Loading')}...</div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-6 text-sm text-red-500">
              {translate('Failed to load transaction records')}
            </div>
          )}

          {!isLoading && !error && !email && (
            <div className="px-4 py-6 text-sm text-slate-500">
              {translate('Please sign in with Google to view your transaction records')}
            </div>
          )}

          {!isLoading && !error && !!email && records.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500">
              {translate('No transaction record found')}
            </div>
          )}

          {!isLoading && !error && records.length > 0 && (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div key={record.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <p className="text-sm font-semibold truncate">{record.referenceno || '-'}</p>
                    </div>

                    <p className="text-xs text-slate-500 truncate">{formatEntityName(record.entityname)}</p>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock3 className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-xs">{formatRelativeTime(record.createdat)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
