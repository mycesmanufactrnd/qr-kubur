// @ts-nocheck
// Mobile card-list view of Management/ManageQariahRegistration.jsx.
import { useEffect, useState } from "react";
import { Users, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";
import QariahStatusBadge, {
  QARIAH_STATUSES,
  qariahStatusLabel,
  qariahGenderLabel,
  formatQariahAddress,
  formatQariahFamily,
} from "@/components/QariahStatusBadge";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import { createPageUrl } from "@/utils";
import { useCrudPermissions } from "@/components/PermissionsContext";
import {
  useGetQariahMemberPaginated,
  useQariahMemberMutations,
} from "@/mutations/useQariahMemberMutations";

function RegistrationCard({ member, canApprove, disabled, onApprove, onReject }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1 min-w-0">
            {member.fullname}
          </p>
          <QariahStatusBadge
            status={member.status}
            notes={member.notes}
            className="shrink-0"
          />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {member.icno && <span>{member.icno}</span>}
          {member.gender && <span>{qariahGenderLabel(member.gender)}</span>}
          {member.phoneno && <span>{member.phoneno}</span>}
          {member.email && <span className="break-all">{member.email}</span>}
        </div>

        {formatQariahAddress(member) && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatQariahAddress(member)}
          </p>
        )}

        {formatQariahFamily(member) && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatQariahFamily(member)}
          </p>
        )}

        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
          {[
            member.mosque?.name,
            member.createdat
              ? new Date(member.createdat).toLocaleDateString("ms-MY")
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {member.status === "rejected" && member.notes && (
          <p className="text-xs text-red-500 dark:text-red-400">
            {member.notes}
          </p>
        )}

        {canApprove && member.status === "pending" && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => onApprove(member)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {translate("Approve")}
            </button>
            <button
              onClick={() => onReject(member)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70 disabled:opacity-50 ml-auto"
            >
              <XCircle className="w-3.5 h-3.5" />
              {translate("Reject")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobileManageQariahRegistration() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canApprove,
  } = useCrudPermissions("kariah");

  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [appliedFilters, setAppliedFilters] = useState({
    fullname: "",
    status: "pending",
  });
  const [memberToApprove, setMemberToApprove] = useState(null);
  const [memberToReject, setMemberToReject] = useState(null);

  const { qariahMemberList, totalPages, isLoading, isFetching, refetch } =
    useGetQariahMemberPaginated({
      page,
      pageSize: itemsPerPage,
      filterFullName: appliedFilters.fullname,
      filterStatus: QARIAH_STATUSES.includes(appliedFilters.status)
        ? appliedFilters.status
        : null,
      enabled: canView,
    });
  const { items, total } = qariahMemberList;

  const { approveQariahMember, rejectQariahMember } =
    useQariahMemberMutations();
  const isMutating =
    approveQariahMember.isPending || rejectQariahMember.isPending;

  // A push notification deep-links here; send a logged-out visitor to log in
  // (with a return path) instead of a dead-end Access Denied.
  useEffect(() => {
    if (loadingUser || currentUser) return;
    window.location.href = `${createPageUrl("AppUserLogin")}?return=${encodeURIComponent(
      window.location.pathname + window.location.search,
    )}`;
  }, [loadingUser, currentUser]);

  if (loadingUser || permissionsLoading || !currentUser) {
    return <PageLoadingComponent />;
  }
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <div className="min-h-screen pb-6">
      <BackNavigation title={translate("Kariah Registrations")} />

      <div className="max-w-2xl mx-auto px-3 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <AdvancedFilters
            parameter={[
              {
                label: translate("Full Name"),
                type: "text",
                searchColumn: "fullname",
              },
              {
                label: translate("Status"),
                type: "select",
                searchColumn: "status",
                options: QARIAH_STATUSES.map((s) => ({
                  id: s,
                  name: qariahStatusLabel(s),
                })),
              },
            ]}
            onApplyFilter={(f) => {
              setAppliedFilters({
                fullname: f.fullname || "",
                status: f.status || "",
              });
              setPage(1);
            }}
          />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title={translate("Refresh")}
            aria-label={translate("Refresh")}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:opacity-70 disabled:opacity-50 ml-auto"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {isLoading ? (
          <InlineLoadingComponent isPage />
        ) : items.length === 0 ? (
          <MobileEmptyList icon={Users} title={translate("No records")} />
        ) : (
          <div className="space-y-3">
            {items.map((member) => (
              <RegistrationCard
                key={member.id}
                member={member}
                canApprove={canApprove}
                disabled={isMutating}
                onApprove={setMemberToApprove}
                onReject={setMemberToReject}
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

      <ConfirmDialog
        isMobile
        open={!!memberToApprove}
        onOpenChange={(open) => !open && setMemberToApprove(null)}
        title={translate("Approve Registration")}
        description={`${translate("Approve")} "${memberToApprove?.fullname}" ${translate("as a Kariah member of")} ${memberToApprove?.mosque?.name ?? ""}?`}
        confirmText={translate("Approve")}
        onConfirm={() =>
          approveQariahMember.mutate(
            { id: memberToApprove.id },
            { onSettled: () => setMemberToApprove(null) },
          )
        }
      />

      <ConfirmDialog
        isMobile
        open={!!memberToReject}
        onOpenChange={(open) => !open && setMemberToReject(null)}
        title={translate("Reject Registration")}
        description={`${translate("Reject")} "${memberToReject?.fullname}"? ${translate("They can register again later.")}`}
        confirmText={translate("Reject")}
        showReasonInput
        onConfirm={(reason) =>
          rejectQariahMember.mutate(
            { id: memberToReject.id, notes: reason },
            { onSettled: () => setMemberToReject(null) },
          )
        }
      />
    </div>
  );
}
