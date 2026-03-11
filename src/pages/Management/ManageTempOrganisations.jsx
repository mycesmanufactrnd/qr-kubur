import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Eye, Search, ShieldAlert, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";

const statusOptions = ["pending", "approved", "rejected"];

export default function ManageTempOrganisations() {
  const { loadingUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();
  const trpcUtils = trpc.useUtils();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlName = searchParams.get("search") || "";
  const urlStatus = searchParams.get("status") || "pending";

  const [tempName, setTempName] = useState(urlName);
  const [tempStatus, setTempStatus] = useState(urlStatus);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    setTempName(urlName);
    setTempStatus(urlStatus);
  }, [urlName, urlStatus]);

  const {
    data,
    isLoading,
  } = trpc.tempOrganisation.getPaginated.useQuery(
    {
      page: urlPage,
      pageSize: itemsPerPage,
      filterName: urlName || undefined,
      filterStatus: urlStatus === "all" ? undefined : urlStatus,
    },
    { enabled: !!hasAdminAccess },
  );

  const reviewMutation = trpc.tempOrganisation.review.useMutation({
    onSuccess: (_, variables) => {
      showSuccess("Organisation registration", variables.action === "approved" ? "approve" : "deny");
      trpcUtils.tempOrganisation.getPaginated.invalidate();
      setRejectDialogOpen(false);
      setDetailsOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => showApiError(error),
  });

  const deleteMutation = trpc.tempOrganisation.delete.useMutation({
    onSuccess: () => {
      showSuccess("Organisation registration", "delete");
      trpcUtils.tempOrganisation.getPaginated.invalidate();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDetailsOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => showApiError(error),
  });

  const handleSearch = () => {
    const params = { page: "1", search: "", status: tempStatus || "pending" };
    if (tempName) params.search = tempName;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({ page: "1", status: "pending" });
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const handleApprove = () => {
    if (!selectedItem?.id) return;
    reviewMutation.mutate({ id: selectedItem.id, action: "approved", reviewnote: null });
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = (reason) => {
    if (!selectedItem?.id) return;
    reviewMutation.mutate({
      id: selectedItem.id,
      action: "rejected",
      reviewnote: reason ?? null,
    });
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete?.id) return;
    deleteMutation.mutate({ id: itemToDelete.id });
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          {
            label: isSuperAdmin ? translate("Super Admin Dashboard") : translate("Admin Dashboard"),
            page: isSuperAdmin ? "SuperadminDashboard" : "AdminDashboard",
          },
          { label: translate("Organisation Registrations"), page: "ManageTempOrganisations" },
        ]}
      />

      <div className="flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          {translate("Organisation Registrations")}
        </h1>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate("Search organisation name...")}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 px-6">
              {translate("Search")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={tempStatus} onValueChange={setTempStatus}>
              <SelectTrigger>
                <SelectValue placeholder={translate("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All")}</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" />
              {translate("Reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Name")}</TableHead>
                <TableHead className="text-center">{translate("Type")}</TableHead>
                <TableHead className="text-center">{translate("State")}</TableHead>
                <TableHead className="text-center">{translate("Contact Email")}</TableHead>
                <TableHead className="text-center">{translate("Status")}</TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.organisationtype?.name || "-"}</TableCell>
                    <TableCell className="text-center">{(item.states || []).join(", ") || "-"}</TableCell>
                    <TableCell className="text-center">{item.contactemail || "-"}</TableCell>
                    <TableCell className="text-center">{item.approvalstatus}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(item)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {translate("View")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {translate("Delete")}
                        </Button>
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
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setSearchParams({ ...Object.fromEntries(searchParams), page: "1" });
            }}
            totalItems={total}
          />
        )}
      </Card>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
          setDetailsOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translate("Organisation Registration Details")}</DialogTitle>
          </DialogHeader>
          {!selectedItem ? (
            <InlineLoadingComponent />
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  {translate("Organisation Details")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">{translate("Name")}</p>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Type")}</p>
                    <p className="font-medium">{selectedItem.organisationtype?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Approval Status")}</p>
                    <p className="font-medium capitalize">{selectedItem.approvalstatus}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Organisation Status")}</p>
                    <p className="font-medium capitalize">{selectedItem.status || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("States")}</p>
                    <p className="font-medium">{(selectedItem.states || []).join(", ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Address")}</p>
                    <p className="font-medium">{selectedItem.address || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Phone")}</p>
                    <p className="font-medium">{selectedItem.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Email")}</p>
                    <p className="font-medium">{selectedItem.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Website")}</p>
                    <p className="font-medium">{selectedItem.url || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Latitude")}</p>
                    <p className="font-medium">
                      {selectedItem.latitude != null ? selectedItem.latitude : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Longitude")}</p>
                    <p className="font-medium">
                      {selectedItem.longitude != null ? selectedItem.longitude : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Can Be Donated")}</p>
                    <p className="font-medium">{selectedItem.canbedonated ? translate("Yes") : translate("No")}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Can Manage Mosque")}</p>
                    <p className="font-medium">{selectedItem.canmanagemosque ? translate("Yes") : translate("No")}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  {translate("System Details")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">{translate("Submitted At")}</p>
                    <p className="font-medium">
                      {selectedItem.createdat ? new Date(selectedItem.createdat).toLocaleString() : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Reviewed At")}</p>
                    <p className="font-medium">
                      {selectedItem.reviewedat ? new Date(selectedItem.reviewedat).toLocaleString() : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Reviewed By User ID")}</p>
                    <p className="font-medium">{selectedItem.reviewedbyuserid ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Approved Organisation ID")}</p>
                    <p className="font-medium">{selectedItem.approvedorganisationid ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Approved Admin User ID")}</p>
                    <p className="font-medium">{selectedItem.approvedadminuserid ?? "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  {translate("Contact Details")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">{translate("Contact Name")}</p>
                    <p className="font-medium">{selectedItem.contactname || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Contact Email")}</p>
                    <p className="font-medium">{selectedItem.contactemail || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{translate("Contact Phone")}</p>
                    <p className="font-medium">{selectedItem.contactphoneno || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  {translate("Services")}
                </h3>
                {selectedItem.isgraveservices ? (
                  (selectedItem.serviceoffered || []).length > 0 ? (
                    <div className="space-y-2">
                      {(selectedItem.serviceoffered || []).map((service) => (
                        <div key={service} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{service}</span>
                          <span className="text-gray-600">
                            RM {Number(selectedItem.serviceprice?.[service] ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">{translate("No services listed")}</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">{translate("Not offering grave services")}</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  {translate("Payment Config Draft")}
                </h3>
                {(selectedItem.paymentconfigdraft || []).length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {selectedItem.paymentconfigdraft.map((config, index) => (
                      <div key={`${config.paymentPlatformId}-${config.paymentFieldId}-${index}`} className="text-gray-700">
                        {translate("Platform")} #{config.paymentPlatformId} · {translate("Field")} #{config.paymentFieldId} · {config.value}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">-</p>
                )}
              </div>

              {selectedItem.reviewnote && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                    {translate("Review Note")}
                  </h3>
                  <p className="text-sm text-gray-700">{selectedItem.reviewnote}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              {translate("Close")}
            </Button>
            {selectedItem?.approvalstatus === "pending" && (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleApprove}
                  disabled={reviewMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {translate("Approve")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={reviewMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  {translate("Reject")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title={translate("Reject Organisation Registration")}
        description={translate("Are you sure you want to reject this registration?")}
        onConfirm={handleRejectConfirm}
        confirmText={translate("Reject")}
        variant="destructive"
        showReasonInput
        reasonLabel={translate("Rejection Note (optional)")}
        reasonPlaceholder={translate("Add a note for rejection")}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Organisation Registration")}
        description={`${translate("Delete")} "${itemToDelete?.name ?? ""}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </div>
  );
}
