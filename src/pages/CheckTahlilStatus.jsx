import { useEffect, useState } from 'react';
import { Search, BookOpen, Clock, CheckCircle, XCircle, MapPin, User, Calendar } from 'lucide-react';
import { formatRM } from '@/utils/helpers';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { showError } from '@/components/ToastrNotification';
import { TahlilStatus } from '@/utils/enums';
import BackNavigation from '@/components/BackNavigation';
import JoinLiveButton from '@/components/jitsi/JoinLiveButton';
import { trpc } from '@/utils/trpc';
import { translate } from '@/utils/translations';
import { defaultTahlilStatus } from '@/utils/defaultformfields';
import { skipToken } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolveFileUrl } from '@/utils';

const STATUS_CONFIG = {
  [TahlilStatus.PENDING]: {
    label: translate('Pending'),
    icon: Clock,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconColor: 'text-amber-500',
    dot: 'bg-amber-400',
  },
  [TahlilStatus.ACCEPTED]: {
    label: translate('Accepted'),
    icon: CheckCircle,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconColor: 'text-blue-500',
    dot: 'bg-blue-400',
  },
  [TahlilStatus.COMPLETED]: {
    label: translate('Completed'),
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-400',
  },
  [TahlilStatus.REJECTED]: {
    label: translate('Rejected'),
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-500',
    dot: 'bg-red-400',
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-500">{status}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
      {cfg.label}
    </span>
  );
}

export default function CheckTahlilStatus() {
  const [referenceId, setReferenceId] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [searching, setSearching] = useState(false);
  const [request, setRequest] = useState(defaultTahlilStatus);
  const [tahfizCenter, setTahfizCenter] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tahlilRequest, isLoading } = trpc.tahlilRequest.getByReferenceNo.useQuery(
    searchKey ? { referenceno: searchKey } : skipToken,
    { enabled: !!searchKey }
  );

  useEffect(() => {
    if (!searchKey) return;
    if (!isLoading) {
      setSearching(false);
      if (!tahlilRequest) {
        showError(translate('Request not found'));
        return;
      }
      setRequest({
        referenceno: tahlilRequest.referenceno ?? '',
        status: String(tahlilRequest.status ?? ''),
        liveurl: tahlilRequest.liveurl ?? '',
        requestorname: tahlilRequest.requestorname ?? '',
        createdat: tahlilRequest.createdat ?? '',
        deceasednames: tahlilRequest.deceasednames ?? [],
        selectedservices: tahlilRequest.selectedservices ?? [],
        photourls: tahlilRequest.photourls ?? [],
        serviceamount: tahlilRequest.serviceamount ?? null,
        platformfeeamount: tahlilRequest.platformfeeamount ?? null,
      });
      if (tahlilRequest.tahfizcenter) setTahfizCenter(tahlilRequest.tahfizcenter);
      setIsDialogOpen(true);
    }
  }, [tahlilRequest, isLoading, searchKey]);

  const handleSearch = () => {
    if (!referenceId.trim()) { showError(translate('Please enter Reference ID')); return; }
    setSearching(true);
    setSearchKey(referenceId.trim());
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSearchKey("");
    setRequest(defaultTahlilStatus);
    setTahfizCenter(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <BackNavigation title={translate('Tahlil Status')} />

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">

        <div className="flex flex-col items-center text-center gap-2 pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-1">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            {translate('Check Tahlil Application Status')}
          </h2>
          <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
            {translate('Enter reference number to check your application status.')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
          <div className="px-4 py-3 -mx-4 -mt-4 mb-0 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate('Application Search')}</p>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {translate('Transaction Reference No.')}
            </label>
            <Input
              placeholder={`${translate('Example')}: THL-2024-0001`}
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:opacity-80 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {searching ? translate('Searching...') : translate('Search Status')}
          </Button>
        </div>

        <div className="flex gap-2.5 items-start px-4 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-xs text-blue-600 leading-relaxed">
            <span className="font-bold">{translate('Tip')}:</span> {translate('Your reference number can be found in the payment receipt sent to your email.')}
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white">

          <div className="px-5 pt-5 pb-4 border-b border-slate-100 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
              {translate('Application Status')}
            </DialogTitle>
            {request && (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-lg font-bold tracking-widest font-mono text-slate-800">
                  {request.referenceno}
                </span>
                <StatusBadge status={request.status} />
              </div>
            )}
          </div>

          {request && (
            <div className="px-5 py-4 space-y-5">

              {request.liveurl && (
                <div className="flex justify-center">
                  <JoinLiveButton room={request.liveurl} />
                </div>
              )}

              <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                {request.requestorname && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{translate('Requester')}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{request.requestorname}</span>
                  </div>
                )}
                {tahfizCenter && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{translate('Tahfiz Center')}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 text-right max-w-[55%]">{tahfizCenter.name}</span>
                  </div>
                )}
                {request.createdat && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{translate('Date')}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(request.createdat).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {request.deceasednames?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">{translate('Deceased Name')}</p>
                  <div className="space-y-1.5">
                    {request.deceasednames.map((name, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-emerald-600">{i + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.selectedservices?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">{translate('Services')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.selectedservices.map((type, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {request.serviceamount != null && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">{translate('Amount')}</p>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-sm text-slate-500">{translate('Service Amount')}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatRM(request.serviceamount)}</span>
                  </div>
                  {request.platformfeeamount != null && (
                    <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="text-sm font-semibold text-emerald-700">{translate('Total Paid')}</span>
                      <span className="text-sm font-bold text-emerald-700">{formatRM(Number(request.serviceamount) + Number(request.platformfeeamount))}</span>
                    </div>
                  )}
                </div>
              )}

              {request.photourls?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                    {translate('Tahlil Photos')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {request.photourls.map((url, idx) => (
                      <img
                        key={`${url}-${idx}`}
                        src={resolveFileUrl(url, 'bucket-tahfiz-tahlil')}
                        alt={`Tahlil ${idx + 1}`}
                        className="h-24 w-full rounded-lg object-cover border border-slate-100"
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold active:opacity-70 transition-opacity"
              >
                {translate('Close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
