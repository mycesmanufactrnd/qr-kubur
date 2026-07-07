// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import ManageUsersMobile from "@/pages/Mobile/ManageUsers";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import SearchBar from "@/components/forms/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import { useCrudPermissions } from "@/components/PermissionsContext";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import { validateFields } from "@/utils/validations";
import { ROLE_TYPE } from "@/utils/enums";
import {
  useGetUserPaginated,
  useUserMutations,
} from "@/hooks/useUserMutations";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import { useGetTahfizPaginated } from "@/hooks/useTahfizMutations";
import { hashPassword } from "@/utils/helpers";
import { translate } from "@/utils/translations";
import { createPageUrl } from "@/utils";

const DEFAULT_USER_FORM = {
  fullname: "",
  username: "",
  email: "",
  phoneno: "",
  password: "",
  role: "employee",
  roletype: "",
  organisation: "",
  tahfizcenter: "",
  states: [],
};

export default function ManageUsers() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <ManageUsersMobile />;
  return <ManageUsersDesktop />;
}

function ManageUsersDesktop() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    isAdmin,
    currentUserStates,
    isTahfizAdmin,
  } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterUsername, setFilterUsername] = useState("");
  const [filterOrganisationId, setFilterOrganisationId] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_USER_FORM });

  const formOrganisation = watch("organisation");
  const formRole = watch("role");
  const formStates = watch("states");

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("users");

  const {
    userList: appUsers,
    totalPages,
    isLoading: appUsersLoading,
  } = useGetUserPaginated({
    page,
    pageSize: itemsPerPage,
    fullname: search,
    email: filterEmail,
    username: filterUsername,
    organisationId: isSuperAdmin && (Number(filterOrganisationId) || null),
  });

  const { organisationsList: organisations } = useGetOrganisationPaginated({});

  const { tahfizCenterList: tahfizCenters } = useGetTahfizPaginated({});

  const { createUser, updateUser, deleteUser } = useUserMutations();
  const navigate = useNavigate();

  const isCurrentUserOrgParent = Boolean(
    currentUser?.organisation?.id &&
    (currentUser.organisation.parentorganisation == null ||
      currentUser.organisation.parentorganisation?.id == null ||
      currentUser.organisation.parentorganisationId == null),
  );

  const selectedOrganisation = organisations.items.find(
    (org) => String(org.id) === String(formOrganisation),
  );
  const showRoleTypeSelect = Boolean(
    formOrganisation &&
    formRole === "employee" &&
    !!selectedOrganisation?.canmanagemosque,
  );

  const handleAddUser = () => {
    setIsAddMode(true);
    const defaultState = isAdmin && !isSuperAdmin ? currentUserStates : [];
    const defaultOrgId =
      isAdmin && !isSuperAdmin ? currentUser.organisation?.id : null;
    const defaultTahfizId =
      isAdmin && !isSuperAdmin ? currentUser.tahfizcenter?.id : null;

    reset({
      ...DEFAULT_USER_FORM,
      organisation: defaultOrgId ? String(defaultOrgId) : "",
      tahfizcenter: defaultTahfizId ? String(defaultTahfizId) : "",
      states: defaultState,
    });
    setEditingUser({});
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setIsAddMode(false);

    reset({
      fullname: user.fullname || "",
      username: user.username || "",
      email: user.email || "",
      phoneno: user.phoneno || "",
      password: "",
      role: user.role || "employee",
      roletype: user.roletype || "",
      organisation: user.organisation?.id ? String(user.organisation.id) : "",
      tahfizcenter: user.tahfizcenter?.id ? String(user.tahfizcenter.id) : "",
      states: user.states || [],
    });
    setEditingUser({
      id: user.id,
      isAppUser: appUsers.items.some((u) => u.id === user.id),
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async (data) => {
    const isValid = validateFields(data, [
      { field: "fullname", label: "Full Name", type: "text" },
      { field: "username", label: "Username", type: "text" },
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

    const submitData = {
      ...data,
      organisation: data.organisation
        ? { id: Number(data.organisation) }
        : null,
      tahfizcenter: data.tahfizcenter
        ? { id: Number(data.tahfizcenter) }
        : null,
      ...(data.password ? { password: await hashPassword(data.password) } : {}),
    };

    if (!isAddMode && !submitData.password) {
      delete submitData.password;
    }

    if (isAddMode) {
      createUser.mutateAsync(submitData).then((res) => {
        if (res) {
          setDialogOpen(false);
          setEditingUser(null);
          setIsAddMode(false);
        }
      });
    } else if (editingUser?.isAppUser) {
      updateUser
        .mutateAsync({ id: editingUser.id, data: submitData })
        .then((res) => {
          if (res) {
            setDialogOpen(false);
            setEditingUser(null);
            setIsAddMode(false);
          }
        });
    }
  };

  const handleRoleChange = (value) => {
    const nextOrganisation = organisations.items.find(
      (org) => String(org.id) === String(formOrganisation),
    );

    setValue(
      "roletype",
      value === "employee" && nextOrganisation?.canmanagemosque
        ? watch("roletype") || ""
        : "",
    );
  };

  const handleOrganisationChange = (value) => {
    const nextOrganisation = organisations.items.find(
      (org) => String(org.id) === String(value),
    );

    setValue("tahfizcenter", "");
    setValue(
      "roletype",
      formRole === "employee" && nextOrganisation?.canmanagemosque
        ? watch("roletype") || ""
        : "",
    );
  };

  const handleTahfizChange = () => {
    setValue("organisation", "");
  };

  const handleStateToggle = (states) => {
    // For state admin, don't allow deselecting their own states
    if (isAdmin && !isSuperAdmin) return;

    const currentStates = formStates || [];
    const newStates = currentStates.includes(states)
      ? currentStates.filter((s) => s !== states)
      : [...currentStates, states];
    setValue("states", newStates);
  };

  const handleSearch = () => {
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilterEmail("");
    setFilterUsername("");
    setFilterOrganisationId("");
    setPage(1);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    const isAppUser = appUsers.items.some((u) => u.id === userToDelete.id);
    if (isAppUser) {
      deleteUser.mutate(userToDelete.id);
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (loadingUser || permissionsLoading) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  const dashboardLabel = isTahfizAdmin
    ? translate("Tahfiz Dashboard")
    : translate("Admin Dashboard");
  const dashboardPage = isTahfizAdmin ? "TahfizDashboard" : "AdminDashboard";

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            {
              label: isSuperAdmin
                ? translate("Super Admin Dashboard")
                : dashboardLabel,
              page: isSuperAdmin ? "SuperadminDashboard" : dashboardPage,
            },
            { label: translate("Manage Users"), page: "ManageUsers" },
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
          {
            label: isSuperAdmin
              ? translate("Super Admin Dashboard")
              : dashboardLabel,
            page: isSuperAdmin ? "SuperadminDashboard" : dashboardPage,
          },
          { label: translate("Manage Users"), page: "ManageUsers" },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Manage Users")}
        </h1>
        {canCreate && (
          <Button
            onClick={handleAddUser}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add User")}
          </Button>
        )}
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        buttonClassName="bg-emerald-600 hover:bg-emerald-700 text-white"
        filters={[
          {
            type: "text",
            key: "search",
            value: search,
            onChange: setSearch,
            label: translate("Search User"),
          },
          {
            type: "text",
            key: "filterEmail",
            value: filterEmail,
            onChange: setFilterEmail,
            label: translate("Search Email"),
          },
          {
            type: "text",
            key: "filterUsername",
            value: filterUsername,
            onChange: setFilterUsername,
            label: translate("Search Username"),
          },
          {
            type: "select",
            key: "filterOrganisationId",
            show: isSuperAdmin,
            value: filterOrganisationId,
            onChange: (value) => {
              setFilterOrganisationId(value);
              setPage(1);
            },
            label: translate("Organisation"),
            options: organisations.items.map((org) => ({
              value: String(org.id),
              label: org.name,
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
                <TableHead>{translate("Username")}</TableHead>
                <TableHead>{translate("Email")}</TableHead>
                <TableHead className="text-center">
                  {translate("Role")}
                </TableHead>
                <TableHead>{translate("Organisation")}</TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appUsersLoading ? (
                <InlineLoadingComponent isTable colSpan={5} />
              ) : appUsers.items.length === 0 ? (
                <NoDataTableComponent colSpan={5} />
              ) : (
                appUsers.items.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {user.fullname?.[0] ||
                              user.email?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate">{user.fullname || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {user.username || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {user.email || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {translate(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.organisation?.name || (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canEdit && canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(createPageUrl("ManagePermissions"), {
                              state: { incomingUser: user },
                            })
                          }
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {appUsers.total > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={appUsers.total}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800"
        >
          <DialogHeader>
            <DialogTitle>
              {isAddMode ? translate("Add User") : translate("Edit User")}
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSubmit(handleSaveUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextInputForm
                  name="fullname"
                  control={control}
                  label={translate("Full Name")}
                  placeholder={translate("Enter Name")}
                  required
                  errors={errors}
                />
                <TextInputForm
                  name="username"
                  control={control}
                  label={translate("Username")}
                  placeholder={translate("Enter Username")}
                  required
                  errors={errors}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextInputForm
                  name="email"
                  control={control}
                  label={`${translate("Email")} (${translate("Notification email")})`}
                  placeholder={translate("Enter Email")}
                  isEmail
                  errors={errors}
                />
                <TextInputForm
                  name="phoneno"
                  control={control}
                  label={translate("Phone No")}
                  placeholder={translate("Enter Phone No")}
                  isPhone
                  errors={errors}
                />
              </div>

              <TextInputForm
                name="password"
                control={control}
                label={translate("Password")}
                placeholder={
                  isAddMode
                    ? translate("Enter Password")
                    : translate("Password (leave blank if not changing)")
                }
                required={isAddMode}
                errors={errors}
              />

              {(isSuperAdmin || currentUser?.organisation?.id) && (
                <SelectForm
                  name="organisation"
                  control={control}
                  label={translate("Organisation")}
                  placeholder={translate("Select Organisation")}
                  options={organisations.items.map((org) => ({
                    value: String(org.id),
                    label: org.name,
                  }))}
                  onValueChange={handleOrganisationChange}
                  disabled={
                    isAdmin &&
                    !isSuperAdmin &&
                    currentUser.organisation &&
                    !isCurrentUserOrgParent
                  }
                />
              )}

              {(isSuperAdmin || currentUser?.tahfizcenter?.id) && (
                <SelectForm
                  name="tahfizcenter"
                  control={control}
                  label={translate("Tahfiz Center")}
                  placeholder={translate("Select Tahfiz Center")}
                  options={tahfizCenters.items.map((center) => ({
                    value: String(center.id),
                    label: center.name,
                  }))}
                  onValueChange={handleTahfizChange}
                  disabled={
                    (isAdmin && !isSuperAdmin && currentUser.tahfizcenter) ||
                    currentUser.organisation
                  }
                />
              )}

              <SelectForm
                name="role"
                control={control}
                label={translate("Role")}
                options={[
                  ...(isSuperAdmin
                    ? [
                        {
                          value: "superadmin",
                          label: translate("Super Admin"),
                        },
                      ]
                    : []),
                  { value: "admin", label: translate("Admin") },
                  { value: "employee", label: translate("Employee") },
                ]}
                onValueChange={handleRoleChange}
              />

              {showRoleTypeSelect && (
                <SelectForm
                  name="roletype"
                  control={control}
                  label={translate("Role Type")}
                  placeholder={translate("Select Role Type")}
                  options={Object.entries(ROLE_TYPE.mosque).map(
                    ([key, value]) => ({ value: key, label: value }),
                  )}
                />
              )}

              <div>
                <label className="text-sm font-medium mb-2 block dark:text-slate-300">
                  {translate("State")} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border dark:border-slate-700 rounded dark:bg-slate-800/50">
                  {currentUserStates.map((states) => (
                    <div key={states} className="flex items-center space-x-2">
                      <Checkbox
                        id={states}
                        checked={formStates?.includes(states)}
                        onCheckedChange={() => handleStateToggle(states)}
                        disabled={isAdmin && !isSuperAdmin}
                      />
                      <label htmlFor={states} className="text-sm">
                        {states}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  {translate("Cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {translate("Save")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete User")}
        isDelete={true}
        itemToDelete={userToDelete?.fullname || userToDelete?.email}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
