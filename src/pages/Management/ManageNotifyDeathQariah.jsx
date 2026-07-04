// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import {
  Bell, BellRing, Trash2, RotateCcw, Save,
  Send, BookTemplate,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import Select2Form from "@/components/forms/Select2Form";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";

const DEFAULT_TEMPLATE =
  "Innalillahi wainna ilaihi rajiun. Dengan penuh dukacita kami memaklumkan bahawa ahli qariah kita, {name}, telah kembali ke rahmatullah. Semoga Allah mencucuri rahmat ke atas rohnya dan ditempatkan dalam kalangan orang-orang yang soleh. Al-Fatihah.";

function buildPreview(template, name, address) {
  return (template || DEFAULT_TEMPLATE)
    .replace(/{name}/g, name || "")
    .replace(/{address}/g, address || "");
}

export default function ManageNotifyDeathQariah() {
  const { loadingUser, hasAdminAccess, currentUser, isSuperAdmin } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("death_charity");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Notify dialog
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");

  // Template editor
  const [templateText, setTemplateText] = useState("");

  const { control, watch, setValue } = useForm({
    defaultValues: {
      templateOrgId: null,
      notifyOrgId: null,
      notifyMosqueId: null,
      selectedMemberId: null,
    },
  });
  const templateOrgId = watch("templateOrgId");
  const notifyOrgId = watch("notifyOrgId");
  const notifyMosqueId = watch("notifyMosqueId");
  const selectedMemberId = watch("selectedMemberId");

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState(null);

  // Re-notify confirm
  const [renotifyDialogOpen, setRenotifyDialogOpen] = useState(false);
  const [notifToResend, setNotifToResend] = useState(null);

  const { data: notifData, isLoading: notifLoading, refetch } =
    trpc.qariahNotification.getPagedNotifications.useQuery({
      page: urlPage,
      pageSize: itemsPerPage,
    });

  const isCurrentUserParentOrganisation = !!currentUser?.organisation &&
    (currentUser.organisation.parentorganisation == null ||
      currentUser.organisation.parentorganisation?.id == null ||
      currentUser.organisation.parentorganisationId == null);

  // Members for the deceased selector (filtered by selected org/mosque)
  const { data: memberData } = trpc.deathCharityMember.getQariahPaginated.useQuery(
    {
      page: 1,
      pageSize: 50,
      filterOrganisationId: notifyOrgId || null,
      filterMosqueId: notifyMosqueId || null,
      filterIsDeceased: true,
    },
    { enabled: !!notifyOrgId || !!notifyMosqueId },
  );
  const members = memberData?.items ?? [];
  const selectedMember =
    members.find((m) => m.id === selectedMemberId) ?? null;

  const { data: notifyOrgMosques = [] } = trpc.deathCharityMember.getMosquesByState.useQuery(
    { organisationId: notifyOrgId },
    { enabled: !!notifyOrgId },
  );

  // Organisations for template editor (scoped to admin's organisation)
  const { data: allOrganisations = [] } = trpc.deathCharityMember.getOrganisations.useQuery({
    state: null,
    organisationId: isSuperAdmin ? null : (currentUser?.organisation?.id ?? null),
  });

  // Template for selected organisation in editor
  const { data: templateData, refetch: refetchTemplate } =
    trpc.qariahNotification.getOrganisationTemplate.useQuery(
      { organisationId: templateOrgId ?? 0 },
      { enabled: !!templateOrgId },
    );

  useEffect(() => {
    if (!isCurrentUserParentOrganisation && currentUser?.organisation) {
      setValue("notifyOrgId", currentUser.organisation.id);
    }
  }, [currentUser, isCurrentUserParentOrganisation]);

  useEffect(() => {
    setValue("notifyMosqueId", null);
    setValue("selectedMemberId", null);
    setNotifyMessage("");
  }, [notifyOrgId]);

  useEffect(() => {
    setValue("selectedMemberId", null);
    setNotifyMessage("");
  }, [notifyMosqueId]);

  // Template for selected member's organisation (for notify dialog preview)
  const { data: memberOrgTemplate } =
    trpc.qariahNotification.getOrganisationTemplate.useQuery(
      { organisationId: selectedMember?.organisationId ?? 0 },
      { enabled: !!selectedMember?.organisationId && notifyDialogOpen },
    );

  useEffect(() => {
    setTemplateText("");
  }, [templateOrgId]);

  useEffect(() => {
    if (templateData) {
      setTemplateText(
        templateData.organisation?.deathnotificationtemplate ?? "",
      );
    }
  }, [templateData]);

  useEffect(() => {
    if (!selectedMember) return;
    const template =
      memberOrgTemplate?.organisation?.deathnotificationtemplate ||
      memberOrgTemplate?.defaultTemplate ||
      DEFAULT_TEMPLATE;
    setNotifyMessage(
      buildPreview(template, selectedMember.fullname, selectedMember.address),
    );
  }, [memberOrgTemplate, selectedMember]);

  const notifyMutation = trpc.qariahNotification.notifyDeath.useMutation({
    onSuccess: (data) => {
      showSuccess(
        `Notifikasi dihantar kepada ${data.notifiedcount} ahli qariah.`,
        "success",
      );
      refetch();
      setNotifyDialogOpen(false);
      setValue("selectedMemberId", null);
      setNotifyMessage("");
    },
    onError: (err) => showApiError(err),
  });

  const resendMutation = trpc.qariahNotification.resendNotification.useMutation({
    onSuccess: (data) => {
      showSuccess(
        `Notifikasi dihantar semula kepada ${data.notifiedcount} ahli qariah.`,
        "success",
      );
      refetch();
      setRenotifyDialogOpen(false);
      setNotifToResend(null);
    },
    onError: (err) => showApiError(err),
  });

  const deleteMutation = trpc.qariahNotification.deleteNotification.useMutation({
    onSuccess: () => {
      showSuccess(translate("Deleted"), "success");
      refetch();
      setDeleteDialogOpen(false);
      setNotifToDelete(null);
    },
    onError: (err) => showApiError(err),
  });

  const saveTemplateMutation = trpc.qariahNotification.saveOrganisationTemplate.useMutation({
    onSuccess: () => {
      showSuccess("Templat mesej disimpan.", "success");
      refetchTemplate();
    },
    onError: (err) => showApiError(err),
  });

  const openNotifyDialog = () => {
    setValue("selectedMemberId", null);
    setNotifyMessage("");
    setNotifyDialogOpen(true);
  };

  const handleSendNotification = async () => {
    if (!selectedMember) return;
    await notifyMutation.mutateAsync({
      deceasedMemberId: selectedMember.id,
      customMessage: notifyMessage || null,
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateOrgId) return;
    await saveTemplateMutation.mutateAsync({
      organisationId: templateOrgId,
      template: templateText?.trim() || null,
    });
  };

  const handleResetTemplate = () => {
    setTemplateText("");
  };

  const items = notifData?.items ?? [];
  const total = notifData?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: "Notifikasi Kematian Qariah", page: "ManageNotifyDeathQariah" },
      ]} />
      <AccessDeniedComponent />
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: "Notifikasi Kematian Qariah", page: "ManageNotifyDeathQariah" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-600" />
          Notifikasi Kematian Ahli Qariah
        </h1>
        {canCreate && (
          <Button
            onClick={openNotifyDialog}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Hantar Notifikasi Kematian
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookTemplate className="w-4 h-4 text-amber-500" />
            Templat Mesej Notifikasi Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Select2Form
                name="templateOrgId"
                control={control}
                label="Pilih Organisasi"
                placeholder="Pilih organisasi..."
                searchPlaceholder="Cari organisasi..."
                emptyMessage="Tiada organisasi dijumpai."
                options={allOrganisations.map((o) => ({
                  value: o.id,
                  label:
                    o.states?.length > 0
                      ? `${o.name} (${o.states.slice(0, 2).join(", ")})`
                      : o.name,
                }))}
              />
            </div>
          </div>

          {templateOrgId && (
            <>
              <div className="space-y-1">
                <Label>Templat Mesej</Label>
                <Textarea
                  rows={4}
                  placeholder={DEFAULT_TEMPLATE}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="dark:bg-slate-700 dark:border-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pemboleh ubah: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{"{name}"}</code> untuk nama ahli wafat,{" "}
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{"{address}"}</code> untuk alamat.
                  Kosongkan untuk gunakan templat lalai.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Pratonton mesej:</p>
                <p className="leading-relaxed">
                  {buildPreview(
                    templateText || DEFAULT_TEMPLATE,
                    "Ahmad bin Abu Bakar",
                    "No. 12, Jalan Mawar 3, Selangor",
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveTemplate}
                  disabled={saveTemplateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Templat
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetTemplate}
                  title="Padam templat — akan guna templat lalai"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Guna Lalai
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Sejarah Notifikasi</span>
            <span className="text-sm font-normal text-slate-500">{total} rekod</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ahli Yang Wafat</TableHead>
                <TableHead>Organisasi</TableHead>
                <TableHead>Mesej</TableHead>
                <TableHead className="text-center">Dihantar Kepada</TableHead>
                <TableHead>Terakhir Dihantar</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                items.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="font-medium">
                      {notif.deceasedMember?.fullname ?? "—"}
                      {notif.deceasedMember?.icnumber && (
                        <div className="text-xs text-slate-500">
                          {notif.deceasedMember.icnumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {notif.organisation?.name ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                        {notif.message}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-300"
                      >
                        {notif.notifiedcount} orang
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {notif.createdat
                        ? new Date(notif.createdat).toLocaleString("ms-MY")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Hantar semula notifikasi"
                            onClick={() => {
                              setNotifToResend(notif);
                              setRenotifyDialogOpen(true);
                            }}
                          >
                            <BellRing className="w-4 h-4 text-amber-500" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNotifToDelete(notif);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) =>
              setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: "1" });
            }}
            totalItems={total}
          />
        )}
      </Card>

      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-xl dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Hantar Notifikasi Kematian Ahli Qariah
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                {isCurrentUserParentOrganisation ? (
                  <Select2Form
                    name="notifyOrgId"
                    control={control}
                    label="Organisasi"
                    placeholder="Pilih organisasi..."
                    searchPlaceholder="Cari organisasi..."
                    emptyMessage="Tiada organisasi dijumpai."
                    options={allOrganisations.map((o) => ({
                      value: o.id,
                      label: o.name,
                    }))}
                  />
                ) : (
                  <>
                    <Label>Organisasi</Label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-200">
                      {currentUser?.organisation?.name || "—"}
                    </div>
                  </>
                )}
              </div>

              <Select2Form
                name="notifyMosqueId"
                control={control}
                label="Masjid"
                placeholder={
                  notifyOrgId ? "Pilih masjid..." : "Pilih organisasi dahulu"
                }
                searchPlaceholder="Cari masjid..."
                emptyMessage="Tiada masjid dijumpai."
                options={notifyOrgMosques.map((mosque) => ({
                  value: mosque.id,
                  label: mosque.name,
                }))}
                disabled={!notifyOrgId}
              />
            </div>

            <Select2Form
              name="selectedMemberId"
              control={control}
              label="Ahli Qariah Yang Wafat"
              placeholder="Cari ahli qariah..."
              searchPlaceholder="Cari nama ahli..."
              emptyMessage="Tiada ahli dijumpai."
              options={members.map((m) => ({
                value: m.id,
                label: `${m.fullname} (${m.icnumber}) · ${m.organisation?.name ?? "—"}`,
              }))}
              required
            />

            {selectedMember && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Organisasi:</span>
                  <span className="font-medium">{selectedMember.organisation?.name ?? "—"}</span>
                </div>
                {selectedMember.mosque && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Masjid:</span>
                    <span className="font-medium">{selectedMember.mosque.name}</span>
                  </div>
                )}
                {selectedMember.address && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alamat:</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {selectedMember.address}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label>Mesej Notifikasi</Label>
              <Textarea
                rows={5}
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder={DEFAULT_TEMPLATE}
                className="dark:bg-slate-700 dark:border-slate-600"
              />
              <p className="text-xs text-slate-500">
                Mesej ini akan dihantar sebagai notifikasi tolak kepada semua ahli qariah di bawah organisasi yang sama.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotifyDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={!selectedMember || !notifyMessage.trim() || notifyMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {notifyMutation.isPending ? "Menghantar..." : "Hantar Notifikasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Re-notify Confirm ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={renotifyDialogOpen}
        onOpenChange={setRenotifyDialogOpen}
        title="Hantar Semula Notifikasi"
        description={`Hantar semula notifikasi kematian "${notifToResend?.deceasedMember?.fullname ?? ""}" kepada semua ahli qariah organisasi ${notifToResend?.organisation?.name ?? ""}?`}
        onConfirm={() => resendMutation.mutateAsync(notifToResend?.id)}
        confirmText="Hantar Semula"
      />

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Padam Rekod Notifikasi"
        description={`Padam rekod notifikasi kematian "${notifToDelete?.deceasedMember?.fullname ?? ""}"?`}
        onConfirm={() => deleteMutation.mutateAsync(notifToDelete?.id)}
        confirmText="Padam"
        variant="destructive"
      />
    </div>
  );
}
