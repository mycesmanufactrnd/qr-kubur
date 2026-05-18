// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
import MobileManageDeadPersons from "@/pages/Mobile/ManageDeadPersons";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  MapPin,
  QrCode,
  Upload,
  Download,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SearchBar from "@/components/forms/SearchBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCodeDialog from "@/components/QRCodeDialog";
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
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { showSuccess, showError } from "@/components/ToastrNotification";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { translate } from "@/utils/translations";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import { STATES_MY } from "@/utils/enums";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetDeadPersonPaginated,
  useDeadPersonMutations,
} from "@/hooks/useDeadPersonMutations";
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import { trpc } from "@/utils/trpc";
import { defaultDeadPersonField } from "@/utils/defaultformfields";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import TextInputForm from "@/components/forms/TextInputForm";
import { useForm } from "react-hook-form";
import SelectForm from "@/components/forms/SelectForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";

export default function ManageDeadPersons() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileManageDeadPersons />;
  return <ManageDeadPersonsDesktop />;
}

function ManageDeadPersonsDesktop() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } =
    useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlName = searchParams.get("name") || "";
  const urlIC = searchParams.get("ic") || "";
  const urlGrave = searchParams.get("grave") || "all";
  const urlState = searchParams.get("state") || "all";
  const urlDateFrom = searchParams.get("dateFrom") || "";
  const urlDateTo = searchParams.get("dateTo") || "";

  const [tempName, setTeampName] = useState(urlName);
  const [tempIC, setTempIC] = useState(urlIC);
  const [tempGrave, setTempGrave] = useState(urlGrave);
  const [tempState, setTempState] = useState(urlState);
  const [tempDateFrom, setTempDateFrom] = useState(urlDateFrom);
  const [tempDateTo, setTempDateTo] = useState(urlDateTo);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultDeadPersonField,
  });

  const [uploading, setUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrPerson, setQRPerson] = useState({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);

  const DEAD_PERSON_TEMPLATE_HEADERS = [
    "name",
    "icnumber",
    "dateofbirth",
    "dateofdeath",
    "causeofdeath",
    "grave_id",
    "latitude",
    "longitude",
    "biography",
  ];

  const downloadDeadPersonTemplate = () => {
    const csv = DEAD_PERSON_TEMPLATE_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deceased_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadFileDrop = (e) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer?.files?.[0] ?? e.target?.files?.[0];
    if (file) setUploadFile(file);
  };

  const handleSaveUpload = () => {
    console.log("Uploaded file:", uploadFile);
  };
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("dead_persons");

  useEffect(() => {
    setTeampName(urlName);
    setTempIC(urlIC);
    setTempGrave(urlGrave);
    setTempState(urlState);
    setTempDateFrom(urlDateFrom);
    setTempDateTo(urlDateTo);
  }, [urlName, urlIC, urlGrave, urlState, urlDateFrom, urlDateTo]);

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    {
      organisationId: currentUser?.organisation?.id,
      isIdOnly: true,
    },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin },
  );

  useEffect(() => {
    if (parentAndChildQuery && parentAndChildQuery.data) {
      setAccessibleOrgIds(parentAndChildQuery?.data ?? []);
    }
  }, [parentAndChildQuery && parentAndChildQuery]);

  const {
    deadPersonsList,
    totalPages,
    isLoading: isLoadingDeadPerson,
  } = useGetDeadPersonPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterIC: urlIC,
    filterGrave: urlGrave === "all" ? undefined : Number(urlGrave),
    filterState: urlState === "all" ? undefined : urlState,
    dateFrom: urlDateFrom,
    dateTo: urlDateTo,
    organisationIds: accessibleOrgIds,
  });

  const { gravesList } = useGetGravePaginated({
    organisationIds: accessibleOrgIds,
  });

  const { createDeadPerson, updateDeadPerson, deleteDeadPerson } =
    useDeadPersonMutations();

  const handleSearch = () => {
    const params = {
      page: "1",
      name: "",
      ic: "",
      grave: "",
      state: "",
      dateFrom: "",
      dateTo: "",
    };
    if (tempName) params.name = tempName;
    if (tempIC) params.ic = tempIC;
    if (tempGrave !== "all") params.grave = tempGrave;
    if (tempState !== "all") params.state = tempState;
    if (tempDateFrom) params.dateFrom = tempDateFrom;
    if (tempDateTo) params.dateTo = tempDateTo;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingPerson(null);
    reset(defaultDeadPersonField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (person) => {
    setEditingPerson(person);
    reset({
      ...person,
      grave: person.grave?.id.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      grave: formData.grave ? { id: Number(formData.grave) } : null,
    };

    try {
      if (editingPerson) {
        await updateDeadPerson.mutateAsync({
          id: editingPerson.id,
          data: submitData,
        });
      } else {
        await createDeadPerson.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {}
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      appendCurrentUserToFormData(formDataUpload);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }

      const data = await res.json();
      showSuccess("Photo uploaded");

      return data.file_url;
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      await deleteDeadPerson.mutateAsync(personToDelete.id);
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    } catch (error) {}
  };

  if (loadingUser || permissionsLoading) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Admin Dashboard"), page: "AdminDashboard" },
            { label: translate("Manage Deceased"), page: "ManageDeadPersons" },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Manage Deceased"), page: "ManageDeadPersons" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          {translate("Manage Deceased")}
        </h1>

        {canCreate && (
          <div>
            <Button
              onClick={() => {
                setUploadFile(null);
                setUploadDialogOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 mr-2 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {translate("Upload New")}
            </Button>
            <Button
              onClick={openAddDialog}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {translate("Add New")}
            </Button>
          </div>
        )}
      </div>

      <SearchBar
        value={tempName}
        onChange={setTeampName}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder={translate("Full Name")}
        buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
        filtersClassName="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        {isSuperAdmin && (
          <Select
            value={tempState}
            onValueChange={(v) => {
              setTempState(v);
              setTempGrave("all");
            }}
          >
            <SelectTrigger className="bg-transparent border-white text-white hover:bg-white/10 focus:ring-0">
              <SelectValue placeholder="Negeri" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="all" className="focus:bg-white/10">
                {translate("All States")}
              </SelectItem>
              {STATES_MY.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-white/10">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          placeholder={translate("IC No")}
          value={tempIC}
          onChange={(e) => setTempIC(e.target.value)}
          className="dark:border-white"
        />

        <Select value={tempGrave} onValueChange={setTempGrave}>
          <SelectTrigger className="bg-transparent dark:border-white dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("Cemetery")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all" className="focus:bg-white/10">
              {translate("All cemeteries")}
            </SelectItem>
            {gravesList.items.map((g) => (
              <SelectItem
                key={g.id}
                value={String(g.id)}
                className="focus:bg-white/10"
              >
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={tempDateFrom}
          onChange={(e) => setTempDateFrom(e.target.value)}
          className="dark:border-white"
        />
        <Input
          type="date"
          value={tempDateTo}
          onChange={(e) => setTempDateTo(e.target.value)}
          className="dark:border-white"
        />
      </SearchBar>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Full Name")}</TableHead>
                <TableHead className="text-center">
                  {translate("IC No.")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Date of Death")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Cemetery Name")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Image")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDeadPerson ? (
                <InlineLoadingComponent isTable={true} colSpan={5} />
              ) : deadPersonsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={5} />
              ) : (
                deadPersonsList.items.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="text-center">
                      {person.icnumber || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {person.dateofdeath
                        ? new Date(person.dateofdeath).toLocaleDateString(
                            "ms-MY",
                          )
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {person.grave?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <img
                        src={resolveFileUrl(person.photourl, "dead-person")}
                        alt="photo"
                        className="w-12 h-10 object-cover rounded mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(person)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPersonToDelete(person);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQRPerson({ type: "deadperson", id: person.id });
                          setQRDialogOpen(true);
                        }}
                      >
                        <QrCode className="w-4 h-4 text-green-500" />
                      </Button>
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
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: "1",
              });
            }}
            totalItems={deadPersonsList.total}
          />
        )}
      </Card>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) setUploadFile(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("Upload Deceased via CSV")}</DialogTitle>
            <DialogDescription>
              {translate(
                "Download the template, fill in the data, then upload the file.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/50">
              <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <FileText className="w-4 h-4 text-stone-400" />
                <span className="font-medium">{translate("CSV Template")}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  ({DEAD_PERSON_TEMPLATE_HEADERS.length} {translate("columns")})
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadDeadPersonTemplate}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                {translate("Download")}
              </Button>
            </div>

            <label
              htmlFor="deceased-csv-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setUploadDragOver(true);
              }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleUploadFileDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors p-8 ${
                uploadDragOver
                  ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/20"
                  : uploadFile
                    ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-600 dark:hover:bg-stone-800"
              }`}
            >
              <input
                id="deceased-csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUploadFileDrop}
              />
              {uploadFile ? (
                <>
                  <FileText className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-emerald-500">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setUploadFile(null);
                    }}
                    className="text-xs text-stone-400 hover:text-stone-600 underline mt-1 dark:text-stone-500 dark:hover:text-stone-300"
                  >
                    {translate("Remove")}
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-stone-300" />
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
                    {translate("Click or drag & drop your CSV file here")}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    .csv {translate("files only")}
                  </p>
                </>
              )}
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFile(null);
              }}
            >
              {translate("Cancel")}
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!uploadFile}
              onClick={handleSaveUpload}
            >
              <Save className="w-4 h-4 mr-2" />
              {translate("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[50vw] max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPerson ? translate("edit") : translate("Add New")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              required
              errors={errors}
            />
            <TextInputForm
              name="icnumber"
              control={control}
              label={translate("IC No.")}
              required
              errors={errors}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="dateofbirth"
                control={control}
                label={translate("Date of Birth")}
                isDate
                required
                errors={errors}
              />
              <TextInputForm
                name="dateofdeath"
                control={control}
                label={translate("Date of Death")}
                isDate
                required
                errors={errors}
              />
            </div>
            <TextInputForm
              name="causeofdeath"
              control={control}
              label={translate("Cause of Death")}
            />
            <SelectForm
              name="grave"
              control={control}
              label={translate("Grave")}
              placeholder={translate("Select Grave")}
              options={gravesList.items.map((grave) => ({
                value: grave.id,
                label: grave.name,
              }))}
              required
              errors={errors}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="latitude"
                control={control}
                label={translate("Latitude")}
                isNumber
                required
                errors={errors}
              />
              <TextInputForm
                name="longitude"
                control={control}
                label={translate("Longitude")}
                isNumber
                required
                errors={errors}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-blue-600 text-white"
              onClick={() => {
                if (!navigator.geolocation) return;
                setIsLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setValue("latitude", pos.coords.latitude.toFixed(16));
                    setValue("longitude", pos.coords.longitude.toFixed(16));
                    setIsLocating(false);
                  },
                  () => {
                    setIsLocating(false);
                  },
                );
              }}
              disabled={isLocating}
            >
              <MapPin className="w-4 h-4 mr-2" />{" "}
              {isLocating
                ? translate("Getting location...")
                : translate("Get Current Location")}
            </Button>
            <TextInputForm
              name="biography"
              control={control}
              label={translate("Biography")}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="heirname"
                control={control}
                label={translate("Nama Waris")}
                errors={errors}
              />
              <TextInputForm
                name="heirphoneno"
                control={control}
                label={translate("No. Tel. Waris")}
                errors={errors}
              />
            </div>
            <FileUploadForm
              name="photourl"
              control={control}
              label={translate("Photo")}
              required
              errors={errors}
              bucketName="dead-person"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createDeadPerson.isPending ||
                  updateDeadPerson.isPending ||
                  isSubmitting
                }
                className="bg-blue-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {translate("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("delete")}
        description={`Padam rekod "${personToDelete?.name}"?`}
        onConfirm={confirmDelete}
        variant="destructive"
      />
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        data={qrPerson}
      />
    </div>
  );
}
