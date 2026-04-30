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
import BackNavigation from "@/components/BackNavigation";
import FamilyTree from "@/components/collectiontree/FamilyTree";

const TYPE_CONFIG = {
  mosque: {
    icon: Building2,
    label: "Mosque",
    color: "bg-teal-50 border-teal-200 text-teal-700",
  },
  tahfiz: {
    icon: BookOpen,
    label: "Tahfiz",
    color: "bg-violet-50 border-violet-200 text-violet-700",
  },
  grave: {
    icon: MapPin,
    label: "Grave",
    color: "bg-stone-50 border-stone-200 text-stone-700",
  },
  organisation: {
    icon: Building,
    label: "Organisation",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
};

const ADD_TYPES = [
  { value: "mosque", label: "Mosque" },
  { value: "tahfiz", label: "Tahfiz Center" },
  { value: "grave", label: "Grave" },
  { value: "organisation", label: "Organisation" },
];

const getDetailUrl = (item) => {
  if (item.entity_type === "grave") return `/graveyard/${item.detailId}`;
  if (item.entity_type === "mosque") return `/mosque/${item.detailId}`;
  if (item.entity_type === "tahfiz") return `/tahfiz/${item.detailId}`;
  if (item.entity_type === "organisation")
    return `/organisation/${item.detailId}`;
  return "#";
};

export default function ManageCollectionTree() {
  const { currentUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();
  const orgId = currentUser?.organisation?.id;

  const [selectedCollection, setSelectedCollection] = useState(
    /** @type {any} */ (null),
  );

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState("mosque");
  const [addSearch, setAddSearch] = useState("");
  const [addSelected, setAddSelected] = useState(/** @type {any} */ (null));

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
        isFromParentOrg: {
          status: true,
          parentOrganisationId: Number(orgId),
        },
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
    const target = selectedCollection;
    if (!editName.trim() || !target) return;
    updateMutation.mutate({
      id: target.id,
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
      <div className="min-h-screen pb-10">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedCollection(null)}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 font-medium shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <p className="flex-1 text-sm font-bold text-slate-800 truncate">
            {selectedCollection.name}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="h-8 text-xs" onClick={openAddDialog}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Place
            </Button>
            <button
              onClick={() => openEditDialog(selectedCollection)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteMutation.mutate(selectedCollection.id)}
              disabled={deleteMutation.isPending}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-4 flex justify-center">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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

        {/* Add Place Dialog */}
        <Dialog
          open={showAdd}
          onOpenChange={(open) => {
            if (!open) {
              setShowAdd(false);
              setAddSelected(null);
              setAddSearch("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Place to Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <Select
                value={addType}
                onValueChange={(v) => {
                  setAddType(v);
                  setAddSelected(null);
                  setAddSearch("");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADD_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={addSearch}
                  onChange={(e) => {
                    setAddSearch(e.target.value);
                    setAddSelected(null);
                  }}
                  placeholder="Search by name..."
                  className="pl-9 h-9"
                />
              </div>

              <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {isAddLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : addItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No records found
                  </div>
                ) : (
                  addItems.map((rec) => {
                    const key = `${addType}-${rec.id}`;
                    const alreadyAdded = existingItemKeys.has(key);
                    return (
                      <button
                        key={rec.id}
                        onClick={() => !alreadyAdded && setAddSelected(rec)}
                        disabled={alreadyAdded}
                        className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          addSelected?.id === rec.id
                            ? "bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <span className="font-medium">{rec.name}</span>
                          {(rec.state ?? rec.states?.[0]) && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              {rec.state ?? rec.states?.[0]}
                            </span>
                          )}
                          {alreadyAdded && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (added)
                            </span>
                          )}
                        </div>
                        {addSelected?.id === rec.id && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={addItemMutation.isPending || !addSelected}
                className="flex-1"
              >
                {addItemMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add to Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      <BackNavigation title="Collection Tree" />

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">
                My Collections
              </h1>
              <p className="text-xs text-slate-500">
                Organise mosques, graves &amp; tahfiz centers
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Collection
          </Button>
        </div>

        {collectionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-white animate-pulse rounded-2xl border border-slate-100"
              />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Layers className="w-14 h-14 mb-4 opacity-20" />
            <p className="text-base font-medium">No collections yet</p>
            <p className="text-sm mt-1">
              Create a collection to start organising your places
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((col) => (
              <div
                key={col.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800 truncate">
                        {col.name}
                      </h3>
                      {col.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditDialog(col)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(col.id)}
                      disabled={deleteMutation.isPending}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCollection(col)}
                  className="w-full h-8 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  Open Tree
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setCreateName("");
            setCreateDesc("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Collection Name</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Mosques in Selangor"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description (optional)</Label>
              <Textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="What is this collection about?"
                className="resize-none h-20"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createName.trim()}
              className="flex-1"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEdit}
        onOpenChange={(open) => {
          if (!open) setShowEdit(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Collection Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                placeholder="e.g. Mosques in Selangor"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description (optional)</Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="What is this collection about?"
                className="resize-none h-20"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateMutation.isPending || !editName.trim()}
              className="flex-1"
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
