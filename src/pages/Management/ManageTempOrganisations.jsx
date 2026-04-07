import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Check,
  Clock,
  CreditCard,
  Eye,
  MessageSquare,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

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

  function Section({ icon, title, children }) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400">{icon}</span>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
        {children}
      </section>
    );
  }

  function FieldGrid({ children }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>
    );
  }

  function Field({ label, value, valueClass = "" }) {
    return (
      <div className="bg-gray-50 rounded-lg px-3 py-2.5">
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-gray-800 ${valueClass}`}>
          {value != null && value !== "" ? value : "-"}
        </p>
      </div>
    );
  }

  useEffect(() => {
    setTempName(urlName);
    setTempStatus(urlStatus);
  }, [urlName, urlStatus]);

  const { data, isLoading } = trpc.tempOrganisation.getPaginated.useQuery(
    {
      page: urlPage,
      pageSize: itemsPerPage,
      filterName: urlName || undefined,
      filterStatus: urlStatus === "all" ? undefined : urlStatus,
    },
    { enabled: !!hasAdminAccess },
  );

  const { data: paymentPlatforms = [] } =
    trpc.paymentPlatform.getActivePlatform.useQuery(undefined, {
      enabled: detailsOpen,
    });

  const paymentPlatformById = useMemo(() => {
    const map = new Map();
    paymentPlatforms.forEach((platform) => {
      if (platform?.id != null) {
        map.set(platform.id, platform);
      }
    });
    return map;
  }, [paymentPlatforms]);

  const paymentFieldById = useMemo(() => {
    const map = new Map();
    paymentPlatforms.forEach((platform) => {
      (platform.paymentfields || []).forEach((field) => {
        if (field?.id != null) {
          map.set(field.id, field);
        }
      });
    });
    return map;
  }, [paymentPlatforms]);

  const reviewMutation = trpc.tempOrganisation.review.useMutation({
    onSuccess: (_, variables) => {
      showSuccess(
        "Organisation registration",
        variables.action === "approved" ? "approve" : "deny",
      );
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
    reviewMutation.mutate({
      id: selectedItem.id,
      action: "approved",
      reviewnote: null,
    });
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
            label: isSuperAdmin
              ? translate("Super Admin Dashboard")
              : translate("Admin Dashboard"),
            page: isSuperAdmin ? "SuperadminDashboard" : "AdminDashboard",
          },
          {
            label: translate("Organisation Registrations"),
            page: "ManageTempOrganisations",
          },
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
            <Button
              onClick={handleSearch}
              className="bg-violet-600 hover:bg-violet-700 px-6"
            >
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
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
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
                <TableHead className="text-center">
                  {translate("Type")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("State")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Contact Email")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Status")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
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
                    <TableCell className="text-center">
                      {item.organisationtype?.name || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {(item.states || []).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.contactemail || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.approvalstatus}
                    </TableCell>
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
            onPageChange={(p) =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: p.toString(),
              })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: "1",
              });
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="flex-row items-start gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-0">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-[18px] h-[18px] text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-medium leading-tight truncate">
                {selectedItem?.name ??
                  translate("Organisation Registration Details")}
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {translate("Organisation registration details")}
              </p>
            </div>
            {selectedItem?.approvalstatus && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  selectedItem.approvalstatus === "approved"
                    ? "bg-emerald-50 text-emerald-800"
                    : selectedItem.approvalstatus === "rejected"
                      ? "bg-red-50 text-red-800"
                      : "bg-amber-50 text-amber-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedItem.approvalstatus === "approved"
                      ? "bg-emerald-500"
                      : selectedItem.approvalstatus === "rejected"
                        ? "bg-red-500"
                        : "bg-amber-400"
                  }`}
                />
                {selectedItem.approvalstatus}
              </span>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {!selectedItem ? (
              <InlineLoadingComponent />
            ) : (
              <>
                {/* Organisation Details */}
                <Section
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  title={translate("Organisation details")}
                >
                  <FieldGrid>
                    <Field
                      label={translate("Name")}
                      value={selectedItem.name}
                    />
                    <Field
                      label={translate("Type")}
                      value={selectedItem.organisationtype?.name}
                    />
                    <Field
                      label={translate("States")}
                      value={(selectedItem.states || []).join(", ")}
                    />
                    <Field
                      label={translate("Address")}
                      value={selectedItem.address}
                    />
                    <Field
                      label={translate("Phone")}
                      value={selectedItem.phone}
                    />
                    <Field
                      label={translate("Email")}
                      value={selectedItem.email}
                    />
                    <Field
                      label={translate("Website")}
                      value={selectedItem.url}
                    />
                    <Field
                      label={translate("Latitude")}
                      value={selectedItem.latitude}
                    />
                    <Field
                      label={translate("Longitude")}
                      value={selectedItem.longitude}
                    />
                    <Field
                      label={translate("Can be donated")}
                      value={
                        selectedItem.canbedonated
                          ? translate("Yes")
                          : translate("No")
                      }
                      valueClass={
                        selectedItem.canbedonated
                          ? "text-emerald-700"
                          : "text-gray-500"
                      }
                    />
                    <Field
                      label={translate("Can manage mosque")}
                      value={
                        selectedItem.canmanagemosque
                          ? translate("Yes")
                          : translate("No")
                      }
                      valueClass={
                        selectedItem.canmanagemosque
                          ? "text-emerald-700"
                          : "text-gray-500"
                      }
                    />
                  </FieldGrid>
                </Section>

                {/* Contact Details */}
                <Section
                  icon={<User className="w-3.5 h-3.5" />}
                  title={translate("Contact details")}
                >
                  <FieldGrid>
                    <Field
                      label={translate("Contact name")}
                      value={selectedItem.contactname}
                    />
                    <Field
                      label={translate("Contact email")}
                      value={selectedItem.contactemail}
                    />
                    <Field
                      label={translate("Contact phone")}
                      value={selectedItem.contactphoneno}
                    />
                  </FieldGrid>
                </Section>

                {/* System Details */}
                <Section
                  icon={<Clock className="w-3.5 h-3.5" />}
                  title={translate("System details")}
                >
                  <FieldGrid>
                    <Field
                      label={translate("Submitted at")}
                      value={
                        selectedItem.createdat
                          ? new Date(selectedItem.createdat).toLocaleString()
                          : null
                      }
                    />
                    <Field
                      label={translate("Reviewed at")}
                      value={
                        selectedItem.reviewedat
                          ? new Date(selectedItem.reviewedat).toLocaleString()
                          : null
                      }
                    />
                    <Field
                      label={translate("Reviewed by user ID")}
                      value={selectedItem.reviewedbyuserid}
                    />
                    <Field
                      label={translate("Approved organisation ID")}
                      value={selectedItem.approvedorganisationid}
                    />
                    <Field
                      label={translate("Approved admin user ID")}
                      value={selectedItem.approvedadminuserid}
                    />
                  </FieldGrid>
                </Section>

                {/* Services */}
                <Section
                  icon={<Wrench className="w-3.5 h-3.5" />}
                  title={translate("Services")}
                >
                  {selectedItem.isgraveservices ? (
                    (selectedItem.serviceoffered || []).length > 0 ? (
                      <div className="rounded-lg border border-gray-100 overflow-hidden">
                        {(selectedItem.serviceoffered || []).map(
                          (service, i) => (
                            <div
                              key={service}
                              className={`flex items-center justify-between px-3 py-2.5 text-sm ${
                                i > 0 ? "border-t border-gray-100" : ""
                              }`}
                            >
                              <span className="font-medium text-gray-700">
                                {service}
                              </span>
                              <span className="text-gray-500 font-mono text-xs">
                                RM{" "}
                                {Number(
                                  selectedItem.serviceprice?.[service] ?? 0,
                                ).toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        {translate("No services listed")}
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-400">
                      {translate("Not offering grave services")}
                    </p>
                  )}
                </Section>

                {/* Payment Config */}
                {(selectedItem.paymentconfigdraft || []).length > 0 && (
                  <Section
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                    title={translate("Payment config")}
                  >
                    <div className="space-y-3">
                      {Array.from(
                        selectedItem.paymentconfigdraft.reduce(
                          (map, config) => {
                            const platform = paymentPlatformById.get(
                              config.paymentPlatformId,
                            );
                            const key =
                              platform?.name ?? `#${config.paymentPlatformId}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(config);
                            return map;
                          },
                          new Map(),
                        ),
                      ).map(([platformName, configs], idx) => (
                        <div
                          key={platformName + idx}
                          className="rounded-lg border border-gray-100 overflow-hidden"
                        >
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500">
                              {translate("Platform")}: {platformName}
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {configs.map((config, i) => {
                              const field = paymentFieldById.get(
                                config.paymentFieldId,
                              );
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between px-3 py-2.5 text-sm"
                                >
                                  <span className="text-gray-500">
                                    {field?.label ??
                                      `#${config.paymentFieldId}`}
                                  </span>
                                  <span className="font-mono text-xs text-gray-700">
                                    {config.value}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {selectedItem.reviewnote && (
                  <Section
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                    title={translate("Review note")}
                  >
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                      {selectedItem.reviewnote}
                    </p>
                  </Section>
                )}
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-white flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsOpen(false)}
            >
              {translate("Close")}
            </Button>
            {selectedItem?.approvalstatus === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={reviewMutation.isPending}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {translate("Reject")}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleApprove}
                  disabled={reviewMutation.isPending}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {translate("Approve")}
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
        description={translate(
          "Are you sure you want to reject this registration?",
        )}
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
