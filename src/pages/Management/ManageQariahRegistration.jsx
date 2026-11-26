// @ts-nocheck
// Kariah registrations from the public form (qariahmember), approved or
// rejected by the mosque's organisation admin. The list is scoped server-side
// to the admin's own organisation (superadmin sees all).
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { useIsNarrow } from "@/hooks/useIsNarrow";
import MobileManageQariahRegistration from "@/pages/Mobile/ManageQariahRegistration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/forms/SearchBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import { createPageUrl } from "@/utils";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { translate } from "@/utils/translations";
import QariahStatusBadge, {
  QARIAH_STATUSES,
  qariahStatusLabel,
  qariahGenderLabel,
  formatQariahAddress,
  formatQariahFamily,
} from "@/components/QariahStatusBadge";
import {
  useGetQariahMemberPaginated,
  useQariahMemberMutations,
} from "@/mutations/useQariahMemberMutations";

export default function ManageQariahRegistration() {
  const isNarrow = useIsNarrow();
  return isNarrow ? (
    <MobileManageQariahRegistration />
  ) : (
    <ManageQariahRegistrationDesktop />
  );
}

function ManageQariahRegistrationDesktop() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canApprove,
  } = useCrudPermissions("kariah");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlFullName = searchParams.get("fullname") || "";
  // pending first — that's what the admin comes here to act on
  const urlStatus = searchParams.has("status")
    ? searchParams.get("status") || null
    : "pending";

  const [tempFullName, setTempFullName] = useState(urlFullName);
  const [tempStatus, setTempStatus] = useState(urlStatus);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [memberToApprove, setMemberToApprove] = useState(null);
  const [memberToReject, setMemberToReject] = useState(null);

  const { qariahMemberList, totalPages, isLoading } =
    useGetQariahMemberPaginated({
      page: urlPage,
      pageSize: itemsPerPage,
      filterFullName: urlFullName,
      filterStatus: QARIAH_STATUSES.includes(urlStatus) ? urlStatus : null,
      enabled: canView,
    });
  const { items, total } = qariahMemberList;

  const { approveQariahMember, rejectQariahMember } =
    useQariahMemberMutations();

  const handleSearch = () => {
    const params = { page: "1", status: tempStatus ?? "" };
    if (tempFullName) params.fullname = tempFullName;
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempFullName("");
    setTempStatus("pending");
    setSearchParams({});
  };

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

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        {
          label: translate("Kariah Registrations"),
          page: "ManageQariahRegistration",
        },
      ]}
    />
  );

  if (!hasAdminAccess || !canView)
    return (
      <div className="space-y-6">
        {breadcrumb}
        <AccessDeniedComponent />
      </div>
    );

  const isMutating =
    approveQariahMember.isPending || rejectQariahMember.isPending;

  return (
    <div className="space-y-6">
      {breadcrumb}

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-emerald-600" />
        {translate("Kariah Registrations")}
      </h1>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        filters={[
          {
            type: "text",
            key: "fullname",
            value: tempFullName,
            onChange: setTempFullName,
            label: translate("Full Name"),
          },
          {
            type: "select",
            key: "status",
            value: String(tempStatus),
            onChange: (v) => setTempStatus(v || null),
            label: translate("Status"),
            options: QARIAH_STATUSES.map((s) => ({
              value: s,
              label: qariahStatusLabel(s),
            })),
          },
        ]}
      />

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Full Name")}</TableHead>
                <TableHead>{translate("IC No")}</TableHead>
                <TableHead>{translate("Contact")}</TableHead>
                <TableHead>{translate("Address")}</TableHead>
                <TableHead>{translate("Family Information")}</TableHead>
                <TableHead>{translate("Mosque")}</TableHead>
                <TableHead>{translate("Registered")}</TableHead>
                <TableHead className="text-center">
                  {translate("Status")}
                </TableHead>
                {canApprove && (
                  <TableHead className="text-center">
                    {translate("Action")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={9} />
              ) : items.length === 0 ? (
                <NoDataTableComponent colSpan={9} />
              ) : (
                items.map((member) => (
                  <TableRow
                    key={member.id}
                    className={
                      member.status === "pending"
                        ? "bg-amber-50 dark:bg-amber-900/10"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      <div>{member.fullname}</div>
                      {member.gender && (
                        <div className="text-xs font-normal text-slate-500">
                          {qariahGenderLabel(member.gender)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{member.icno}</TableCell>
                    <TableCell className="text-sm">
                      <div>{member.phoneno || "—"}</div>
                      {member.email && (
                        <div className="text-xs text-slate-500">
                          {member.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-[260px]">
                      {formatQariahAddress(member) || "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[220px]">
                      {formatQariahFamily(member) || "—"}
                    </TableCell>
                    <TableCell>{member.mosque?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {member.createdat
                        ? new Date(member.createdat).toLocaleDateString("ms-MY")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <QariahStatusBadge
                        status={member.status}
                        notes={member.notes}
                      />
                    </TableCell>
                    {canApprove && (
                      <TableCell className="text-center">
                        {member.status === "pending" && (
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMemberToApprove(member)}
                              title={translate("Approve")}
                              disabled={isMutating}
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMemberToReject(member)}
                              title={translate("Reject")}
                              disabled={isMutating}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: p.toString(),
              })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: "1",
              });
            }}
            totalItems={total}
          />
        )}
      </Card>

      <ConfirmDialog
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
