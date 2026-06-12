// @ts-nocheck
import { useEffect, useState } from "react";
import { Shield, X, Save, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { PERMISSION_CATEGORIES } from "@/components/Permissions";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetPermission,
  useUpsertPermission,
} from "@/hooks/usePermissionMutations";
import { useGetUserPaginated } from "@/hooks/useUserMutations";
import { useIsNarrow } from "@/hooks/useIsNarrow";

function UserCard({ user, onSelect }) {
  return (
    <button
      onClick={() => onSelect(user)}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 active:opacity-70"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
            {user.fullname}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {user.email}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shrink-0">
          {user.role}
        </span>
      </div>
    </button>
  );
}

function PermissionSheet({
  user,
  onClose,
  userPermissions,
  onToggle,
  onToggleAll,
  onSave,
  isSaving,
  isLoading,
  visibleCategories,
  isNarrow,
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
            {user.fullname}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

        {isLoading ? (
          <InlineLoadingComponent isPage/>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-28">
            {visibleCategories.map(([key, category]) => {
            const categorySlugs = category.permissions.map((p) => p.slug);
            const allEnabled = categorySlugs.every((s) => !!userPermissions[s]);
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {category.label}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onToggleAll(categorySlugs)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      allEnabled
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {allEnabled
                      ? translate("Disable All")
                      : translate("Enable All")}
                  </button>
                </div>
                <div
                  className={`grid gap-2 ${isNarrow ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {category.permissions.map((perm) => (
                    <div
                      key={perm.slug}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                      <Label
                        className="text-sm cursor-pointer flex-1 pr-2"
                        htmlFor={perm.slug}
                      >
                        {perm.label}
                      </Label>
                      <Switch
                        id={perm.slug}
                        checked={!!userPermissions[perm.slug]}
                        onCheckedChange={() => onToggle(perm.slug)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
          </div>
        )}

      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full h-12 rounded-2xl bg-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSaving ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

export default function MobileManagePermissions() {
  const {
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    isTahfizAdmin,
    isOrganisationAdmin,
    isOrgGraveService,
    isOrgCanBeDonated,
    isOrgCanManageMosque,
    isOrgCanManageGrave,
    refreshUser,
  } = useAdminAccess();

  const isNarrow = useIsNarrow(640);

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [appliedSearch, setAppliedSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});

  const {
    userList: users,
    totalPages,
    isLoading: loadingUsers,
  } = useGetUserPaginated({
    page,
    pageSize: itemsPerPage,
    search: appliedSearch,
  });

  const upsertPermission = useUpsertPermission();

  const { data: permissions = [], isLoading: loadingPermissions } =
    useGetPermission(selectedUser?.id, !!selectedUser);

  useEffect(() => {
    if (!selectedUser) return;
    const permMap = {};
    permissions.forEach((p) => {
      permMap[p.slug] = p.enabled;
    });
    setUserPermissions((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(permMap)) return prev;
      return permMap;
    });
  }, [permissions, selectedUser]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    document.body.style.touchAction = sheetOpen ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [sheetOpen]);

  const openSheet = (user) => {
    setSelectedUser(user);
    setUserPermissions({});
    setSheetOpen(true);
  };

  const togglePermission = (slug) => {
    setUserPermissions((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const toggleAllInCategory = (slugs) => {
    const allEnabled = slugs.every((s) => !!userPermissions[s]);
    setUserPermissions((prev) => {
      const next = { ...prev };
      slugs.forEach((s) => {
        next[s] = !allEnabled;
      });
      return next;
    });
  };

  const saveAllPermissions = async () => {
    if (!selectedUser?.id) return;
    await upsertPermission.mutateAsync({
      userId: selectedUser.id,
      permissions: Object.entries(userPermissions).map(([slug, enabled]) => ({
        slug,
        enabled,
      })),
    });
    const refreshedUser = await refreshUser?.();
    if (refreshedUser) window.location.reload();
  };

  const visibleCategories = Object.entries(PERMISSION_CATEGORIES).filter(
    ([key, category]) => {
      if (category.isSuperAdminOnly) return isSuperAdmin;

      if (category.isTahfizAdminOnly) return isTahfizAdmin;

      if (category.isAllAdmin) return isOrganisationAdmin;

      if (key === "donations" && !isOrgCanBeDonated && !isSuperAdmin)
        return false;

      if (
        (key === "mosques" || key === "death_charity") &&
        !isOrgCanManageMosque &&
        !isSuperAdmin
      )
        return false;

      if (
        (key === "graves" || key === "dead_persons") &&
        !isOrgCanManageGrave &&
        !isSuperAdmin
      )
        return false;

      if (key === "quotations" && !isOrgGraveService && !isSuperAdmin)
        return false;

      return true;
    },
  );

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6 dark:bg-slate-900">
        <BackNavigation title={translate("Manage Permissions")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {translate("Select a user to manage access")}
            </p>
          </div>

          {/* Search */}
          <AdvancedFilters
            parameter={[
              { label: translate("Name"), type: "text", searchColumn: "name" },
            ]}
            onApplyFilter={(f) => {
              setAppliedSearch(f.name || "");
              setPage(1);
            }}
          />

          {/* User list */}
          {loadingUsers ? (
            <InlineLoadingComponent />
          ) : users.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
              <Shield className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.items.map((user) => (
                <UserCard key={user.id} user={user} onSelect={openSheet} />
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
                totalItems={users.total}
              />
            </div>
          )}
        </div>
      </div>

      {sheetOpen && selectedUser && (
        <PermissionSheet
          user={selectedUser}
          onClose={() => setSheetOpen(false)}
          userPermissions={userPermissions}
          onToggle={togglePermission}
          onToggleAll={toggleAllInCategory}
          onSave={saveAllPermissions}
          isSaving={upsertPermission.isPending}
          isLoading={loadingPermissions}
          visibleCategories={visibleCategories}
          isNarrow={isNarrow}
        />
      )}
    </>
  );
}
