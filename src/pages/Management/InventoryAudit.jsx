// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  ClipboardCheck,
  Plus,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  MapPin,
  CalendarClock,
  UserCircle2,
  Boxes,
  XCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Clock3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm.jsx";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { showSuccess, showApiError } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetAuditSessionsPaginated,
  useGetAuditSessionDetails,
  useInventoryAuditMutations,
  useGetAllInventoryItems,
} from "@/hooks/useInventoryMutations";
import { useForm } from "react-hook-form";
import {
  CheckDetailResult,
  CheckSessionStatus,
  CheckItemCondition,
  CheckReusableStatus,
  InventoryItemType,
} from "@/utils/enums";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sessionStatusBadge(status) {
  return status === CheckSessionStatus.COMPLETED
    ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{translate("Completed")}</span>
    : <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{translate("In Progress")}</span>;
}

function resultBadge(result) {
  if (!result) return <span className="text-xs text-gray-400">—</span>;
  const map = {
    [CheckDetailResult.MATCH]:      { label: translate("Match"),      cls: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    [CheckDetailResult.MISSING]:    { label: translate("Missing"),    cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    [CheckDetailResult.OVER_COUNT]: { label: translate("Over Count"), cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  };
  const cfg = map[result];
  if (!cfg) return <span className="text-xs text-gray-400">{result}</span>;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ms-MY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isReusableDetail(detail) {
  return detail.item?.item_type === InventoryItemType.REUSABLE;
}

function countByField(details, getValue) {
  const counts = {};
  for (const d of details) {
    const val = getValue(d);
    if (!val) continue;
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

function splitDetailsByType(details) {
  const consumable = [];
  const reusable = [];
  for (const d of details) {
    if (isReusableDetail(d)) reusable.push(d);
    else consumable.push(d);
  }
  return { consumable, reusable };
}

const conditionOptions = [
  { value: CheckItemCondition.GOOD, label: translate("Good") },
  { value: CheckItemCondition.DAMAGED, label: translate("Damaged") },
];

const reusableStatusOptions = [
  { value: CheckReusableStatus.AVAILABLE, label: translate("Available") },
  { value: CheckReusableStatus.IN_USE, label: translate("In Use") },
  { value: CheckReusableStatus.MISSING, label: translate("Missing") },
  { value: CheckReusableStatus.MAINTENANCE, label: translate("Maintenance") },
];

function conditionBadge(condition) {
  if (!condition) return <span className="text-xs text-gray-400">—</span>;
  const cls = condition === CheckItemCondition.GOOD
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  const label = condition === CheckItemCondition.GOOD ? translate("Good") : translate("Damaged");
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function reusableStatusBadge(status) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const map = {
    [CheckReusableStatus.AVAILABLE]:   { label: translate("Available"),   cls: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    [CheckReusableStatus.IN_USE]:      { label: translate("In Use"),      cls: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    [CheckReusableStatus.MISSING]:     { label: translate("Missing"),     cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    [CheckReusableStatus.MAINTENANCE]: { label: translate("Maintenance"), cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  };
  const cfg = map[status];
  if (!cfg) return <span className="text-xs text-gray-400">{status}</span>;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

const STAT_THEMES = {
  gray:   { iconWrap: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300", value: "text-gray-900 dark:text-white" },
  teal:   { iconWrap: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400", value: "text-gray-900 dark:text-white" },
  green:  { iconWrap: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400", value: "text-green-600 dark:text-green-400" },
  red:    { iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", value: "text-red-600 dark:text-red-400" },
  yellow: { iconWrap: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400", value: "text-yellow-600 dark:text-yellow-400" },
  blue:   { iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400", value: "text-blue-600 dark:text-blue-400" },
};

function StatCard({ icon: Icon, label, value, theme = "gray" }) {
  const t = STAT_THEMES[theme] ?? STAT_THEMES.gray;
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${t.iconWrap}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
          <p className={`text-lg font-bold truncate ${t.value}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, theme = "gray" }) {
  const t = STAT_THEMES[theme] ?? STAT_THEMES.gray;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-slate-700/40 px-3 py-2 flex-1 min-w-[110px]">
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${t.iconWrap}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">{label}</p>
        <p className={`text-sm font-bold leading-tight ${t.value}`}>{value}</p>
      </div>
    </div>
  );
}

function getLocationOptions(items) {
  const set = new Set();
  for (const i of items) {
    if (i.location) set.add(i.location);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function SortIcon({ field, current, order }) {
  if (current !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "ASC" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
}

// ── Physical Count Row ────────────────────────────────────────────────────────
// Each row manages its own local state and saves on blur.

function CountRow({ detail, sessionCompleted, onSaved }) {
  const neverSaved = detail.physical_count === null || detail.physical_count === undefined;
  const [localCount, setLocalCount] = useState(
    neverSaved ? String(detail.system_quantity) : String(detail.physical_count),
  );
  const [localNotes, setLocalNotes] = useState(detail.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { updateCount } = useInventoryAuditMutations();

  useEffect(() => {
    if (neverSaved && !sessionCompleted) {
      updateCount.mutateAsync({ detailId: detail.id, physical_count: detail.system_quantity })
        .then(() => onSaved?.())
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const val = parseInt(localCount, 10);
    if (isNaN(val) || val < 0) return;
    const noChange = val === detail.physical_count && localNotes === (detail.notes ?? "");
    if (noChange) return;
    setSaving(true);
    try {
      await updateCount.mutateAsync({ detailId: detail.id, physical_count: val, notes: localNotes || undefined });
      onSaved?.();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const diff = localCount !== "" && !isNaN(parseInt(localCount, 10))
    ? parseInt(localCount, 10) - detail.system_quantity
    : null;

  return (
    <TableRow>
      <TableCell className="font-medium text-sm">
        {detail.item?.item_name ?? `Item #${detail.itemId}`}
      </TableCell>
      <TableCell className="text-right font-mono">{detail.system_quantity}</TableCell>
      <TableCell className="w-28">
        {sessionCompleted ? (
          <span className="font-mono text-sm">{detail.physical_count ?? "—"}</span>
        ) : (
          <Input
            type="number"
            min={0}
            value={localCount}
            onChange={(e) => setLocalCount(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            className="h-8 text-sm text-center font-mono dark:border-slate-600 dark:bg-slate-700"
            disabled={saving}
          />
        )}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {diff !== null ? (
          <span className={diff === 0 ? "text-gray-500" : diff > 0 ? "text-yellow-600" : "text-red-600"}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
        ) : "—"}
      </TableCell>
      <TableCell className="text-center">
        {saving
          ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
          : resultBadge(detail.result)}
      </TableCell>
      <TableCell className="w-40">
        {sessionCompleted ? (
          <span className="text-sm text-gray-500">{detail.notes || "—"}</span>
        ) : (
          <Input
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            placeholder={translate("Optional")}
            className="h-8 text-sm dark:border-slate-600 dark:bg-slate-700"
            disabled={saving}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Reusable Item Row ─────────────────────────────────────────────────────────
// Checks condition + status instead of quantity.

function ReusableCountRow({ detail, sessionCompleted, onSaved }) {
  const [localCondition, setLocalCondition] = useState(detail.condition ?? detail.item?.condition ?? "");
  const [localStatus, setLocalStatus] = useState(detail.reusable_status ?? detail.item?.status ?? "");
  const [localNotes, setLocalNotes] = useState(detail.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { updateReusableCount } = useInventoryAuditMutations();

  const persist = async (overrides = {}) => {
    const condition = overrides.condition ?? localCondition;
    const reusable_status = overrides.reusable_status ?? localStatus;
    const notes = overrides.notes ?? localNotes;
    if (!condition || !reusable_status) return;
    setSaving(true);
    try {
      await updateReusableCount.mutateAsync({ detailId: detail.id, condition, reusable_status, notes: notes || undefined });
      onSaved?.();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium text-sm">
        {detail.item?.item_name ?? `Item #${detail.itemId}`}
      </TableCell>
      <TableCell className="w-40">
        {sessionCompleted ? (
          conditionBadge(detail.condition ?? detail.item?.condition)
        ) : (
          <Select
            value={localCondition}
            onValueChange={(val) => { setLocalCondition(val); persist({ condition: val }); }}
            disabled={saving}
          >
            <SelectTrigger className="h-8 text-sm dark:border-slate-600 dark:bg-slate-700">
              <SelectValue placeholder={translate("Select")} />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="w-40">
        {sessionCompleted ? (
          reusableStatusBadge(detail.reusable_status ?? detail.item?.status)
        ) : (
          <Select
            value={localStatus}
            onValueChange={(val) => { setLocalStatus(val); persist({ reusable_status: val }); }}
            disabled={saving}
          >
            <SelectTrigger className="h-8 text-sm dark:border-slate-600 dark:bg-slate-700">
              <SelectValue placeholder={translate("Select")} />
            </SelectTrigger>
            <SelectContent>
              {reusableStatusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="text-center w-10">
        {saving && <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />}
      </TableCell>
      <TableCell className="w-40">
        {sessionCompleted ? (
          <span className="text-sm text-gray-500">{detail.notes || "—"}</span>
        ) : (
          <Input
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => persist()}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            placeholder={translate("Optional")}
            className="h-8 text-sm dark:border-slate-600 dark:bg-slate-700"
            disabled={saving}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

export default function InventoryAudit() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryAudit /> : <InventoryAuditDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryAuditDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedSessionId = searchParams.get("sessionId")
    ? Number(searchParams.get("sessionId"))
    : null;

  // Sessions list state
  const urlPage      = parseInt(searchParams.get("page") || "1");
  const urlStatus    = searchParams.get("status") || "all";
  const urlLocation  = searchParams.get("location") || "all";
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { location: "", notes: "" },
  });

  const { itemsList } = useGetAllInventoryItems();
  const locationOptions = useMemo(() => getLocationOptions(itemsList), [itemsList]);

  const { sessionsList, total, totalPages, isLoading: sessionsLoading } = useGetAuditSessionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterStatus: urlStatus !== "all" ? urlStatus : undefined,
    filterLocation: urlLocation !== "all" ? urlLocation : undefined,
  });

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } =
    useGetAuditSessionDetails(selectedSessionId);

  const { createSession, completeSession, reopenSession } = useInventoryAuditMutations();

  // Sync localStatus from server whenever session data loads/changes
  useEffect(() => {
    if (detailData?.session?.status) {
      setLocalStatus(detailData.session.status);
    }
  }, [detailData?.session?.status]);

  const openSession = (id) => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("sessionId", String(id)); return n; });
  };

  const backToList = () => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("sessionId"); return n; });
  };

  const onCreateSubmit = async (data) => {
    const newSession = await createSession.mutateAsync({ location: data.location, notes: data.notes || undefined });
    reset();
    setCreateDialogOpen(false);
    if (newSession?.id) openSession(newSession.id);
  };

  const handleToggleLocalStatus = () => {
    setLocalStatus((prev) =>
      prev === CheckSessionStatus.COMPLETED
        ? CheckSessionStatus.IN_PROGRESS
        : CheckSessionStatus.COMPLETED,
    );
  };

  const handleSave = async () => {
    if (!selectedSessionId || !detailData?.session) return;
    const savedStatus = detailData.session.status;
    if (localStatus !== savedStatus) {
      if (localStatus === CheckSessionStatus.COMPLETED) {
        await completeSession.mutateAsync(selectedSessionId);
      } else {
        await reopenSession.mutateAsync(selectedSessionId);
      }
      refetchDetail();
    } else {
      showSuccess(translate("Audit Session"), "update");
    }
  };


  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  // ── Session Detail View ───────────────────────────────────────────────────

  if (selectedSessionId) {
    const session = detailData?.session;
    const details = detailData?.details ?? [];
    const { consumable: consumableDetails, reusable: reusableDetails } = splitDetailsByType(details);
    const isCompleted = localStatus === CheckSessionStatus.COMPLETED;
    const liveMatched  = details.filter((d) => d.result === CheckDetailResult.MATCH).length;
    const liveOver     = details.filter((d) => d.result === CheckDetailResult.OVER_COUNT).length;
    const conditionCounts = countByField(reusableDetails, (d) => d.condition ?? d.item?.condition);
    const statusCounts = countByField(reusableDetails, (d) => d.reusable_status ?? d.item?.status);
    const liveMissing  = details.filter((d) => d.result === CheckDetailResult.MISSING).length
      + (statusCounts[CheckReusableStatus.MISSING] ?? 0);
    const statusUnsaved = session && localStatus !== null && localStatus !== session.status;

    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
          { label: translate("Audit"), page: "InventoryAudit" },
        ]} />

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={backToList}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {translate("Back")}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-teal-600" />
            {translate("Audit Session")} #{selectedSessionId}
          </h1>
          {localStatus && sessionStatusBadge(localStatus)}
          {statusUnsaved && (
            <span className="text-xs text-amber-500 italic">{translate("Unsaved")}</span>
          )}
        </div>

        {detailLoading ? (
          <PageLoadingComponent />
        ) : !session ? (
          <p className="text-gray-400">{translate("Session not found")}</p>
        ) : (
          <>
            {/* Session summary card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={MapPin} label={translate("Location")} value={session.location} theme="teal" />
              <StatCard icon={CalendarClock} label={translate("Tarikh Masa")} value={formatDateTime(session.session_date ?? session.createdat)} theme="gray" />
              <StatCard icon={UserCircle2} label={translate("Checked By")} value={session.checkedBy?.full_name ?? session.checkedBy?.username ?? "—"} theme="gray" />
              <StatCard icon={Boxes} label={translate("Total Items")} value={session.total_items ?? details.length} theme="gray" />
            </div>

            {/* Result & reusable summary — always visible */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle2} label={translate("Matched")} value={liveMatched} theme="green" />
              <StatCard icon={XCircle} label={translate("Missing")} value={liveMissing} theme="red" />
              <StatCard icon={TrendingUp} label={translate("Over Count")} value={liveOver} theme="yellow" />
              {reusableDetails.length > 0 && (
                <>
                  <StatCard icon={ShieldCheck} label={translate("Good")} value={conditionCounts[CheckItemCondition.GOOD] ?? 0} theme="green" />
                  <StatCard icon={ShieldAlert} label={translate("Damaged")} value={conditionCounts[CheckItemCondition.DAMAGED] ?? 0} theme="red" />
                  <StatCard icon={CheckCircle2} label={translate("Available")} value={statusCounts[CheckReusableStatus.AVAILABLE] ?? 0} theme="green" />
                  <StatCard icon={Clock3} label={translate("In Use")} value={statusCounts[CheckReusableStatus.IN_USE] ?? 0} theme="blue" />
                  <StatCard icon={Wrench} label={translate("Maintenance")} value={statusCounts[CheckReusableStatus.MAINTENANCE] ?? 0} theme="yellow" />
                </>
              )}
            </div>

            {/* Actions: toggle status left, Save right */}
            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleToggleLocalStatus}
                className={isCompleted
                  ? "border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400"
                  : "border-teal-500 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400"}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isCompleted ? translate("Selesai") : translate("In Progress")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={completeSession.isPending || reopenSession.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {(completeSession.isPending || reopenSession.isPending)
                  ? translate("Saving...")
                  : translate("Save")}
              </Button>
            </div>

            {/* Consumable items */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{translate("Consumable Items")}</h2>
              <Card className="border-0 shadow-md dark:bg-slate-800">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translate("Item")}</TableHead>
                        <TableHead className="text-right">{translate("System Qty")}</TableHead>
                        <TableHead className="w-28 text-center">{translate("Physical Count")}</TableHead>
                        <TableHead className="text-right">{translate("Difference")}</TableHead>
                        <TableHead className="text-center">{translate("Result")}</TableHead>
                        <TableHead className="w-40">{translate("Catatan")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumableDetails.length === 0 ? (
                        <NoDataTableComponent colSpan={6} />
                      ) : (
                        consumableDetails.map((detail) => (
                          <CountRow
                            key={detail.id}
                            detail={detail}
                            sessionCompleted={isCompleted}
                            onSaved={refetchDetail}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Reusable items */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{translate("Reusable Items")}</h2>
              <Card className="border-0 shadow-md dark:bg-slate-800">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translate("Item")}</TableHead>
                        <TableHead className="w-40">{translate("Condition")}</TableHead>
                        <TableHead className="w-40">{translate("Status")}</TableHead>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-40">{translate("Catatan")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reusableDetails.length === 0 ? (
                        <NoDataTableComponent colSpan={5} />
                      ) : (
                        reusableDetails.map((detail) => (
                          <ReusableCountRow
                            key={detail.id}
                            detail={detail}
                            sessionCompleted={isCompleted}
                            onSaved={refetchDetail}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Sessions List View ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Audit"), page: "InventoryAudit" },
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <ClipboardCheck className="w-6 h-6 text-teal-600" />
          {translate("Stock Audit")}
        </h1>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {translate("New Audit Session")}
        </Button>
      </div>

      {/* Status & Location filters */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-500 shrink-0">{translate("Filter")}:</Label>
        <Select
          value={urlStatus}
          onValueChange={(val) => setSearchParams((p) => { const n = new URLSearchParams(p); n.set("page","1"); val !== "all" ? n.set("status", val) : n.delete("status"); return n; })}
        >
          <SelectTrigger className="w-44 dark:border-slate-600 dark:bg-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Sessions")}</SelectItem>
            <SelectItem value={CheckSessionStatus.IN_PROGRESS}>{translate("In Progress")}</SelectItem>
            <SelectItem value={CheckSessionStatus.COMPLETED}>{translate("Completed")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={urlLocation}
          onValueChange={(val) => setSearchParams((p) => { const n = new URLSearchParams(p); n.set("page","1"); val !== "all" ? n.set("location", val) : n.delete("location"); return n; })}
        >
          <SelectTrigger className="w-44 dark:border-slate-600 dark:bg-slate-700">
            <SelectValue placeholder={translate("All Locations")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Locations")}</SelectItem>
            {locationOptions.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Date")}</TableHead>
                <TableHead>{translate("Location")}</TableHead>
                <TableHead>{translate("Checked By")}</TableHead>
                <TableHead className="text-center">{translate("Items")}</TableHead>
                <TableHead className="text-center">{translate("Matched")}</TableHead>
                <TableHead className="text-center">{translate("Missing")}</TableHead>
                <TableHead className="text-center">{translate("Over Count")}</TableHead>
                <TableHead className="text-center">{translate("Status")}</TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsLoading ? (
                <InlineLoadingComponent isTable colSpan={9} />
              ) : sessionsList.length === 0 ? (
                <NoDataTableComponent colSpan={9} />
              ) : (
                sessionsList.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(session.session_date ?? session.createdat)}
                    </TableCell>
                    <TableCell className="font-medium">{session.location}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {session.checkedBy?.full_name ?? session.checkedBy?.username ?? "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">{session.total_items ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-green-600">{session.matched ?? 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-red-600">{session.missing ?? 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-yellow-600">{session.over_count ?? 0}</span>
                    </TableCell>
                    <TableCell className="text-center">{sessionStatusBadge(session.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openSession(session.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        currentPage={urlPage}
        totalPages={totalPages}
        onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setSearchParams((p) => { const np = new URLSearchParams(p); np.set("page", "1"); return np; }); }}
        totalItems={total}
      />

      {/* Create session dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("New Audit Session")}</DialogTitle>
            <DialogDescription>
              {translate("A snapshot of all current item quantities will be recorded automatically.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <SelectForm
              name="location"
              control={control}
              label={translate("Location / Area")}
              placeholder={translate("Select location")}
              options={locationOptions}
              required
              errors={errors}
            />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Notes")}</Label>
              <Textarea
                {...register("notes")}
                placeholder={translate("Optional")}
                rows={3}
                className="resize-none dark:border-slate-600 dark:bg-slate-700"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {translate("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                {isSubmitting ? translate("Creating...") : translate("Start Audit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileInventoryAudit() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSessionId = searchParams.get("sessionId") ? Number(searchParams.get("sessionId")) : null;
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlLocation = searchParams.get("location") || "all";
  const [itemsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { location: "", notes: "" },
  });

  const { itemsList } = useGetAllInventoryItems();
  const locationOptions = useMemo(() => getLocationOptions(itemsList), [itemsList]);

  const { sessionsList, total, totalPages, isLoading: sessionsLoading } = useGetAuditSessionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterLocation: urlLocation !== "all" ? urlLocation : undefined,
  });

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } =
    useGetAuditSessionDetails(selectedSessionId);

  const { createSession, completeSession, reopenSession } = useInventoryAuditMutations();

  useEffect(() => {
    if (detailData?.session?.status) {
      setLocalStatus(detailData.session.status);
    }
  }, [detailData?.session?.status]);

  const openMobileSession = (id) => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("sessionId", String(id)); return n; });
  };

  const onCreateSubmit = async (data) => {
    const newSession = await createSession.mutateAsync({ location: data.location, notes: data.notes || undefined });
    reset();
    setCreateDialogOpen(false);
    if (newSession?.id) openMobileSession(newSession.id);
  };

  const handleToggleLocalStatus = () => {
    setLocalStatus((prev) =>
      prev === CheckSessionStatus.COMPLETED
        ? CheckSessionStatus.IN_PROGRESS
        : CheckSessionStatus.COMPLETED,
    );
  };

  const handleSave = async () => {
    if (!selectedSessionId || !detailData?.session) return;
    const savedStatus = detailData.session.status;
    if (localStatus !== savedStatus) {
      if (localStatus === CheckSessionStatus.COMPLETED) {
        await completeSession.mutateAsync(selectedSessionId);
      } else {
        await reopenSession.mutateAsync(selectedSessionId);
      }
      refetchDetail();
    } else {
      showSuccess(translate("Audit Session"), "update");
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  // Detail view
  if (selectedSessionId) {
    const session = detailData?.session;
    const details = detailData?.details ?? [];
    const { consumable: consumableDetails, reusable: reusableDetails } = splitDetailsByType(details);
    const isCompleted = localStatus === CheckSessionStatus.COMPLETED;
    const liveMatched = details.filter((d) => d.result === CheckDetailResult.MATCH).length;
    const liveOver    = details.filter((d) => d.result === CheckDetailResult.OVER_COUNT).length;
    const conditionCounts = countByField(reusableDetails, (d) => d.condition ?? d.item?.condition);
    const statusCounts = countByField(reusableDetails, (d) => d.reusable_status ?? d.item?.status);
    const liveMissing = details.filter((d) => d.result === CheckDetailResult.MISSING).length
      + (statusCounts[CheckReusableStatus.MISSING] ?? 0);
    const statusUnsaved = session && localStatus !== null && localStatus !== session.status;

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("sessionId"); return n; })}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {translate("Audit")} #{selectedSessionId}
          </h1>
          {localStatus && sessionStatusBadge(localStatus)}
          {statusUnsaved && <span className="text-xs text-amber-500 italic">{translate("Unsaved")}</span>}
        </div>

        {detailLoading ? <PageLoadingComponent /> : !session ? (
          <p className="text-gray-400 text-center py-8">{translate("Not found")}</p>
        ) : (
          <>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="pt-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <MiniStat icon={MapPin} label={translate("Location")} value={session.location} theme="teal" />
                  <MiniStat icon={CalendarClock} label={translate("Tarikh Masa")} value={formatDateTime(session.session_date ?? session.createdat)} theme="gray" />
                  <MiniStat icon={Boxes} label={translate("Items")} value={session.total_items ?? details.length} theme="gray" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <MiniStat icon={CheckCircle2} label={translate("Matched")} value={liveMatched} theme="green" />
                  <MiniStat icon={XCircle} label={translate("Missing")} value={liveMissing} theme="red" />
                  <MiniStat icon={TrendingUp} label={translate("Over Count")} value={liveOver} theme="yellow" />
                </div>
                {reusableDetails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <MiniStat icon={ShieldCheck} label={translate("Good")} value={conditionCounts[CheckItemCondition.GOOD] ?? 0} theme="green" />
                    <MiniStat icon={ShieldAlert} label={translate("Damaged")} value={conditionCounts[CheckItemCondition.DAMAGED] ?? 0} theme="red" />
                    <MiniStat icon={CheckCircle2} label={translate("Available")} value={statusCounts[CheckReusableStatus.AVAILABLE] ?? 0} theme="green" />
                    <MiniStat icon={Clock3} label={translate("In Use")} value={statusCounts[CheckReusableStatus.IN_USE] ?? 0} theme="blue" />
                    <MiniStat icon={Wrench} label={translate("Maintenance")} value={statusCounts[CheckReusableStatus.MAINTENANCE] ?? 0} theme="yellow" />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleToggleLocalStatus}
                className={`flex-1 ${isCompleted
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400"}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isCompleted ? translate("Selesai") : translate("In Progress")}
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleSave}
                disabled={completeSession.isPending || reopenSession.isPending}
              >
                {(completeSession.isPending || reopenSession.isPending)
                  ? translate("Saving...")
                  : translate("Save")}
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{translate("Consumable Items")}</h2>
              {consumableDetails.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{translate("No data")}</p>
              ) : (
                consumableDetails.map((detail) => (
                  <MobileCountCard
                    key={detail.id}
                    detail={detail}
                    sessionCompleted={isCompleted}
                    onSaved={refetchDetail}
                  />
                ))
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{translate("Reusable Items")}</h2>
              {reusableDetails.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{translate("No data")}</p>
              ) : (
                reusableDetails.map((detail) => (
                  <MobileReusableCard
                    key={detail.id}
                    detail={detail}
                    sessionCompleted={isCompleted}
                    onSaved={refetchDetail}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Sessions list
  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Audit"), page: "InventoryAudit" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-teal-600" />
          {translate("Stock Audit")}
        </h1>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Select
        value={urlLocation}
        onValueChange={(val) => setSearchParams((p) => { const n = new URLSearchParams(p); n.set("page","1"); val !== "all" ? n.set("location", val) : n.delete("location"); return n; })}
      >
        <SelectTrigger className="w-full dark:border-slate-600 dark:bg-slate-700">
          <SelectValue placeholder={translate("All Locations")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{translate("All Locations")}</SelectItem>
          {locationOptions.map((loc) => (
            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sessionsLoading ? <PageLoadingComponent /> : sessionsList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{translate("No audit sessions yet")}</p>
      ) : (
        <div className="space-y-2">
          {sessionsList.map((session) => (
            <Card key={session.id} className="dark:bg-slate-800 dark:border-slate-700 cursor-pointer" onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.set("sessionId", String(session.id)); return n; })}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{session.location}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(session.session_date ?? session.createdat)}</p>
                    <div className="mt-2">{sessionStatusBadge(session.status)}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{session.total_items ?? "—"} {translate("items")}</p>
                    <p className="text-xs mt-1">
                      <span className="text-green-600">{session.matched ?? 0}✓</span>
                      {" / "}
                      <span className="text-red-600">{session.missing ?? 0}✗</span>
                      {" / "}
                      <span className="text-yellow-600">{session.over_count ?? 0}↑</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination currentPage={urlPage} totalPages={totalPages} onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })} itemsPerPage={itemsPerPage} totalItems={total} />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-sm dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("New Audit Session")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <SelectForm
              name="location"
              control={control}
              label={translate("Location")}
              placeholder={translate("Select location")}
              options={locationOptions}
              required
              errors={errors}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>{translate("Cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                {isSubmitting ? translate("Creating...") : translate("Start")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mobile per-item count card
function MobileCountCard({ detail, sessionCompleted, onSaved }) {
  const neverSaved = detail.physical_count === null || detail.physical_count === undefined;
  const [localCount, setLocalCount] = useState(
    neverSaved ? String(detail.system_quantity) : String(detail.physical_count),
  );
  const [localNotes, setLocalNotes] = useState(detail.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { updateCount } = useInventoryAuditMutations();

  useEffect(() => {
    if (neverSaved && !sessionCompleted) {
      updateCount.mutateAsync({ detailId: detail.id, physical_count: detail.system_quantity })
        .then(() => onSaved?.())
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const val = parseInt(localCount, 10);
    if (isNaN(val) || val < 0) return;
    const noChange = val === detail.physical_count && localNotes === (detail.notes ?? "");
    if (noChange) return;
    setSaving(true);
    try {
      await updateCount.mutateAsync({ detailId: detail.id, physical_count: val, notes: localNotes || undefined });
      onSaved?.();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const diff = localCount !== "" && !isNaN(parseInt(localCount, 10))
    ? parseInt(localCount, 10) - detail.system_quantity
    : null;

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {detail.item?.item_name ?? `Item #${detail.itemId}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {translate("System")}: <span className="font-mono">{detail.system_quantity}</span>
              {diff !== null && (
                <span className={`ml-2 font-mono ${diff === 0 ? "text-green-600" : diff > 0 ? "text-yellow-600" : "text-red-600"}`}>
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : resultBadge(detail.result)}
            {sessionCompleted ? (
              <span className="font-mono text-sm w-16 text-center">{detail.physical_count ?? "—"}</span>
            ) : (
              <Input
                type="number"
                min={0}
                value={localCount}
                onChange={(e) => setLocalCount(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                className="h-8 w-20 text-sm text-center font-mono dark:border-slate-600 dark:bg-slate-700"
                disabled={saving}
              />
            )}
          </div>
        </div>
        {sessionCompleted ? (
          detail.notes ? <p className="text-xs text-gray-500">{translate("Catatan")}: {detail.notes}</p> : null
        ) : (
          <Input
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            placeholder={translate("Catatan (Optional)")}
            className="h-8 text-xs dark:border-slate-600 dark:bg-slate-700"
            disabled={saving}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Mobile per-item reusable check card
function MobileReusableCard({ detail, sessionCompleted, onSaved }) {
  const [localCondition, setLocalCondition] = useState(detail.condition ?? detail.item?.condition ?? "");
  const [localStatus, setLocalStatus] = useState(detail.reusable_status ?? detail.item?.status ?? "");
  const [localNotes, setLocalNotes] = useState(detail.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { updateReusableCount } = useInventoryAuditMutations();

  const persist = async (overrides = {}) => {
    const condition = overrides.condition ?? localCondition;
    const reusable_status = overrides.reusable_status ?? localStatus;
    const notes = overrides.notes ?? localNotes;
    if (!condition || !reusable_status) return;
    setSaving(true);
    try {
      await updateReusableCount.mutateAsync({ detailId: detail.id, condition, reusable_status, notes: notes || undefined });
      onSaved?.();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
            {detail.item?.item_name ?? `Item #${detail.itemId}`}
          </p>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sessionCompleted ? (
            <div>{conditionBadge(detail.condition ?? detail.item?.condition)}</div>
          ) : (
            <Select
              value={localCondition}
              onValueChange={(val) => { setLocalCondition(val); persist({ condition: val }); }}
              disabled={saving}
            >
              <SelectTrigger className="h-8 text-xs dark:border-slate-600 dark:bg-slate-700">
                <SelectValue placeholder={translate("Condition")} />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {sessionCompleted ? (
            <div>{reusableStatusBadge(detail.reusable_status ?? detail.item?.status)}</div>
          ) : (
            <Select
              value={localStatus}
              onValueChange={(val) => { setLocalStatus(val); persist({ reusable_status: val }); }}
              disabled={saving}
            >
              <SelectTrigger className="h-8 text-xs dark:border-slate-600 dark:bg-slate-700">
                <SelectValue placeholder={translate("Status")} />
              </SelectTrigger>
              <SelectContent>
                {reusableStatusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {sessionCompleted ? (
          detail.notes ? <p className="text-xs text-gray-500">{translate("Catatan")}: {detail.notes}</p> : null
        ) : (
          <Input
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => persist()}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            placeholder={translate("Catatan (Optional)")}
            className="h-8 text-xs dark:border-slate-600 dark:bg-slate-700"
            disabled={saving}
          />
        )}
      </CardContent>
    </Card>
  );
}
