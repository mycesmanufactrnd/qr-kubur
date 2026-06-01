// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { BookOpen, Plus, X, User, SlidersHorizontal } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import PaymentForm from "@/components/deathcharity/PaymentForm";
import { translate } from "@/utils/translations";
import { formatRM } from "@/utils/helpers";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { useGetMemberByDeathCharity } from "@/hooks/useDeathCharityMemberMutations";
import {
  useDeathCharityPaymentMutations,
  useGetPaymentByMemberId,
} from "@/hooks/useDeathCharityPaymentMutations";
import { useSearchParams } from "react-router-dom";
import { useGetDeathCharityByOrganisation } from "@/hooks/useDeathCharityMutations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PaymentSheet({ memberId, payments, onSubmit, onClose, selectedYear }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {translate("Add Payment")}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <PaymentForm
          memberId={memberId}
          payments={payments}
          onSubmit={onSubmit}
          onCancel={onClose}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
}

function YearRow({ year, periodPayments, onAdd }) {
  const totalAmount = periodPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const hasPaid = periodPayments.length > 0;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden ${
        hasPaid
          ? "border border-emerald-100 dark:border-emerald-800/50"
          : "border border-slate-100 dark:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Year badge */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
            hasPaid
              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
              : "bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
          }`}
        >
          {year}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {hasPaid ? (
            <>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">
                {formatRM(totalAmount)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {periodPayments.length} {translate("payment")}
                {periodPayments.length > 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-300 dark:text-slate-600">
              {translate("No payment")}
            </p>
          )}
        </div>

        {/* Right: method pills + add button */}
        <div className="flex items-center gap-2">
          {hasPaid && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[110px]">
              {periodPayments.slice(0, 2).map((p, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                >
                  {p.paymentmethod}
                </span>
              ))}
              {periodPayments.length > 2 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                  +{periodPayments.length - 2}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => onAdd(year)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 shrink-0 ${
              hasPaid
                ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileManageDeathCharityLedger() {
  const [searchParams] = useSearchParams();
  const urlMemberId = searchParams.get("member")
    ? Number(searchParams.get("member"))
    : null;
  const urlDeathCharityId = searchParams.get("deathcharity")
    ? Number(searchParams.get("deathcharity"))
    : null;

  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
  } = useCrudPermissions("death_charity");

  const currentYear = new Date().getFullYear();
  const [selectedDeathCharity, setSelectedDeathCharity] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear + 4);

  const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();
  const { data: deathCharityMemberList = [], isLoading: loadingMembers } =
    useGetMemberByDeathCharity(selectedDeathCharity?.id);
  const { data: payments = [] } = useGetPaymentByMemberId(selectedMember?.id);
  const { createDeathCharityPayment } = useDeathCharityPaymentMutations();

  useEffect(() => {
    if (urlDeathCharityId && deathCharityList.length > 0) {
      const found = deathCharityList.find(
        (d) => Number(d.id) === Number(urlDeathCharityId),
      );
      if (found) setSelectedDeathCharity(found);
    }
  }, [urlDeathCharityId, deathCharityList]);

  useEffect(() => {
    if (urlMemberId && deathCharityMemberList.length > 0) {
      const found = deathCharityMemberList.find(
        (m) => Number(m.id) === Number(urlMemberId),
      );
      if (found) setSelectedMember(found);
    }
  }, [urlMemberId, deathCharityMemberList]);

  useEffect(() => {
    if (startYear > endYear) setEndYear(startYear);
  }, [startYear, endYear]);

  const columns = useMemo(() => {
    const years = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);
    return years;
  }, [startYear, endYear]);

  const paymentsByPeriod = useMemo(() => {
    const grouped = {};
    payments.forEach((payment) => {
      if (!payment.coversfromyear) return;
      const fromYear = payment.coversfromyear;
      const toYear = payment.coverstoyear || fromYear;
      for (let year = fromYear; year <= toYear; year++) {
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(payment);
      }
    });
    return grouped;
  }, [payments]);

  const stats = useMemo(() => {
    const totalPaid = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const registrationPayments = payments.filter(
      (p) => p.paymenttype === "registration",
    ).length;
    return { totalPaid, registrationPayments, totalPayments: payments.length };
  }, [payments]);

  const handleCreatePayment = async (data) => {
    try {
      const res = await createDeathCharityPayment.mutateAsync(data);
      if (res) {
        setShowPaymentSheet(false);
        setSelectedCell(null);
      }
    } catch (error) {
      console.error("Failed to create payment:", error);
    }
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-8">
        <BackNavigation title={translate("Death Charity Ledger")} />

        <div className="max-w-2xl mx-auto px-3 space-y-2.5 pt-1">
          <div className="space-y-2">
            <Select
              value={selectedDeathCharity?.id?.toString() || ""}
              onValueChange={(value) => {
                const found = deathCharityList.find(
                  (d) => Number(d.id) === Number(value),
                );
                setSelectedDeathCharity(found || null);
                setSelectedMember(null);
              }}
            >
              <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={translate("Select Death Charity")} />
              </SelectTrigger>
              <SelectContent>
                {deathCharityList.map((dc) => (
                  <SelectItem key={dc.id} value={dc.id.toString()}>
                    {dc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedMember?.id?.toString() || ""}
              onValueChange={(value) => {
                const found = deathCharityMemberList.find(
                  (m) => Number(m.id) === Number(value),
                );
                setSelectedMember(found || null);
              }}
              disabled={!selectedDeathCharity}
            >
              <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 shadow-sm disabled:opacity-50">
                <SelectValue placeholder={translate("Select Member")} />
              </SelectTrigger>
              <SelectContent>
                {deathCharityMemberList.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.fullname} ({m.icnumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember ? (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                    {selectedMember.fullname}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedMember.icnumber}
                    {selectedMember.phone ? ` · ${selectedMember.phone}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selectedMember.isactive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {selectedMember.isactive
                    ? translate("Active")
                    : translate("Inactive")}
                </span>
              </div>

              {/* ── Stats ── */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
                    {translate("Total Paid")}
                  </p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {formatRM(stats.totalPaid)}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">
                    {translate("Payments")}
                  </p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {stats.totalPayments}
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-pink-500 dark:text-pink-400 font-semibold uppercase tracking-wide mb-1">
                    {translate("Reg.")}
                  </p>
                  <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
                    {stats.registrationPayments}
                  </p>
                </div>
              </div>

              {canCreate && (
                <button
                  onClick={() => {
                    setSelectedCell(null);
                    setShowPaymentSheet(true);
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {translate("Add Payment")}
                </button>
              )}

              {/* ── Year filter ── */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {translate("Filter by Year")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={startYear.toString()}
                    onValueChange={(value) => setStartYear(Number(value))}
                  >
                    <SelectTrigger className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 20 },
                        (_, i) => currentYear - 10 + i,
                      ).map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-slate-300 dark:text-slate-600 shrink-0">
                    —
                  </span>

                  <Select
                    value={endYear.toString()}
                    onValueChange={(value) => setEndYear(Number(value))}
                  >
                    <SelectTrigger className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 20 },
                        (_, i) => currentYear + i,
                      ).map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                {columns.map((year) => (
                  <YearRow
                    key={year}
                    year={year}
                    periodPayments={paymentsByPeriod[year] || []}
                    onAdd={(y) => {
                      setSelectedCell(y);
                      setShowPaymentSheet(true);
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {loadingMembers
                  ? translate("Loading...")
                  : translate("Select a member to view the ledger")}
              </p>
            </div>
          )}
        </div>
      </div>

      {showPaymentSheet && (
        <PaymentSheet
          memberId={selectedMember?.id}
          payments={payments}
          onSubmit={handleCreatePayment}
          onClose={() => {
            setShowPaymentSheet(false);
            setSelectedCell(null);
          }}
          selectedYear={selectedCell}
        />
      )}
    </>
  );
}
