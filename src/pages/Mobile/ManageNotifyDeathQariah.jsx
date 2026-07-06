// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Bell,
  BellRing,
  Trash2,
  RotateCcw,
  Save,
  Send,
  BookTemplate,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import Select2Form from "@/components/forms/Select2Form";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";

const DEFAULT_TEMPLATE =
  "Innalillahi wainna ilaihi rajiun. Dengan penuh dukacita kami memaklumkan bahawa ahli qariah kita, {name}, telah kembali ke rahmatullah. Semoga Allah mencucuri rahmat ke atas rohnya dan ditempatkan dalam kalangan orang-orang yang soleh. Al-Fatihah.";

function buildPreview(template, name, address) {
  return (template || DEFAULT_TEMPLATE)
    .replace(/{name}/g, name || "")
    .replace(/{address}/g, address || "");
}

function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function NotificationCard({ notif, canEdit, canDelete, onResend, onDelete }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">
              {notif.deceasedMember?.fullname ?? "—"}
            </p>
            {notif.deceasedMember?.icnumber && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {notif.deceasedMember.icnumber}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className="shrink-0 text-emerald-600 border-emerald-300 text-xs"
          >
            {notif.notifiedcount} orang
          </Badge>
        </div>

        {notif.organisation?.name && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {notif.organisation.name}
          </p>
        )}

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
          {notif.message}
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          {notif.createdat
            ? new Date(notif.createdat).toLocaleString("ms-MY")
            : "—"}
        </p>

        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <button
              onClick={() => onResend(notif)}
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <BellRing className="w-3.5 h-3.5" />
              {translate("Resend")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(notif)}
              className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {translate("Delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NotifySheet({
  onClose,
  onSend,
  isSending,
  allOrganisations,
  isCurrentUserParentOrganisation,
  currentUser,
}) {
  const { control, watch, setValue } = useForm({
    defaultValues: {
      notifyOrgId: isCurrentUserParentOrganisation
        ? null
        : (currentUser?.organisation?.id ?? null),
      notifyMosqueId: null,
      selectedMemberId: null,
    },
  });
  const notifyOrgId = watch("notifyOrgId");
  const notifyMosqueId = watch("notifyMosqueId");
  const selectedMemberId = watch("selectedMemberId");
  const [notifyMessage, setNotifyMessage] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const { data: notifyOrgMosques = [] } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: notifyOrgId },
      { enabled: !!notifyOrgId },
    );

  const { data: memberData } =
    trpc.deathCharityMember.getQariahPaginated.useQuery(
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
  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  useEffect(() => {
    setValue("notifyMosqueId", null);
    setValue("selectedMemberId", null);
    setNotifyMessage("");
  }, [notifyOrgId]);

  useEffect(() => {
    setValue("selectedMemberId", null);
    setNotifyMessage("");
  }, [notifyMosqueId]);

  const { data: memberOrgTemplate } =
    trpc.qariahNotification.getOrganisationTemplate.useQuery(
      { organisationId: selectedMember?.organisationId ?? 0 },
      { enabled: !!selectedMember?.organisationId },
    );

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

  const handleSend = () => {
    if (!selectedMember) return;
    onSend({
      deceasedMemberId: selectedMember.id,
      customMessage: notifyMessage || null,
    });
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
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          Hantar Notifikasi Kematian Ahli Qariah
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title="Organisasi & Masjid">
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
            <div className="space-y-1.5">
              <Label>Organisasi</Label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-200">
                {currentUser?.organisation?.name || "—"}
              </div>
            </div>
          )}

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
        </FormSection>

        <FormSection title="Ahli Yang Wafat">
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
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Organisasi:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200 text-right">
                  {selectedMember.organisation?.name ?? "—"}
                </span>
              </div>
              {selectedMember.mosque && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Masjid:
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-right">
                    {selectedMember.mosque.name}
                  </span>
                </div>
              )}
              {selectedMember.address && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">
                    Alamat:
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-right">
                    {selectedMember.address}
                  </span>
                </div>
              )}
            </div>
          )}
        </FormSection>

        <FormSection title="Mesej Notifikasi">
          <Textarea
            rows={5}
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            placeholder={DEFAULT_TEMPLATE}
            className="dark:bg-slate-800 dark:border-slate-700"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mesej ini akan dihantar sebagai notifikasi tolak kepada semua ahli
            qariah di bawah organisasi yang sama.
          </p>
        </FormSection>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <button
          type="button"
          onClick={handleSend}
          disabled={!selectedMember || !notifyMessage.trim() || isSending}
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {isSending ? "Menghantar..." : "Hantar Notifikasi"}
        </button>
      </div>
    </div>
  );
}

function TemplateSheet({ onClose, allOrganisations }) {
  const { control, watch } = useForm({
    defaultValues: { templateOrgId: null },
  });
  const templateOrgId = watch("templateOrgId");
  const [templateText, setTemplateText] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const { data: templateData, refetch: refetchTemplate } =
    trpc.qariahNotification.getOrganisationTemplate.useQuery(
      { organisationId: templateOrgId ?? 0 },
      { enabled: !!templateOrgId },
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

  const saveTemplateMutation =
    trpc.qariahNotification.saveOrganisationTemplate.useMutation({
      onSuccess: () => {
        showSuccess("Templat mesej disimpan.", "success");
        refetchTemplate();
      },
      onError: (err) => showApiError(err),
    });

  const handleSaveTemplate = async () => {
    if (!templateOrgId) return;
    await saveTemplateMutation.mutateAsync({
      organisationId: templateOrgId,
      template: templateText?.trim() || null,
    });
  };

  const handleResetTemplate = () => setTemplateText("");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          Templat Mesej Notifikasi Organisasi
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title="Organisasi">
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
        </FormSection>

        {templateOrgId && (
          <FormSection title="Templat Mesej">
            <Textarea
              rows={6}
              placeholder={DEFAULT_TEMPLATE}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="dark:bg-slate-800 dark:border-slate-700"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pemboleh ubah:{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">
                {"{name}"}
              </code>{" "}
              untuk nama ahli wafat,{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">
                {"{address}"}
              </code>{" "}
              untuk alamat. Kosongkan untuk gunakan templat lalai.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                Pratonton mesej:
              </p>
              <p className="leading-relaxed">
                {buildPreview(
                  templateText || DEFAULT_TEMPLATE,
                  "Ahmad bin Abu Bakar",
                  "No. 12, Jalan Mawar 3, Selangor",
                )}
              </p>
            </div>
          </FormSection>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0 flex gap-2">
        {templateOrgId && (
          <button
            type="button"
            onClick={handleResetTemplate}
            title="Padam templat — akan guna templat lalai"
            className="flex items-center justify-center gap-1.5 h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 active:opacity-70 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={!templateOrgId || saveTemplateMutation.isPending}
          className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveTemplateMutation.isPending ? "Menyimpan..." : "Simpan Templat"}
        </button>
      </div>
    </div>
  );
}

export default function MobileManageNotifyDeathQariah() {
  const { loadingUser, hasAdminAccess, currentUser, isSuperAdmin } =
    useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("death_charity");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState(null);
  const [renotifyDialogOpen, setRenotifyDialogOpen] = useState(false);
  const [notifToResend, setNotifToResend] = useState(null);

  const {
    data: notifData,
    isLoading: notifLoading,
    refetch,
  } = trpc.qariahNotification.getPagedNotifications.useQuery({
    page,
    pageSize: itemsPerPage,
  });

  const isCurrentUserParentOrganisation =
    !!currentUser?.organisation &&
    (currentUser.organisation.parentorganisation == null ||
      currentUser.organisation.parentorganisation?.id == null ||
      currentUser.organisation.parentorganisationId == null);

  const { data: allOrganisations = [] } =
    trpc.deathCharityMember.getOrganisations.useQuery({
      state: null,
      organisationId: isSuperAdmin
        ? null
        : (currentUser?.organisation?.id ?? null),
    });

  const notifyMutation = trpc.qariahNotification.notifyDeath.useMutation({
    onSuccess: (data) => {
      showSuccess(
        `Notifikasi dihantar kepada ${data.notifiedcount} ahli qariah.`,
        "success",
      );
      refetch();
      setNotifySheetOpen(false);
    },
    onError: (err) => showApiError(err),
  });

  const resendMutation = trpc.qariahNotification.resendNotification.useMutation(
    {
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
    },
  );

  const deleteMutation = trpc.qariahNotification.deleteNotification.useMutation(
    {
      onSuccess: () => {
        showSuccess(translate("Deleted"), "success");
        refetch();
        setDeleteDialogOpen(false);
        setNotifToDelete(null);
      },
      onError: (err) => showApiError(err),
    },
  );

  const items = notifData?.items ?? [];
  const total = notifData?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return <AccessDeniedComponent />;

  return (
    <div className="min-h-screen pb-6">
      <BackNavigation title="Notifikasi Kematian Qariah" />

      <div className="max-w-2xl mx-auto px-3 space-y-4 pt-1">
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => setTemplateSheetOpen(true)}
              className="flex items-center justify-center gap-2 h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 active:opacity-70 shrink-0"
            >
              <BookTemplate className="w-4 h-4 text-amber-500" />
              Templat
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setNotifySheetOpen(true)}
              className="flex-1 h-11 rounded-2xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 active:opacity-80 shadow-sm"
            >
              <Send className="w-4 h-4" />
              Hantar Notifikasi
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center px-1">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Sejarah Notifikasi
            </h3>
          </div>

          {notifLoading ? (
            <InlineLoadingComponent isPage />
          ) : items.length === 0 ? (
            <MobileEmptyList icon={Bell} title={translate("No records")} />
          ) : (
            <div className="space-y-3">
              {items.map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notif={notif}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onResend={(n) => {
                    setNotifToResend(n);
                    setRenotifyDialogOpen(true);
                  }}
                  onDelete={(n) => {
                    setNotifToDelete(n);
                    setDeleteDialogOpen(true);
                  }}
                />
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
                totalItems={total}
              />
            </div>
          )}
        </div>
      </div>

      {notifySheetOpen && (
        <NotifySheet
          onClose={() => setNotifySheetOpen(false)}
          onSend={(payload) => notifyMutation.mutateAsync(payload)}
          isSending={notifyMutation.isPending}
          allOrganisations={allOrganisations}
          isCurrentUserParentOrganisation={isCurrentUserParentOrganisation}
          currentUser={currentUser}
        />
      )}

      {templateSheetOpen && (
        <TemplateSheet
          onClose={() => setTemplateSheetOpen(false)}
          allOrganisations={allOrganisations}
        />
      )}

      <ConfirmDialog
        open={renotifyDialogOpen}
        onOpenChange={setRenotifyDialogOpen}
        title="Hantar Semula Notifikasi"
        description={`Hantar semula notifikasi kematian "${notifToResend?.deceasedMember?.fullname ?? ""}" kepada semua ahli qariah organisasi ${notifToResend?.organisation?.name ?? ""}?`}
        onConfirm={() => resendMutation.mutateAsync(notifToResend?.id)}
        confirmText="Hantar Semula"
      />

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
