import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Search, ShieldAlert, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import Pagination from "@/components/Pagination";
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

  const handleReview = (id, action) => {
    let reviewnote = null;
    if (action === "rejected") {
      reviewnote = window.prompt("Rejection note (optional):") || null;
    }

    reviewMutation.mutate({ id, action, reviewnote });
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
                      {item.approvalstatus === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleReview(item.id, "approved")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {translate("Approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleReview(item.id, "rejected")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            {translate("Reject")}
                          </Button>
                        </div>
                      ) : (
                        "-"
                      )}
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
    </div>
  );
}
