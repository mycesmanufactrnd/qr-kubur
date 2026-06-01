// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Edit, Trash2, X, Save, ShieldCheck } from "lucide-react";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createPageUrl } from "@/utils/index";
import { translate } from "@/utils/translations";
import { hashPassword } from "@/utils/helpers";
import { validateFields } from "@/utils/validations";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import {
  useGetUserPaginated,
  useUserMutations,
} from "@/hooks/useUserMutations";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import { useGetTahfizPaginated } from "@/hooks/useTahfizMutations";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";

const roleColors = {
  superadmin:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  employee: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

const avatarColors = {
  superadmin:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  employee: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

function UserCard({
  user,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onManagePermissions,
}) {
  const initial = (user.fullname?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  const affiliation = user.organisation?.name ?? user.tahfizcenter?.name ?? "";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${
            avatarColors[user.role] ?? avatarColors.employee
          }`}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
            {user.fullname || user.email}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge
              className={`border-0 text-xs capitalize ${roleColors[user.role] ?? roleColors.employee}`}
            >
              {user.role}
            </Badge>
            {affiliation && (
              <span className="text-xs text-slate-400 truncate">
                {affiliation}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        {canEdit && (
          <button
            onClick={() => onEdit(user)}
            className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
          >
            <Edit className="w-3.5 h-3.5" />
            {translate("Edit")}
          </button>
        )}
        <button
          onClick={() => onManagePermissions(user)}
          className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {translate("Permissions")}
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(user)}
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

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-700";

function UserFormSheet({
  editing,
  isAddMode,
  onClose,
  onSave,
  isSuperAdmin,
  isAdmin,
  currentUser,
  currentUserStates,
  organisations,
  tahfizCenters,
  isSaving,
}) {
  const [local, setLocal] = useState(() =>
    editing
      ? {
          ...editing,
          password: "",
          organisation: editing.organisation?.id
            ? String(editing.organisation.id)
            : editing.organisation
              ? String(editing.organisation)
              : "",
          tahfizcenter: editing.tahfizcenter?.id
            ? String(editing.tahfizcenter.id)
            : editing.tahfizcenter
              ? String(editing.tahfizcenter)
              : "",
          states: editing.states || [],
        }
      : {
          fullname: "",
          email: "",
          phoneno: "",
          password: "",
          role: "employee",
          organisation:
            isAdmin && !isSuperAdmin
              ? String(currentUser?.organisation?.id ?? "")
              : "",
          tahfizcenter:
            isAdmin && !isSuperAdmin
              ? String(currentUser?.tahfizcenter?.id ?? "")
              : "",
          states: isAdmin && !isSuperAdmin ? currentUserStates : [],
        },
  );

  const set = (field, value) =>
    setLocal((prev) => ({ ...prev, [field]: value }));

  const handleStateToggle = (state) => {
    if (isAdmin && !isSuperAdmin) return;
    const current = local.states || [];
    set(
      "states",
      current.includes(state)
        ? current.filter((s) => s !== state)
        : [...current, state],
    );
  };

  const showOrgSelect = isSuperAdmin || !!currentUser?.organisation?.id;
  const showTahfizSelect = isSuperAdmin || !!currentUser?.tahfizcenter?.id;
  const orgDisabled = isAdmin && !isSuperAdmin && !!currentUser?.organisation;
  const tahfizDisabled =
    (isAdmin && !isSuperAdmin && !!currentUser?.tahfizcenter) ||
    !!currentUser?.organisation;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {isAddMode ? translate("Add User") : translate("Edit User")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        <Field label={translate("Full Name")} required>
          <input
            className={inputCls}
            value={local.fullname}
            onChange={(e) => set("fullname", e.target.value)}
            placeholder={translate("Enter Name")}
          />
        </Field>

        <Field label={translate("Username")} required>
          <input
            className={inputCls}
            value={local.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder={translate("Enter Username")}
          />
        </Field>

        <Field label={translate("Phone No")}>
          <input
            className={inputCls}
            value={local.phoneno}
            onChange={(e) => set("phoneno", e.target.value)}
            placeholder={translate("Enter Phone No")}
          />
        </Field>

        <Field label={translate("Password")} required={isAddMode}>
          <input
            className={inputCls}
            type="password"
            value={local.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={
              isAddMode
                ? translate("Enter Password")
                : translate("Password (leave blank if not changing)")
            }
          />
        </Field>

        <Field label={translate("Role")}>
          <select
            className={inputCls}
            value={local.role || "employee"}
            onChange={(e) => set("role", e.target.value)}
          >
            {isSuperAdmin && (
              <option value="superadmin">{translate("Super Admin")}</option>
            )}
            <option value="admin">{translate("Admin")}</option>
            <option value="employee">{translate("Employee")}</option>
          </select>
        </Field>

        {showOrgSelect && (
          <Field label={translate("Organisation")}>
            <select
              className={inputCls}
              value={local.organisation || ""}
              disabled={orgDisabled}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  organisation: e.target.value,
                  tahfizcenter: "",
                }))
              }
            >
              <option value="">{translate("Select Organisation")}</option>
              {organisations.map((org) => (
                <option key={org.id} value={String(org.id)}>
                  {org.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {showTahfizSelect && (
          <Field label={translate("Tahfiz Center")}>
            <select
              className={inputCls}
              value={local.tahfizcenter || ""}
              disabled={tahfizDisabled}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  tahfizcenter: e.target.value,
                  organisation: "",
                }))
              }
            >
              <option value="">{translate("Select Tahfiz Center")}</option>
              {tahfizCenters.map((center) => (
                <option key={center.id} value={String(center.id)}>
                  {center.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={translate("State")} required>
          <div className="grid grid-cols-2 gap-2">
            {currentUserStates.map((state) => {
              const selected = local.states?.includes(state);
              return (
                <button
                  key={state}
                  type="button"
                  onClick={() => handleStateToggle(state)}
                  disabled={isAdmin && !isSuperAdmin}
                  className={`h-9 rounded-xl border text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-default ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
        <button
          onClick={() => onSave(local)}
          disabled={isSaving}
          className="w-full h-12 rounded-2xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSaving ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MobileManageUsers() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    isAdmin,
    currentUserStates,
    isTahfizAdmin,
  } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("users");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedOrgId, setAppliedOrgId] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const {
    userList: appUsers,
    totalPages,
    isLoading,
  } = useGetUserPaginated({
    page,
    pageSize: itemsPerPage,
    search: appliedSearch,
    organisationId:
      isSuperAdmin && appliedOrgId !== "all" ? Number(appliedOrgId) : null,
  });

  const { organisationsList: organisations } = useGetOrganisationPaginated({});
  const { tahfizCenterList: tahfizCenters } = useGetTahfizPaginated({});
  const { createUser, updateUser, deleteUser } = useUserMutations();
  const navigate = useNavigate();

  useEffect(() => {
    const open = formOpen || deleteDialogOpen;
    document.body.style.overflow = open ? "hidden" : "";
    document.body.style.touchAction = open ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [formOpen, deleteDialogOpen]);

  const openAdd = () => {
    setIsAddMode(true);
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setIsAddMode(false);
    setEditingUser({
      ...user,
      isAppUser: appUsers.items.some((u) => u.id === user.id),
    });
    setFormOpen(true);
  };

  const handleSave = async (userData) => {
    const isValid = validateFields(userData, [
      { field: "fullname", label: "Full Name", type: "text" },
      { field: "email", label: "Username", type: "text" },
      { field: "phoneno", label: "Phone No.", type: "phone", required: false },
      { field: "states", label: "State", type: "array" },
      {
        field: "password",
        label: "Password",
        type: "password",
        minLength: 6,
        onlyIfExists: true,
      },
    ]);
    if (!isValid) return;

    setIsSaving(true);
    try {
      const submitData = {
        ...userData,
        organisation: userData.organisation
          ? { id: Number(userData.organisation) }
          : null,
        tahfizcenter: userData.tahfizcenter
          ? { id: Number(userData.tahfizcenter) }
          : null,
        ...(userData.password
          ? { password: await hashPassword(userData.password) }
          : {}),
      };

      if (!isAddMode && !submitData.password) delete submitData.password;

      if (isAddMode) {
        const res = await createUser.mutateAsync(submitData);
        if (res) setFormOpen(false);
      } else if (userData.isAppUser) {
        const res = await updateUser.mutateAsync({
          id: userData.id,
          data: submitData,
        });
        if (res) setFormOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    const isAppUser = appUsers.items.some((u) => u.id === userToDelete.id);
    if (isAppUser) deleteUser.mutate(userToDelete.id);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6 dark:bg-slate-900">
        <BackNavigation title={translate("Manage Users")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Filter + Add */}
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                {
                  label: translate("Search"),
                  type: "text",
                  searchColumn: "search",
                },
                ...(isSuperAdmin
                  ? [
                      {
                        label: translate("Organisation"),
                        type: "select",
                        searchColumn: "orgId",
                        options: (organisations?.items || []).map((o) => ({
                          id: String(o.id),
                          name: o.name,
                        })),
                      },
                    ]
                  : []),
              ]}
              onApplyFilter={(f) => {
                setAppliedSearch(f.search || "");
                setAppliedOrgId(f.orgId || "all");
                setPage(1);
              }}
            />
            {canCreate && (
              <button
                onClick={openAdd}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <InlineLoadingComponent isPage />
          ) : appUsers.items.length === 0 ? (
            <MobileEmptyList icon={Users} title={translate("No records")} />
          ) : (
            <div className="space-y-3">
              {appUsers.items.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onDelete={(u) => {
                    setUserToDelete(u);
                    setDeleteDialogOpen(true);
                  }}
                  onManagePermissions={(u) =>
                    navigate(createPageUrl("ManagePermissions"), {
                      state: { incomingUser: u },
                    })
                  }
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
                totalItems={appUsers.total}
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <UserFormSheet
          editing={editingUser}
          isAddMode={isAddMode}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          currentUser={currentUser}
          currentUserStates={currentUserStates}
          organisations={organisations.items}
          tahfizCenters={tahfizCenters.items}
          isSaving={isSaving}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete User")}
        isDelete={true}
        itemToDelete={userToDelete?.fullname || userToDelete?.email}
        onConfirm={confirmDelete}
      />
    </>
  );
}
