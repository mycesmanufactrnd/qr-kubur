// @ts-nocheck
import { useEffect, useState } from "react";
import {
  Heart,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  X,
} from "lucide-react";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { translate } from "@/utils/translations";
import { resolveFileUrl } from "@/utils";
import { formatRM } from "@/utils/helpers";
import { useGetDonationPaginated, useUpdateDonation } from "@/hooks/useDonationMutations";
import { useGetOnlineTransaction } from "@/hooks/usePaymentDistributionMutation";
import { VerificationStatus } from "@/utils/enums";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";

function StatusBadge({ status }) {
  switch (status) {
    case VerificationStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          {translate("Pending")}
        </Badge>
      );
    case VerificationStatus.VERIFIED:
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          {translate("Verified")}
        </Badge>
      );
    case VerificationStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          {translate("Rejected")}
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

function TransactionStatusBadge({ status }) {
  const map = {
    Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Held: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Transfer Pending": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Transferred: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Refunded: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };
  return (
    <Badge className={`${map[status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"} border-0 text-xs`}>
      {translate(status || "-")}
    </Badge>
  );
}

function DonationCard({ donation, onClick }) {
  return (
    <button
      onClick={() => onClick(donation)}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-2 active:opacity-70 transition-opacity"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
            {donation.donorname || translate("No Name")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
            {donation.referenceno || "-"}
          </p>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate max-w-[55%]">
          {donation.organisation?.name ?? donation.tahfizcenter?.name ?? "-"}
        </span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
          {formatRM(Number(donation.amount) || 0)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{new Date(donation.createdat).toLocaleDateString("ms-MY")}</span>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>
    </button>
  );
}

function DetailSheet({ donation, onClose, canVerify, canReject }) {
  const updateMutation = useUpdateDonation();
  const [transactionAccount, setTransactionAccount] = useState(null);

  const {
    onlineTransaction,
    isLoading: onlineTransactionLoading,
    refetch: refetchOnlineTransaction,
  } = useGetOnlineTransaction({
    referenceno: donation?.referenceno,
    enabled: false,
  });

  useEffect(() => {
    let isActive = true;
    if (!donation?.referenceno) {
      setTransactionAccount(null);
      return () => { isActive = false; };
    }
    refetchOnlineTransaction().then((res) => {
      if (!isActive) return;
      const transaction = res?.data ?? onlineTransaction;
      const accounts = Array.isArray(transaction?.accounts)
        ? [...transaction.accounts]
        : [];
      accounts.sort((a, b) => {
        const dateA = a?.createdat ? new Date(a.createdat).getTime() : 0;
        const dateB = b?.createdat ? new Date(b.createdat).getTime() : 0;
        return dateB - dateA;
      });
      setTransactionAccount(accounts[0] ?? null);
    });
    return () => { isActive = false; };
  }, [donation, refetchOnlineTransaction, onlineTransaction]);

  if (!donation) return null;

  const handleVerify = async () => {
    await updateMutation.mutateAsync({
      id: donation.id,
      data: { status: VerificationStatus.VERIFIED },
    });
    onClose();
  };

  const handleReject = async () => {
    await updateMutation.mutateAsync({
      id: donation.id,
      data: { status: VerificationStatus.REJECTED },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
            {donation.donorname || translate("No Name")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
            {donation.referenceno || "-"}
          </p>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-32">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2 items-center">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">{translate("Amount")}</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">
              {formatRM(Number(donation.amount) || 0)}
            </span>
          </div>
          <Row label={translate("Recipient")} value={donation.organisation?.name ?? donation.tahfizcenter?.name ?? "-"} />
          {donation.donoremail && (
            <Row label={translate("Email")} value={donation.donoremail} />
          )}
          {donation.paymentplatform?.name && (
            <Row
              label={translate("Payment Method")}
              value={donation.paymentplatform.name.replace("_", " ")}
            />
          )}
          {donation.notes && (
            <Row label={translate("Notes")} value={donation.notes} />
          )}
          {donation.referenceno && (
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{translate("Reference No.")}</span>
              <span className="text-slate-800 dark:text-slate-200 text-right break-all font-mono text-xs">{donation.referenceno}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {translate("Platform Transfer Status")}
          </p>
          {onlineTransactionLoading ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">{translate("Loading...")}</p>
          ) : !transactionAccount ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">{translate("No online transaction account found")}</p>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-2 items-center">
                <span className="text-slate-500 dark:text-slate-400">{translate("Status")}</span>
                <TransactionStatusBadge status={transactionAccount.status} />
              </div>
              <Row label={translate("Bank Name")} value={transactionAccount.bankname || "-"} />
              <Row label={translate("Account No")} value={transactionAccount.accountno || "-"} />
              {transactionAccount.referencetransferno && (
                <Row label={translate("Reference Transfer No")} value={transactionAccount.referencetransferno} />
              )}
              {transactionAccount.photourl && resolveFileUrl(transactionAccount.photourl, "online-transaction") && (
                <div className="pt-1">
                  <p className="text-slate-500 dark:text-slate-400 mb-1.5 text-xs">{translate("Photo")}</p>
                  <img
                    src={resolveFileUrl(transactionAccount.photourl, "online-transaction")}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    alt={translate("Transaction proof")}
                    className="w-full h-40 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed action bar */}
      {donation.status === VerificationStatus.PENDING && (
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-2 safe-area-bottom">
          {canVerify && (
            <button
              onClick={handleVerify}
              disabled={updateMutation.isPending}
              className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              <CheckCircle className="w-5 h-5" />
              {translate("Verify")}
            </button>
          )}
          {canReject && (
            <button
              onClick={handleReject}
              disabled={updateMutation.isPending}
              className="w-full h-11 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              <XCircle className="w-4 h-4" />
              {translate("Reject")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 text-right break-all">{value}</span>
    </div>
  );
}

export default function MobileManageDonations() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const { loading: permissionsLoading, canView, canVerify, canReject } = useCrudPermissions("donations");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);

  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const { donationList, totalPages, isLoading } = useGetDonationPaginated({
    page,
    pageSize: itemsPerPage,
    filterStatus: appliedStatus || null,
    filterDateFrom: appliedDateFrom || null,
    filterDateTo: appliedDateTo || null,
  });

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [selected]);

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6">
        <BackNavigation title={translate("Manage Donations")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          <div className="flex items-center">
            <AdvancedFilters
              parameter={[
                { label: translate("Status"), type: "select", searchColumn: "status", options: [
                  { id: "pending", name: translate("Pending") },
                  { id: "verified", name: translate("Verified") },
                  { id: "rejected", name: translate("Rejected") },
                ]},
                { label: translate("Date From"), type: "date", searchColumn: "dateFrom" },
                { label: translate("Date To"), type: "date", searchColumn: "dateTo" },
              ]}
              onApplyFilter={(f) => {
                setAppliedStatus(f.status || "");
                setAppliedDateFrom(f.dateFrom || "");
                setAppliedDateTo(f.dateTo || "");
                setPage(1);
              }}
            />
          </div>

          {isLoading ? (
            <InlineLoadingComponent />
          ) : donationList.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
              <Heart className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {donationList.items.map((d) => (
                <DonationCard key={d.id} donation={d} onClick={setSelected} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={() => {}}
                totalItems={donationList.total}
              />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <DetailSheet
          donation={selected}
          onClose={() => setSelected(null)}
          canVerify={canVerify}
          canReject={canReject}
        />
      )}
    </>
  );
}
