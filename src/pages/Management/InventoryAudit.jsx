// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
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
} from "@/hooks/useInventoryMutations";
import { useForm } from "react-hook-form";
import { CheckDetailResult, CheckSessionStatus } from "@/utils/enums";

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

function SortIcon({ field, current, order }) {
  if (current !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "ASC" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
}

// ── Physical Count Row ────────────────────────────────────────────────────────
// Each row manages its own local state and saves on blur.

function CountRow({ detail, sessionCompleted, onSaved }) {
  const [localCount, setLocalCount] = useState(
    detail.physical_count !== null && detail.physical_count !== undefined
      ? String(detail.physical_count)
      : "",
  );
  const [saving, setSaving] = useState(false);
  const { updateCount } = useInventoryAuditMutations();

  const handleSave = async () => {
    const val = parseInt(localCount, 10);
    if (isNaN(val) || val < 0) return;
    if (val === detail.physical_count) return;
    setSaving(true);
    try {
      await updateCount.mutateAsync({ detailId: detail.id, physical_count: val });
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { location: "", notes: "" },
  });

  const { sessionsList, total, totalPages, isLoading: sessionsLoading } = useGetAuditSessionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterStatus: urlStatus !== "all" ? urlStatus : undefined,
  });

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } =
    useGetAuditSessionDetails(selectedSessionId);

  const { createSession, completeSession } = useInventoryAuditMutations();

  const onCreateSubmit = async (data) => {
    await createSession.mutateAsync(
      { location: data.location, notes: data.notes || undefined },
      { onSuccess: () => { reset(); setCreateDialogOpen(false); } },
    );
  };

  const handleComplete = async () => {
    if (!selectedSessionId) return;
    await completeSession.mutateAsync(selectedSessionId);
    setCompleteDialogOpen(false);
    refetchDetail();
  };

  const openSession = (id) => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("sessionId", String(id)); return n; });
  };

  const backToList = () => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("sessionId"); return n; });
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  // ── Session Detail View ───────────────────────────────────────────────────

  if (selectedSessionId) {
    const session = detailData?.session;
    const details = detailData?.details ?? [];
    const isCompleted = session?.status === CheckSessionStatus.COMPLETED;

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
          {session && sessionStatusBadge(session.status)}
        </div>

        {detailLoading ? (
          <PageLoadingComponent />
        ) : !session ? (
          <p className="text-gray-400">{translate("Session not found")}</p>
        ) : (
          <>
            {/* Session summary card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: translate("Location"),    value: session.location },
                { label: translate("Date"),        value: formatDate(session.session_date ?? session.createdat) },
                { label: translate("Checked By"),  value: session.checkedBy?.full_name ?? session.checkedBy?.username ?? "—" },
                { label: translate("Total Items"), value: session.total_items ?? details.length },
              ].map((s) => (
                <Card key={s.label} className="dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="pt-4 pb-3 px-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Result summary (only when completed) */}
            {isCompleted && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{translate("Matched")}</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{session.matched ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{translate("Missing")}</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{session.missing ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="pt-4 pb-3 px-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{translate("Over Count")}</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{session.over_count ?? 0}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actions */}
            {!isCompleted && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setCompleteDialogOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {translate("Complete Session")}
                </Button>
              </div>
            )}

            {/* Detail table */}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.length === 0 ? (
                      <NoDataTableComponent colSpan={5} />
                    ) : (
                      details.map((detail) => (
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
          </>
        )}

        <ConfirmDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          onConfirm={handleComplete}
          title={translate("Complete Audit Session")}
          description={translate("Once completed, physical counts can no longer be updated. Discrepancies are recorded for reference only — no automatic stock adjustments are applied.")}
        />
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

      {/* Status filter */}
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
                <TableHead className="text-center">{translate("Status")}</TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsLoading ? (
                <InlineLoadingComponent isTable colSpan={8} />
              ) : sessionsList.length === 0 ? (
                <NoDataTableComponent colSpan={8} />
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
                      {session.status === CheckSessionStatus.COMPLETED
                        ? <span className="font-mono text-green-600">{session.matched ?? 0}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {session.status === CheckSessionStatus.COMPLETED
                        ? <span className="font-mono text-red-600">{session.missing ?? 0}</span>
                        : "—"}
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
            <TextInputForm
              name="location"
              control={control}
              label={translate("Location / Area")}
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
  const [itemsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { location: "", notes: "" },
  });

  const { sessionsList, total, totalPages, isLoading: sessionsLoading } = useGetAuditSessionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
  });

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } =
    useGetAuditSessionDetails(selectedSessionId);

  const { createSession, completeSession } = useInventoryAuditMutations();

  const onCreateSubmit = async (data) => {
    await createSession.mutateAsync(
      { location: data.location, notes: data.notes || undefined },
      { onSuccess: () => { reset(); setCreateDialogOpen(false); } },
    );
  };

  const handleComplete = async () => {
    if (!selectedSessionId) return;
    await completeSession.mutateAsync(selectedSessionId);
    setCompleteDialogOpen(false);
    refetchDetail();
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  // Detail view
  if (selectedSessionId) {
    const session = detailData?.session;
    const details = detailData?.details ?? [];
    const isCompleted = session?.status === CheckSessionStatus.COMPLETED;

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("sessionId"); return n; })}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {translate("Audit")} #{selectedSessionId}
          </h1>
          {session && sessionStatusBadge(session.status)}
        </div>

        {detailLoading ? <PageLoadingComponent /> : !session ? (
          <p className="text-gray-400 text-center py-8">{translate("Not found")}</p>
        ) : (
          <>
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="pt-4 space-y-1">
                <p className="text-sm"><span className="text-gray-400">{translate("Location")}: </span><span className="font-medium">{session.location}</span></p>
                <p className="text-sm"><span className="text-gray-400">{translate("Date")}: </span>{formatDate(session.session_date ?? session.createdat)}</p>
                <p className="text-sm"><span className="text-gray-400">{translate("Items")}: </span>{session.total_items ?? details.length}</p>
                {isCompleted && (
                  <div className="flex gap-4 pt-1">
                    <span className="text-sm text-green-600 font-semibold">✓ {session.matched ?? 0}</span>
                    <span className="text-sm text-red-600 font-semibold">✗ {session.missing ?? 0}</span>
                    <span className="text-sm text-yellow-600 font-semibold">↑ {session.over_count ?? 0}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isCompleted && (
              <Button onClick={() => setCompleteDialogOpen(true)} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {translate("Complete Session")}
              </Button>
            )}

            <div className="space-y-2">
              {details.map((detail) => (
                <MobileCountCard
                  key={detail.id}
                  detail={detail}
                  sessionCompleted={isCompleted}
                  onSaved={refetchDetail}
                />
              ))}
            </div>
          </>
        )}

        <ConfirmDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          onConfirm={handleComplete}
          title={translate("Complete Audit Session")}
          description={translate("Once completed, physical counts can no longer be updated.")}
        />
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
                    {session.status === CheckSessionStatus.COMPLETED && (
                      <p className="text-xs mt-1">
                        <span className="text-green-600">{session.matched ?? 0}✓</span>
                        {" / "}
                        <span className="text-red-600">{session.missing ?? 0}✗</span>
                      </p>
                    )}
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
            <TextInputForm name="location" control={control} label={translate("Location")} required errors={errors} />
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
  const [localCount, setLocalCount] = useState(
    detail.physical_count !== null && detail.physical_count !== undefined ? String(detail.physical_count) : "",
  );
  const [saving, setSaving] = useState(false);
  const { updateCount } = useInventoryAuditMutations();

  const handleSave = async () => {
    const val = parseInt(localCount, 10);
    if (isNaN(val) || val < 0 || val === detail.physical_count) return;
    setSaving(true);
    try {
      await updateCount.mutateAsync({ detailId: detail.id, physical_count: val });
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
      <CardContent className="p-3">
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
            {resultBadge(detail.result)}
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
      </CardContent>
    </Card>
  );
}
