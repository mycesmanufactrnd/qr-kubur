// @ts-nocheck
import { useState, useEffect } from "react";
import { translate } from "@/utils/translations";
import { useForm } from "react-hook-form";
import {
  Building2, Plus, Edit, Trash2, Save, MapPin, X,
} from "lucide-react";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import { useCrudPermissions } from "@/components/PermissionsContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { getLabelFromId, hashPassword } from "@/utils/helpers";
import { ActiveInactiveStatus, STATES_MY } from "@/utils/enums";
import { useAdminAccess } from "@/utils/auth";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import { useGetOrganisationTypePaginated } from "@/hooks/useOrganisationTypeMutations";
import {
  useGetOrganisationPaginated,
  useOrganisationMutations,
} from "@/hooks/useOrganisationMutations";
import { useUserMutations } from "@/hooks/useUserMutations";
import { defaultOrganisationField } from "@/utils/defaultformfields";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { showError, showSuccess } from "@/components/ToastrNotification";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";

const DEFAULT_USER_PASSWORD = "password";

export default function MobileManageOrganisation() {
  const {
    currentUser, loadingUser, hasAdminAccess, isSuperAdmin, isAdmin, currentUserStates,
  } = useAdminAccess();

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("organisations");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedFilterType, setAppliedFilterType] = useState("all");
  const [appliedFilterState, setAppliedFilterState] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [serviceEntries, setServiceEntries] = useState([]);
  const [userEntries, setUserEntries] = useState([]);
  const [editingUserIndex, setEditingUserIndex] = useState(null);

  const {
    control, handleSubmit, reset, setValue, watch, getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: defaultOrganisationField });

  const isGraveServicesChecked = watch("isgraveservices");
  const canAddOrgUsers = isSuperAdmin || isAdmin;

  const { organisationsList, totalPages, isLoading } = useGetOrganisationPaginated({
    page,
    pageSize,
    filterName: appliedSearch,
    filterType: appliedFilterType === "all" ? undefined : Number(appliedFilterType),
    filterState: appliedFilterState === "all" ? undefined : appliedFilterState,
  });

  const { organisationTypeList = [] } = useGetOrganisationTypePaginated({});
  const { createOrganisation, updateOrganisation, deleteOrganisation } = useOrganisationMutations();
  const { createUser } = useUserMutations();

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [sheetOpen]);

  const currentOrgType = currentUser?.organisation?.organisationtype ?? null;
  const restrictedOrgTypeNames = new Set([
    "Syarikat Swasta", "Persatuan Sukarelawan", "Pertubuhan Kebajikan (NGO)",
  ]);
  const isRestrictedOrgType =
    !!currentOrgType?.name && restrictedOrgTypeNames.has(currentOrgType.name);

  const organisationTypeOptions = isSuperAdmin
    ? organisationTypeList.items.map((t) => ({ value: t.id, label: t.name }))
    : currentOrgType?.id
      ? [{ value: currentOrgType.id, label: currentOrgType.name || String(currentOrgType.id) }]
      : [];

  const userRoleOptions = [
    { value: "admin", label: translate("Admin") },
    { value: "employee", label: translate("Employee") },
  ];

  /* ── service entry helpers ── */
  const syncServiceDraftToForm = (entries) => {
    const normalized = [];
    const seen = new Set();
    for (const entry of entries) {
      const service = (entry.service || "").trim();
      if (!service) continue;
      const key = service.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push({
        service,
        price: entry.price === "" ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }
    setValue("serviceoffered", normalized.map((i) => i.service));
    setValue("serviceprice", Object.fromEntries(normalized.map((i) => [i.service, Number(i.price) || 0])));
  };

  const addServiceEntry = () => {
    const next = [
      ...serviceEntries,
      { id: `${Date.now()}-${Math.random()}`, service: "", price: "", isactive: true },
    ];
    setServiceEntries(next);
    syncServiceDraftToForm(next);
  };

  const updateServiceEntry = (id, field, val) => {
    const next = serviceEntries.map((e) => e.id === id ? { ...e, [field]: val } : e);
    setServiceEntries(next);
    syncServiceDraftToForm(next);
  };

  const removeServiceEntry = (id) => {
    const next = serviceEntries.filter((e) => e.id !== id);
    setServiceEntries(next);
    syncServiceDraftToForm(next);
  };

  /* ── user entry helpers ── */
  const resetUserFields = () => {
    setValue("user_fullname", "");
    setValue("user_username", "");
    setValue("user_phoneno", "");
    setValue("user_role", "admin");
    setEditingUserIndex(null);
  };

  const handleAddOrUpdateUser = () => {
    const fullname = (getValues("user_fullname") || "").trim();
    const username = (getValues("user_username") || "").trim();
    const phoneno = (getValues("user_phoneno") || "").trim();
    const role = getValues("user_role") || "admin";
    if (!fullname && !username && !phoneno) {
      showError("Please fill in user details before adding.");
      return;
    }
    if (!fullname || !username) {
      showError("Full Name and Username are required.");
      return;
    }
    if (editingUserIndex !== null) {
      setUserEntries((prev) =>
        prev.map((e, i) =>
          i === editingUserIndex ? { ...e, fullname, username, phoneno, role } : e,
        ),
      );
      resetUserFields();
      return;
    }
    setUserEntries((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, fullname, username, phoneno, role },
    ]);
    resetUserFields();
  };

  const buildUserPayload = async ({ fullname, username, phoneno, role, states, organisationId }) => {
    const f = (fullname || "").trim();
    const u = (username || "").trim();
    if (!f || !u) { showError("Full Name and Username are required."); return null; }
    if (!organisationId) { showError("Organisation is required."); return null; }
    return {
      fullname: f,
      email: u,
      phoneno: (phoneno || "").trim(),
      role: role || "admin",
      organisation: { id: Number(organisationId) },
      tahfizcenter: null,
      states: (Array.isArray(states) ? states : [states]).filter(Boolean),
      password: await hashPassword(DEFAULT_USER_PASSWORD),
    };
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      appendCurrentUserToFormData(fd);
      const res = await fetch(`/api/upload/${bucketName}`, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showError(d.error || "Failed to upload photo");
        return null;
      }
      const data = await res.json();
      showSuccess("Photo uploaded");
      return data.file_url;
    } catch {
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const openAddSheet = () => {
    setEditingOrg(null);
    const defaultState = isSuperAdmin ? "" : currentUserStates[0] || "";
    const defaultOrgType =
      !isSuperAdmin && isRestrictedOrgType && currentOrgType?.id
        ? currentOrgType.id.toString()
        : "";
    reset({ ...defaultOrganisationField, states: defaultState, organisationtype: defaultOrgType });
    setServiceEntries([]);
    setUserEntries([]);
    resetUserFields();
    setSheetOpen(true);
  };

  const openEditSheet = (org) => {
    setEditingOrg(org);
    const relationalServices = Array.isArray(org.services) ? org.services : [];
    const serviceoffered =
      relationalServices.length > 0
        ? relationalServices.map((s) => s.service)
        : org.serviceoffered || [];
    const serviceprice =
      relationalServices.length > 0
        ? Object.fromEntries(
            relationalServices.map((s) => [
              s.service,
              s.price ? parseFloat(Number(s.price).toFixed(2)) : 0,
            ]),
          )
        : org.serviceprice || {};

    reset({
      ...org,
      parentorganisation: org.parentorganisation?.id.toString() || "",
      organisationtype: org.organisationtype?.id.toString() || "",
      serviceoffered,
      serviceprice,
      states: Array.isArray(org.states) ? org.states[0] : org.states || "",
      status: org.status || ActiveInactiveStatus.ACTIVE,
      user_fullname: "",
      user_username: "",
      user_phoneno: "",
      user_role: "admin",
    });

    const nextEntries =
      relationalServices.length > 0
        ? relationalServices.map((s, idx) => ({
            id: `${Date.now()}-${idx}`,
            service: s.service,
            price: (s.price ? parseFloat(Number(s.price).toFixed(2)) : 0).toString(),
            isactive: s.isactive !== false,
          }))
        : serviceoffered.map((s, idx) => ({
            id: `${Date.now()}-${idx}`,
            service: s,
            price: (serviceprice[s] ?? 0).toString(),
            isactive: true,
          }));

    setServiceEntries(nextEntries);
    setUserEntries([]);
    resetUserFields();
    setSheetOpen(true);
  };

  const onSubmit = async (formData) => {
    const normalizedServices = [];
    const seen = new Set();
    for (const entry of serviceEntries) {
      const service = (entry.service || "").trim();
      if (!service) continue;
      const key = service.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      normalizedServices.push({
        service,
        price: entry.price === "" ? 0 : parseFloat(Number(entry.price).toFixed(2)),
        isactive: entry.isactive !== false,
      });
    }

    if (canAddOrgUsers && editingUserIndex !== null) {
      showError("Please finish editing the user entry before saving.");
      return;
    }

    const {
      serviceoffered: _s, serviceprice: _p,
      user_fullname, user_username, user_phoneno, user_role,
      ...restFormData
    } = formData;

    const submitData = {
      ...restFormData,
      parentorganisation: formData.parentorganisation
        ? { id: Number(formData.parentorganisation) }
        : null,
      organisationtype: formData.organisationtype
        ? { id: Number(formData.organisationtype) }
        : null,
      states: Array.isArray(formData.states) ? formData.states : [formData.states],
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      services: normalizedServices.map((s) => ({
        service: s.service,
        price: Number(s.price) || 0,
        isactive: s.isactive,
        organisation: editingOrg ? { id: Number(editingOrg.id) } : null,
        tahfizcenter: null,
      })),
    };

    try {
      const res = editingOrg
        ? await updateOrganisation.mutateAsync({ id: editingOrg.id, data: submitData })
        : await createOrganisation.mutateAsync(submitData);

      const organisationId = editingOrg?.id ?? res?.id;

      if (canAddOrgUsers && organisationId) {
        const pendingEntry = {
          fullname: (user_fullname || "").trim(),
          username: (user_username || "").trim(),
          phoneno: (user_phoneno || "").trim(),
          role: user_role || "admin",
        };
        const hasPending =
          pendingEntry.fullname || pendingEntry.username || pendingEntry.phoneno;
        if (hasPending && (!pendingEntry.fullname || !pendingEntry.username)) {
          showError("Full Name and Username are required.");
          return;
        }
        const toCreate = [...userEntries, ...(hasPending ? [pendingEntry] : [])];
        for (const entry of toCreate) {
          const payload = await buildUserPayload({
            fullname: entry.fullname,
            username: entry.username,
            phoneno: entry.phoneno,
            role: entry.role,
            states: formData.states,
            organisationId,
          });
          if (payload) await createUser.mutateAsync(payload);
        }
      }

      if (res || editingOrg) {
        setSheetOpen(false);
        reset(defaultOrganisationField);
        setUserEntries([]);
        resetUserFields();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6 dark:bg-slate-900">
        <BackNavigation title={translate("Manage Organisations")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Filter + Add */}
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                { label: translate("Name"), type: "text", searchColumn: "name" },
                { label: translate("Type"), type: "select", searchColumn: "type", options: organisationTypeOptions.map((t) => ({ id: String(t.value), name: t.label })) },
                ...(isSuperAdmin ? [{ label: translate("State"), type: "select", searchColumn: "state", options: STATES_MY.map((s) => ({ id: s, name: s })) }] : []),
              ]}
              onApplyFilter={(f) => {
                setAppliedSearch(f.name || "");
                setAppliedFilterType(f.type || "all");
                setAppliedFilterState(f.state || "all");
                setPage(1);
              }}
            />
            {canCreate && (
              <button
                onClick={openAddSheet}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <InlineLoadingComponent />
          ) : organisationsList.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
              <Building2 className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {organisationsList.items.map((org) => (
                <OrgCard
                  key={org.id}
                  org={org}
                  organisationTypeList={organisationTypeList}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => openEditSheet(org)}
                  onDelete={() => { setOrgToDelete(org); setDeleteDialogOpen(true); }}
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
                itemsPerPage={pageSize}
                onItemsPerPageChange={() => {}}
                totalItems={organisationsList.total}
              />
            </div>
          )}
        </div>
      </div>

      {sheetOpen && (
        <OrgFormSheet
          editingOrg={editingOrg}
          control={control}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          onClose={() => setSheetOpen(false)}
          errors={errors}
          isSubmitting={isSubmitting}
          uploading={uploading}
          isLocating={isLocating}
          setIsLocating={setIsLocating}
          setValue={setValue}
          getValues={getValues}
          isGraveServicesChecked={isGraveServicesChecked}
          serviceEntries={serviceEntries}
          addServiceEntry={addServiceEntry}
          updateServiceEntry={updateServiceEntry}
          removeServiceEntry={removeServiceEntry}
          organisationTypeOptions={organisationTypeOptions}
          organisationsList={organisationsList}
          isSuperAdmin={isSuperAdmin}
          currentUserStates={currentUserStates}
          handleFileUpload={handleFileUpload}
          canAddOrgUsers={canAddOrgUsers}
          userEntries={userEntries}
          setUserEntries={setUserEntries}
          editingUserIndex={editingUserIndex}
          setEditingUserIndex={setEditingUserIndex}
          handleAddOrUpdateUser={handleAddOrUpdateUser}
          resetUserFields={resetUserFields}
          userRoleOptions={userRoleOptions}
          createOrganisation={createOrganisation}
          updateOrganisation={updateOrganisation}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (orgToDelete) {
            deleteOrganisation.mutate(orgToDelete.id);
            setDeleteDialogOpen(false);
            setOrgToDelete(null);
          }
        }}
        title={translate("Delete")}
        description={translate("Confirm delete")}
        variant="destructive"
      />
    </>
  );
}

function OrgCard({ org, organisationTypeList, canEdit, canDelete, onEdit, onDelete }) {
  const typeName = getLabelFromId(organisationTypeList.items, org.organisationtype?.id);
  const states = Array.isArray(org.states) ? org.states.join(", ") : org.states;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        <img
          src={resolveFileUrl(org.photourl, "bucket-organisation")}
          alt={org.name}
          className="w-16 h-16 object-cover rounded-xl shrink-0 bg-slate-100 dark:bg-slate-700"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{org.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {typeName && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">{typeName}</Badge>
            )}
            {states && <span className="text-xs text-slate-400 dark:text-slate-500">{states}</span>}
          </div>
          {org.serviceoffered?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {org.serviceoffered.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-xs px-1.5 py-0">{s}</Badge>
              ))}
              {org.serviceoffered.length > 3 && (
                <span className="text-xs text-slate-400">+{org.serviceoffered.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        {canEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
          >
            <Edit className="w-3.5 h-3.5" />
            {translate("Edit")}
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {translate("Delete")}
          </button>
        )}
      </div>
    </div>
  );
}

function OrgFormSheet({
  editingOrg, control, handleSubmit, onSubmit, onClose, errors, isSubmitting, uploading,
  isLocating, setIsLocating, setValue, getValues, isGraveServicesChecked,
  serviceEntries, addServiceEntry, updateServiceEntry, removeServiceEntry,
  organisationTypeOptions, organisationsList, isSuperAdmin, currentUserStates,
  handleFileUpload, canAddOrgUsers, userEntries, setUserEntries, editingUserIndex,
  setEditingUserIndex, handleAddOrUpdateUser, resetUserFields, userRoleOptions,
  createOrganisation, updateOrganisation,
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex-1 text-base">
          {editingOrg ? translate("Edit Organisation") : translate("Add Organisation")}
        </h2>
        <Button
          onClick={handleSubmit(onSubmit)}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700"
          disabled={
            isSubmitting || uploading ||
            createOrganisation.isPending || updateOrganisation.isPending
          }
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          {translate("Save")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Organisation Details */}
        <FormSection title={translate("Organisation Details")}>
          <TextInputForm
            name="name" control={control}
            label={translate("Name")} required errors={errors}
          />
          <SelectForm
            name="organisationtype" control={control}
            label={translate("Organisation Type")}
            placeholder={translate("Select type")}
            options={organisationTypeOptions} required errors={errors}
          />
          <SelectForm
            name="parentorganisation" control={control}
            label={translate("Parent Organisation")}
            placeholder={translate("Select parent")}
            disabled={!isSuperAdmin}
            options={organisationsList.items.map((o) => ({ value: o.id, label: o.name }))}
          />
          <SelectForm
            name="states" control={control}
            label={translate("State")}
            placeholder={translate("Select state")}
            options={isSuperAdmin ? STATES_MY : currentUserStates || []}
            required errors={errors}
          />
          <TextInputForm
            name="address" control={control}
            label={translate("Address")} isTextArea
          />
          <FileUploadForm
            name="photourl" control={control}
            label={translate("Photo")}
            bucketName="bucket-organisation"
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            translate={translate}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm name="phone" control={control} label={translate("Phone No.")} isPhone />
            <TextInputForm name="email" control={control} label={translate("Email")} isEmail />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="latitude" control={control}
              label={translate("Latitude")} isNumber required errors={errors}
            />
            <TextInputForm
              name="longitude" control={control}
              label={translate("Longitude")} isNumber required errors={errors}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              if (!navigator.geolocation) return;
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setValue("latitude", pos.coords.latitude.toFixed(16));
                  setValue("longitude", pos.coords.longitude.toFixed(16));
                  setIsLocating(false);
                },
                () => setIsLocating(false),
              );
            }}
            disabled={isLocating}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isLocating ? translate("Getting location...") : translate("Get Current Location")}
          </Button>

          {isSuperAdmin && (
            <div className="space-y-2 pt-1">
              <CheckboxForm
                name="canmanagegrave"
                control={control}
                label={translate("Can Manage Grave")}
              />
              <CheckboxForm
                name="canmanagemosque"
                control={control}
                label={translate("Can Manage Mosque")}
              />
              <CheckboxForm
                name="canbedonated"
                control={control}
                label={translate("Can Be Donated")}
              />
            </div>
          )}
        </FormSection>

        {/* Grave Services */}
        <FormSection title={translate("Grave Services")}>
          <CheckboxForm
            name="isgraveservices" control={control}
            label={translate("Grave Services")}
            disabled={serviceEntries.length > 0}
          />
          {isGraveServicesChecked ? (
            <div className="space-y-3 mt-2">
              {serviceEntries.map((entry) => (
                <div key={entry.id} className="flex gap-2 items-center">
                  <input
                    className="flex-1 h-9 px-3 text-sm border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400"
                    placeholder={translate("Service Name")}
                    value={entry.service}
                    onChange={(e) => updateServiceEntry(entry.id, "service", e.target.value)}
                  />
                  <input
                    className="w-20 h-9 px-2 text-sm border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400"
                    type="number"
                    step="0.01"
                    placeholder="RM"
                    value={entry.price}
                    onChange={(e) => updateServiceEntry(entry.id, "price", e.target.value)}
                  />
                  <button
                    type="button"
                    className={`shrink-0 px-2 py-1 text-xs rounded border font-medium transition-colors ${
                      entry.isactive !== false
                        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600"
                    }`}
                    onClick={() => updateServiceEntry(entry.id, "isactive", entry.isactive === false)}
                  >
                    {entry.isactive !== false ? translate("Active") : translate("Inactive")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeServiceEntry(entry.id)}
                    className="shrink-0 text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addServiceEntry}>
                <Plus className="w-4 h-4 mr-1" />
                {translate("Add Service")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">{translate("No grave service")}</p>
          )}
        </FormSection>

        {/* Add Users */}
        {canAddOrgUsers && (
          <FormSection title={translate("Add User")}>
            <div className="grid grid-cols-2 gap-3">
              <TextInputForm name="user_fullname" control={control} label={translate("Full Name")} />
              <TextInputForm name="user_username" control={control} label={translate("Username")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInputForm name="user_phoneno" control={control} label={translate("Phone No.")} isPhone />
              <SelectForm
                name="user_role" control={control}
                label={translate("Role")}
                options={userRoleOptions}
                placeholder="Select role"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleAddOrUpdateUser}
              >
                {editingUserIndex !== null ? translate("Update") : translate("Add User")}
              </Button>
              {editingUserIndex !== null && (
                <Button type="button" size="sm" variant="outline" onClick={resetUserFields}>
                  {translate("Cancel")}
                </Button>
              )}
            </div>

            {userEntries.length > 0 && (
              <div className="space-y-2 mt-1">
                {userEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${
                      editingUserIndex === idx
                        ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entry.fullname}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{entry.username} • {entry.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("user_fullname", entry.fullname || "");
                        setValue("user_username", entry.username || "");
                        setValue("user_phoneno", entry.phoneno || "");
                        setValue("user_role", entry.role || "admin");
                        setEditingUserIndex(idx);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5 text-violet-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserEntries((prev) => prev.filter((_, i) => i !== idx));
                        if (editingUserIndex === idx) resetUserFields();
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">Default password: {DEFAULT_USER_PASSWORD}</p>
          </FormSection>
        )}
      </div>
    </div>
  );
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
