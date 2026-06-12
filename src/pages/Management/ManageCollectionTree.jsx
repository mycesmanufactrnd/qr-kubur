// @ts-nocheck
import { useState, useMemo } from "react";
import {
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Building2,
  BookOpen,
  MapPin,
  Building,
  Search,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import { showSuccess, showApiError } from "@/components/ToastrNotification";
import FamilyTree from "@/components/collectiontree/FamilyTree";
import { translate } from "@/utils/translations";
import Breadcrumb from "@/components/Breadcrumb";

const TYPE_CONFIG = {
  mosque: {
    icon: Building2,
    label: "Mosque",
    color: "bg-teal-50 border-teal-200 text-teal-700",
    accent: "#0d9488",
    soft: "#f0fdfa",
  },
  tahfiz: {
    icon: BookOpen,
    label: "Tahfiz",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    accent: "#7c3aed",
    soft: "#f5f3ff",
  },
  grave: {
    icon: MapPin,
    label: "Grave",
    color: "bg-stone-50 border-stone-200 text-stone-700",
    accent: "#78716c",
    soft: "#fafaf9",
  },
  organisation: {
    icon: Building,
    label: "Organisation",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    accent: "#2563eb",
    soft: "#eff6ff",
  },
};

const ADD_TYPES = [
  { value: "mosque", label: "Mosque" },
  { value: "tahfiz", label: "Tahfiz Center" },
  { value: "grave", label: "Grave" },
  { value: "organisation", label: "Organisation" },
];

const getDetailUrl = (item) => {
  if (item.entity_type === "grave") return `/managegraves`;
  if (item.entity_type === "mosque") return `/managemosques`;
  if (item.entity_type === "tahfiz") return `/managetahfizcenters`;
  if (item.entity_type === "organisation") return `/manageorganisations`;
  return "#";
};

function CollectionCard({ col, onOpen, onEdit, onDelete, isDeleting }) {
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400" />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate leading-tight">
                {col.name}
              </h3>
              {col.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">
                  {col.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
            <button
              onClick={() => onEdit(col)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(col.id)}
              disabled={isDeleting}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => onOpen(col)}
          className="w-full h-9 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-xs font-medium text-slate-600 hover:text-teal-700 transition-all duration-200 flex items-center justify-center gap-1.5"
        >
          Open Tree
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="px-6 pt-5 pb-2 border-b">
          <DialogTitle className="font-semibold text-base tracking-tight text-slate-800">
            {title}
          </DialogTitle>
        </div>
        <div className="px-6 pt-2 pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TypePill({ type }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
      style={{
        background: cfg.soft,
        borderColor: cfg.accent + "40",
        color: cfg.accent,
      }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function ManageCollectionTree() {
  const { currentUser, isSuperAdmin } = useAdminAccess();
  const orgId = currentUser?.organisation?.id;

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState("mosque");
  const [addSearch, setAddSearch] = useState("");
  const [addSelected, setAddSelected] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const trpcUtils = trpc.useUtils();

  const { data: collections = [], isLoading: collectionsLoading } =
    trpc.collectionTree.getByOrganisation.useQuery(
      { organisationId: orgId ?? 0 },
      { enabled: !!orgId },
    );

  const {
    data: rawItems = [],
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = trpc.collectionTree.getItems.useQuery(
    { collectionTreeId: selectedCollection?.id ?? 0 },
    { enabled: !!selectedCollection?.id },
  );

  const transformedItems = useMemo(
    () =>
      rawItems.flatMap((item) => {
        if (item.grave)
          return [
            {
              id: item.id,
              entity_type: "grave",
              label: item.grave.name,
              state: item.grave.state,
              detailId: item.graveId,
            },
          ];
        if (item.mosque)
          return [
            {
              id: item.id,
              entity_type: "mosque",
              label: item.mosque.name,
              state: item.mosque.state,
              detailId: item.mosqueId,
            },
          ];
        if (item.tahfiz)
          return [
            {
              id: item.id,
              entity_type: "tahfiz",
              label: item.tahfiz.name,
              state: item.tahfiz.state,
              detailId: item.tahfizId,
              parentOrg: item.tahfiz.parentorganisation?.name ?? null,
            },
          ];
        if (item.organisation)
          return [
            {
              id: item.id,
              entity_type: "organisation",
              label: item.organisation.name,
              state: item.organisation.states?.[0] ?? "",
              detailId: item.organisationId,
            },
          ];
        return [];
      }),
    [rawItems],
  );

  const { data: graveData, isLoading: graveLoading } =
    trpc.grave.getPaginated.useQuery(
      { page: 1, pageSize: 30, filterName: addSearch || undefined },
      { enabled: showAdd && addType === "grave" },
    );
  const { data: mosqueData, isLoading: mosqueLoading } =
    trpc.mosque.getPaginated.useQuery(
      { page: 1, pageSize: 30, filterName: addSearch || undefined },
      { enabled: showAdd && addType === "mosque" },
    );
  const { data: tahfizData, isLoading: tahfizLoading } =
    trpc.tahfiz.getPaginated.useQuery(
      {
        page: 1,
        pageSize: 30,
        filterName: addSearch || undefined,
        isFromParentOrg: { status: true, parentOrganisationId: Number(orgId) },
      },
      { enabled: showAdd && addType === "tahfiz" },
    );
  const { data: orgData, isLoading: orgLoading } =
    trpc.organisation.getPaginated.useQuery(
      {
        page: 1,
        pageSize: 30,
        filterName: addSearch || undefined,
        isSuperAdmin: isSuperAdmin ?? false,
        organisationId: orgId,
      },
      { enabled: showAdd && addType === "organisation" },
    );

  const addItems = useMemo(() => {
    if (addType === "grave") return graveData?.items ?? [];
    if (addType === "mosque") return mosqueData?.items ?? [];
    if (addType === "tahfiz") return tahfizData?.items ?? [];
    if (addType === "organisation") return orgData?.items ?? [];
    return [];
  }, [addType, graveData, mosqueData, tahfizData, orgData]);

  const isAddLoading =
    addType === "grave"
      ? graveLoading
      : addType === "mosque"
        ? mosqueLoading
        : addType === "tahfiz"
          ? tahfizLoading
          : orgLoading;

  const existingItemKeys = useMemo(
    () =>
      new Set(transformedItems.map((i) => `${i.entity_type}-${i.detailId}`)),
    [transformedItems],
  );

  const createMutation = trpc.collectionTree.create.useMutation({
    onSuccess: () => {
      showSuccess("Collection", "create");
      trpcUtils.collectionTree.getByOrganisation.invalidate();
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
    },
    onError: (err) => showApiError(err),
  });
  const deleteMutation = trpc.collectionTree.delete.useMutation({
    onSuccess: () => {
      showSuccess("Collection", "delete");
      trpcUtils.collectionTree.getByOrganisation.invalidate();
      setSelectedCollection(null);
    },
    onError: (err) => showApiError(err),
  });
  const updateMutation = trpc.collectionTree.update.useMutation({
    onSuccess: (updated) => {
      showSuccess("Collection", "update");
      trpcUtils.collectionTree.getByOrganisation.invalidate();
      if (selectedCollection && updated) setSelectedCollection(updated);
      setShowEdit(false);
    },
    onError: (err) => showApiError(err),
  });
  const addItemMutation = trpc.collectionTree.addItem.useMutation({
    onSuccess: () => {
      refetchItems();
      setShowAdd(false);
      setAddSelected(null);
      setAddSearch("");
    },
    onError: (err) => showApiError(err),
  });
  const removeItemMutation = trpc.collectionTree.removeItem.useMutation({
    onSuccess: () => refetchItems(),
    onError: (err) => showApiError(err),
  });

  const handleCreate = () => {
    if (!createName.trim() || !orgId) return;
    createMutation.mutate({
      name: createName.trim(),
      description: createDesc.trim() || null,
      organisation: { id: orgId },
    });
  };
  const handleAddItem = () => {
    if (!addSelected || !selectedCollection) return;
    addItemMutation.mutate({
      collectionTreeId: selectedCollection.id,
      graveId: addType === "grave" ? addSelected.id : undefined,
      mosqueId: addType === "mosque" ? addSelected.id : undefined,
      tahfizId: addType === "tahfiz" ? addSelected.id : undefined,
      organisationId: addType === "organisation" ? addSelected.id : undefined,
    });
  };
  const openEditDialog = (col) => {
    setEditName(col.name);
    setEditDesc(col.description ?? "");
    setShowEdit(true);
  };
  const handleEdit = () => {
    if (!editName.trim() || !selectedCollection) return;
    updateMutation.mutate({
      id: selectedCollection.id,
      name: editName.trim(),
      description: editDesc.trim() || null,
    });
  };
  const openAddDialog = () => {
    setAddType("mosque");
    setAddSearch("");
    setAddSelected(null);
    setShowAdd(true);
  };

  if (selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-20">
          <div className="mx-auto flex items-center justify-between gap-3">
            <Breadcrumb
              items={[
                { label: translate("Admin Dashboard"), page: "AdminDashboard" },
                {
                  label: translate("Manage Collection Tree"),
                  action: () => setSelectedCollection(null),
                },
                { label: selectedCollection.name },
              ]}
            />
            <div className="flex items-center gap-1.5 shrink-0 mb-1">
              <button
                onClick={() => openEditDialog(selectedCollection)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedCollection.id)}
                disabled={deleteMutation.isPending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={openAddDialog}
                className="h-8 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Place
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 flex justify-center">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          ) : (
            <FamilyTree
              collection={selectedCollection}
              items={transformedItems}
              typeConfig={TYPE_CONFIG}
              onRemove={(id) => removeItemMutation.mutate(id)}
              getDetailUrl={getDetailUrl}
            />
          )}
        </div>

        <Modal
          open={showAdd}
          onClose={() => {
            setShowAdd(false);
            setAddSelected(null);
            setAddSearch("");
          }}
          title="Add Place to Collection"
        >
          <div className="space-y-4">
            <div className="flex gap-1.5 flex-wrap">
              {ADD_TYPES.map((opt) => {
                const cfg = TYPE_CONFIG[opt.value];
                const Icon = cfg.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAddType(opt.value);
                      setAddSelected(null);
                      setAddSearch("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={
                      addType === opt.value
                        ? {
                            background: cfg.soft,
                            borderColor: cfg.accent + "60",
                            color: cfg.accent,
                          }
                        : {
                            background: "transparent",
                            borderColor: "#e2e8f0",
                            color: "#94a3b8",
                          }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={addSearch}
                onChange={(e) => {
                  setAddSearch(e.target.value);
                  setAddSelected(null);
                }}
                placeholder="Search by name…"
                className="w-full h-9 pl-9 pr-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
              />
            </div>

            {/* Results */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-56 overflow-y-auto">
              {isAddLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : addItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  No records found
                </div>
              ) : (
                addItems.map((rec) => {
                  const key = `${addType}-${rec.id}`;
                  const alreadyAdded = existingItemKeys.has(key);
                  const isSelected = addSelected?.id === rec.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => !alreadyAdded && setAddSelected(rec)}
                      disabled={alreadyAdded}
                      className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm border-b dark:border-slate-700 last:border-b-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                          {rec.name}
                        </span>
                        {(rec.state ?? rec.states?.[0]) && (
                          <span className="text-slate-400 text-xs shrink-0">
                            {rec.state ?? rec.states?.[0]}
                          </span>
                        )}
                        {alreadyAdded && (
                          <span className="text-xs text-slate-400 shrink-0">
                            (added)
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={addItemMutation.isPending || !addSelected}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
              >
                {addItemMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Add to Collection
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Collection"
        >
          <div className="space-y-4">
            <Field label="Collection Name">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                placeholder="e.g. Mosques in Selangor"
                className="w-full h-9 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="What is this collection about?"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none"
              />
            </Field>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={updateMutation.isPending || !editName.trim()}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
              >
                {updateMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          {
            label: translate("Manage Collection Tree"),
            page: "ManageCollectionTree",
          },
        ]}
      />
      <div className="mx-auto px-4 pt-6 pb-16 space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-teal-900 rounded-2xl p-6 flex items-center justify-between shadow-xl overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, #2dd4bf 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-1">
              <Layers className="w-5 h-5 text-teal-400" />
              <h1 className="text-lg font-bold text-white tracking-tight">
                My Collections
              </h1>
            </div>
            <p className="text-sm text-teal-200/70">
              Organise mosques, graves &amp; tahfiz centers
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="relative flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all backdrop-blur-sm"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        {collectionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse"
              />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-base font-semibold text-slate-600 mb-1">
              No collections yet
            </p>
            <p className="text-sm text-slate-400">
              Create your first collection to get started
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collections.map((col) => (
              <CollectionCard
                key={col.id}
                col={col}
                onOpen={setSelectedCollection}
                onEdit={openEditDialog}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateName("");
          setCreateDesc("");
        }}
        title="New Collection"
      >
        <div className="space-y-4">
          <Field label="Collection Name">
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Mosques in Selangor"
              autoFocus
              className="w-full h-9 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
            />
          </Field>
          <Field label="Description (optional)">
            <textarea
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="What is this collection about?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none"
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createName.trim()}
              className="flex-1 h-9 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Create Collection
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Collection"
      >
        <div className="space-y-4">
          <Field label="Collection Name">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              placeholder="e.g. Mosques in Selangor"
              className="w-full h-9 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
            />
          </Field>
          <Field label="Description (optional)">
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="What is this collection about?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none"
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowEdit(false)}
              className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={updateMutation.isPending || !editName.trim()}
              className="flex-1 h-9 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
