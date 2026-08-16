// @ts-nocheck
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Map,
  Plus,
  Trash2,
  X,
  UserPlus,
  UserMinus,
  Info,
  Upload,
  Pencil,
  Check,
  List,
  Grid3x3,
  CheckCircle2,
  XCircle,
  Percent,
  ChevronRight,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import GraveSlotMap from "@/components/GraveSlotMap";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import {
  useGetGravePaginated,
  useGraveMutations,
} from "@/mutations/useGraveMutations";
import { trpc } from "@/utils/trpc";
import {
  useGetGraveBlocks,
  useGraveBlockMutations,
} from "@/mutations/useGraveMappingMutations";
import {
  useGetDeadPersonPaginated,
  useDeadPersonMutations,
} from "@/mutations/useDeadPersonMutations";
import { resolveFileUrl, appendCurrentUserToFormData } from "@/utils";

function StatCard({ icon: Icon, iconClass, label, value }) {
  return (
    <Card className="border-0 shadow-md dark:bg-slate-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BlockSectionHeader({
  block,
  occupiedCount,
  totalCount,
  isRenaming,
  blockNameDraft,
  setBlockNameDraft,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
  renamePending,
  canCreate,
  canDelete,
}) {
  if (isRenaming) {
    return (
      <div className="flex items-center gap-2 px-1 pb-1.5">
        <Input
          value={blockNameDraft}
          onChange={(e) => setBlockNameDraft(e.target.value)}
          className="h-8"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={!blockNameDraft.trim() || renamePending}
          onClick={onSaveRename}
        >
          <Check className="w-4 h-4 text-emerald-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancelRename}>
          <X className="w-4 h-4 text-slate-400" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-1 pb-1.5">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {translate("Block")} {block.label}{" "}
        <span className="font-normal text-slate-400">
          ({occupiedCount}/{totalCount} {translate("occupied")})
        </span>
      </p>
      <div className="flex items-center">
        {canCreate && (
          <Button variant="ghost" size="sm" onClick={onStartRename}>
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        )}
        {canDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ManageGraveMapping() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } =
    useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canDelete,
  } = useCrudPermissions("dead_persons");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlGraveId = searchParams.get("graveId") || "";
  const [graveId, setGraveId] = useState(urlGraveId);

  useEffect(() => {
    setGraveId(urlGraveId);
  }, [urlGraveId]);

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id, isIdOnly: true },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin },
  );
  const accessibleOrgIds = parentAndChildQuery.data ?? [];

  const { gravesList } = useGetGravePaginated({
    pageSize: 500,
    organisationIds: isSuperAdmin ? undefined : accessibleOrgIds,
  });
  const grave = gravesList.items.find((g) => String(g.id) === String(graveId));
  const photoUrl = grave?.gravemappingphotourl
    ? resolveFileUrl(grave.gravemappingphotourl, "bucket-grave-mapping")
    : null;

  const { data: blocks = [], isLoading: blocksLoading } =
    useGetGraveBlocks(graveId);
  const { createBlock, deleteBlock, updateBlock, updateSlot } =
    useGraveBlockMutations();
  const { updateGrave } = useGraveMutations();
  const { updateDeadPerson } = useDeadPersonMutations();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleUploadMappingPhoto = async (file) => {
    if (!file || !grave) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);
      const res = await fetch("/api/upload/bucket-grave-mapping", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || translate("Failed to upload photo"));
        return;
      }
      const data = await res.json();
      await updateGrave.mutateAsync({
        id: grave.id,
        data: {
          name: grave.name,
          state: grave.state,
          status: grave.status,
          gravemappingphotourl: data.file_url,
        },
      });
      showSuccess(translate("Photo uploaded"));
    } catch (err) {
      console.error(err);
      showError(translate("Failed to upload photo"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // --- Draw-new-block state ---
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [blockLabel, setBlockLabel] = useState("");
  const [blockRows, setBlockRows] = useState(5);
  const [blockCols, setBlockCols] = useState(5);

  const startDrawing = () => {
    setDrawing(true);
    setDrawPoints([]);
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setDrawPoints([]);
  };

  const handleContainerClick = (xPercent, yPercent) => {
    if (!drawing || drawPoints.length >= 4) return;
    setDrawPoints((prev) => [...prev, { x: xPercent, y: yPercent }]);
  };

  const isDuplicateBlockLabel = (label, excludeBlockId = null) =>
    blocks.some(
      (b) =>
        b.id !== excludeBlockId &&
        b.label.trim().toLowerCase() === label.trim().toLowerCase(),
    );

  const handleCreateBlock = async () => {
    const label = blockLabel.trim();
    if (!label || drawPoints.length !== 4) return;
    if (isDuplicateBlockLabel(label)) {
      showError(
        `${translate("A block with this name already exists")}: "${label}"`,
      );
      return;
    }
    await createBlock.mutateAsync({
      graveId: Number(graveId),
      label,
      corners: drawPoints,
      rows: Number(blockRows) || 1,
      cols: Number(blockCols) || 1,
    });
    setDrawing(false);
    setDrawPoints([]);
    setBlockLabel("");
    setBlockRows(5);
    setBlockCols(5);
  };

  // --- Stats ---
  const allSlotsFlat = blocks.flatMap((b) => b.slots ?? []);
  const totalSlotsCount = allSlotsFlat.length;
  const occupiedSlotsCount = allSlotsFlat.filter((s) => s.deadperson).length;
  const availableSlotsCount = totalSlotsCount - occupiedSlotsCount;
  const usagePercent =
    totalSlotsCount > 0
      ? Math.round((occupiedSlotsCount / totalSlotsCount) * 100)
      : 0;

  // --- View mode for the blocks section below the map: grid (cards) or list (table) ---
  const [viewMode, setViewMode] = useState("grid");
  const [listBlockFilter, setListBlockFilter] = useState("all");
  const [listSearch, setListSearch] = useState("");

  const filteredBlocks = blocks
    .filter(
      (block) =>
        listBlockFilter === "all" || String(block.id) === listBlockFilter,
    )
    .map((block) => ({
      ...block,
      slots: (block.slots ?? [])
        .slice()
        .sort((a, b) => a.rowIndex - b.rowIndex || a.colIndex - b.colIndex)
        .filter((slot) => {
          if (!listSearch.trim()) return true;
          const needle = listSearch.trim().toLowerCase();
          return (
            slot.label.toLowerCase().includes(needle) ||
            slot.deadperson?.name?.toLowerCase().includes(needle)
          );
        }),
    }))
    .filter((block) => block.slots.length > 0 || !listSearch.trim());

  // --- Rename block ---
  const [renamingBlockId, setRenamingBlockId] = useState(null);
  const [blockNameDraft, setBlockNameDraft] = useState("");

  const startRenameBlock = (block) => {
    setBlockNameDraft(block.label);
    setRenamingBlockId(block.id);
  };

  const saveRenameBlock = async (block) => {
    const label = blockNameDraft.trim();
    if (!label) return;
    if (isDuplicateBlockLabel(label, block.id)) {
      showError(
        `${translate("A block with this name already exists")}: "${label}"`,
      );
      return;
    }
    await updateBlock.mutateAsync({
      id: block.id,
      data: { label, corners: block.corners },
    });
    setRenamingBlockId(null);
  };

  // --- Delete block ---
  const [blockToDelete, setBlockToDelete] = useState(null);

  const confirmDeleteBlock = async () => {
    if (!blockToDelete) return;
    await deleteBlock.mutateAsync(blockToDelete.id);
    setBlockToDelete(null);
  };

  // --- Slot dialog: click a slot -> pick from a list (if free) or view the
  // current occupant (if taken) -> confirm assign/unassign, all in one dialog ---
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState("search"); // "search" | "detail"
  const [detailPersonId, setDetailPersonId] = useState(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [renamingSlot, setRenamingSlot] = useState(false);
  const [slotNameDraft, setSlotNameDraft] = useState("");

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;
  const selectedSlot =
    selectedBlock?.slots?.find((s) => s.id === selectedSlotId) ?? null;

  const { deadPersonsList } = useGetDeadPersonPaginated({
    page: 1,
    pageSize: 20,
    filterName: assignSearch,
    filterGrave: Number(graveId) || undefined,
  });

  const { data: detailPersonData, isLoading: detailLoading } =
    trpc.deadperson.getDeadPersonById.useQuery(
      { id: detailPersonId },
      { enabled: !!detailPersonId },
    );

  const openSlotDialog = (slot, block) => {
    setSelectedSlotId(slot.id);
    setSelectedBlockId(block.id);
    setRenamingSlot(false);
    setAssignSearch("");
    if (slot.deadperson) {
      setDetailPersonId(slot.deadperson.id);
      setDialogStep("detail");
    } else {
      setDetailPersonId(null);
      setDialogStep("search");
    }
    setSlotDialogOpen(true);
  };

  const closeSlotDialog = () => {
    setSlotDialogOpen(false);
    setSelectedSlotId(null);
    setSelectedBlockId(null);
    setDialogStep("search");
    setDetailPersonId(null);
    setRenamingSlot(false);
  };

  const pickCandidate = (person) => {
    setDetailPersonId(person.id);
    setDialogStep("detail");
  };

  const backToSearch = () => {
    setDetailPersonId(null);
    setDialogStep("search");
  };

  const startRenameSlot = () => {
    setSlotNameDraft(selectedSlot?.label ?? "");
    setRenamingSlot(true);
  };

  const saveRenameSlot = async () => {
    if (!selectedSlot || !slotNameDraft.trim()) return;
    await updateSlot.mutateAsync({
      id: selectedSlot.id,
      label: slotNameDraft.trim(),
    });
    setRenamingSlot(false);
  };

  // deadperson.update requires the full record (its schema has several
  // required-but-nullable fields), so every change here must round-trip the
  // person's existing values rather than sending only the changed field.
  const buildDeadPersonUpdatePayload = (person) => ({
    name: person.name,
    icnumber: person.icnumber ?? null,
    dateofbirth: person.dateofbirth ?? null,
    dateofdeath: person.dateofdeath ?? null,
    causeofdeath: person.causeofdeath ?? null,
    biography: person.biography ?? null,
    photourl: person.photourl ?? null,
    latitude: person.latitude ?? null,
    longitude: person.longitude ?? null,
    heirname: person.heirname ?? null,
    heirphoneno: person.heirphoneno ?? null,
    grave: person.grave ? { id: person.grave.id } : undefined,
  });

  const confirmAssign = async () => {
    if (!detailPersonData || !selectedSlot) return;
    await updateDeadPerson.mutateAsync({
      id: detailPersonData.id,
      data: {
        ...buildDeadPersonUpdatePayload(detailPersonData),
        graveslot: { id: selectedSlot.id },
      },
    });
    closeSlotDialog();
  };

  const confirmUnassign = async () => {
    if (!detailPersonData) return;
    await updateDeadPerson.mutateAsync({
      id: detailPersonData.id,
      data: {
        ...buildDeadPersonUpdatePayload(detailPersonData),
        gravelot: null,
        graveslot: null,
      },
    });
    closeSlotDialog();
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Admin Dashboard"), page: "AdminDashboard" },
            {
              label: translate("Grave Slot Mapping"),
              page: "ManageGraveMapping",
            },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );
  }

  const isOccupiedContext = !!selectedSlot?.deadperson;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          {
            label: translate("Grave Slot Mapping"),
            page: "ManageGraveMapping",
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="w-6 h-6 text-emerald-600" />
          {translate("Grave Slot Mapping")}
        </h1>

        <div className="w-full sm:w-72 space-y-1">
          <Label className="text-xs text-slate-500">
            {translate("Cemetery")}
          </Label>
          <Select
            value={graveId || undefined}
            onValueChange={(v) => setSearchParams({ graveId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={translate("Select Cemetery")} />
            </SelectTrigger>
            <SelectContent>
              {gravesList.items.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!graveId ? (
        <Card className="border-0 shadow-md dark:bg-slate-800">
          <CardContent className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {translate("Please select a cemetery first.")}
          </CardContent>
        </Card>
      ) : !photoUrl ? (
        <Card className="border-0 shadow-md dark:bg-slate-800">
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <Info className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {translate("This cemetery has no aerial photo yet.")}
            </p>
            {canCreate && (
              <label htmlFor="grave-mapping-photo-upload">
                <Button asChild disabled={uploadingPhoto}>
                  <span>
                    <Upload className="w-4 h-4 mr-1.5" />
                    {uploadingPhoto
                      ? translate("Uploading...")
                      : translate("Upload Aerial Photo")}
                  </span>
                </Button>
                <input
                  id="grave-mapping-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) =>
                    handleUploadMappingPhoto(e.target.files?.[0])
                  }
                />
              </label>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Grid3x3}
              iconClass="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              label={translate("Total Slots")}
              value={totalSlotsCount}
            />
            <StatCard
              icon={CheckCircle2}
              iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              label={translate("Available")}
              value={availableSlotsCount}
            />
            <StatCard
              icon={XCircle}
              iconClass="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              label={translate("Occupied")}
              value={occupiedSlotsCount}
            />
            <StatCard
              icon={Percent}
              iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              label={translate("Usage Rate")}
              value={`${usagePercent}%`}
            />
          </div>

          <Card className="border-0 shadow-md dark:bg-slate-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500" />
                    {translate("Available")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-rose-500/40 border border-rose-500" />
                    {translate("Occupied")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canCreate && !drawing && (
                    <Button size="sm" onClick={startDrawing}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      {translate("Add Block")}
                    </Button>
                  )}
                  {drawing && (
                    <Button size="sm" variant="outline" onClick={cancelDrawing}>
                      <X className="w-4 h-4 mr-1.5" />
                      {translate("Cancel")}
                    </Button>
                  )}
                </div>
              </div>

              {drawing && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {drawPoints.length < 4
                    ? `${translate("Click the")} ${
                        [
                          "top-left",
                          "top-right",
                          "bottom-right",
                          "bottom-left",
                        ][drawPoints.length]
                      } ${translate("corner of the new block")} (${drawPoints.length}/4)`
                    : translate(
                        "All 4 corners set. Fill in the details below.",
                      )}
                </p>
              )}

              <GraveSlotMap
                blocks={blocks}
                photoUrl={photoUrl}
                onSlotClick={!drawing ? openSlotDialog : undefined}
                interactiveSlots={!drawing}
                selectedSlotId={selectedSlotId}
                onContainerClick={drawing ? handleContainerClick : undefined}
              >
                {drawing &&
                  drawPoints.map((p, idx) => (
                    <div
                      key={idx}
                      className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow"
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    >
                      {idx + 1}
                    </div>
                  ))}
              </GraveSlotMap>

              {drawing && drawPoints.length === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {translate("Block Label")}
                    </Label>
                    <Input
                      value={blockLabel}
                      onChange={(e) => setBlockLabel(e.target.value)}
                      placeholder="A"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{translate("Rows")}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={blockRows}
                      onChange={(e) => setBlockRows(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{translate("Columns")}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={blockCols}
                      onChange={(e) => setBlockCols(e.target.value)}
                    />
                  </div>
                  <Button
                    className="sm:col-span-3"
                    disabled={!blockLabel.trim() || createBlock.isPending}
                    onClick={handleCreateBlock}
                  >
                    {createBlock.isPending
                      ? translate("Saving...")
                      : translate("Create Block")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md dark:bg-slate-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {translate("Blocks")}
                </p>
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "grid"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                    {translate("Grid")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "list"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    {translate("List")}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={listBlockFilter}
                  onValueChange={setListBlockFilter}
                >
                  <SelectTrigger className="sm:w-48 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {translate("All Blocks")}
                    </SelectItem>
                    {blocks.map((block) => (
                      <SelectItem key={block.id} value={String(block.id)}>
                        {block.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder={translate("Search by lot number or name...")}
                />
              </div>

              {blocksLoading ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  {translate("Loading...")}
                </p>
              ) : filteredBlocks.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  {blocks.length === 0
                    ? translate("No blocks defined yet.")
                    : translate("No matching slots.")}
                </p>
              ) : (
                <div className="space-y-5 max-h-[32rem] overflow-y-auto">
                  {filteredBlocks.map((block) => {
                    const blockOccupied = (block.slots ?? []).filter(
                      (s) => s.deadperson,
                    ).length;
                    return (
                      <div key={block.id}>
                        <BlockSectionHeader
                          block={block}
                          occupiedCount={blockOccupied}
                          totalCount={block.slots.length}
                          isRenaming={renamingBlockId === block.id}
                          blockNameDraft={blockNameDraft}
                          setBlockNameDraft={setBlockNameDraft}
                          onStartRename={() => startRenameBlock(block)}
                          onSaveRename={() => saveRenameBlock(block)}
                          onCancelRename={() => setRenamingBlockId(null)}
                          onDelete={() => setBlockToDelete(block)}
                          renamePending={updateBlock.isPending}
                          canCreate={canCreate}
                          canDelete={canDelete}
                        />

                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {block.slots.map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => openSlotDialog(slot, block)}
                                className={`rounded-xl border-2 p-2.5 text-center transition-colors ${
                                  selectedSlotId === slot.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : slot.deadperson
                                      ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10"
                                      : "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
                                }`}
                              >
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  {slot.label}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {slot.deadperson
                                    ? slot.deadperson.name
                                    : translate("Available")}
                                </p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50 text-[11px] uppercase tracking-wider text-slate-400">
                                  <th className="text-left font-semibold px-3 py-2">
                                    {translate("Lot No.")}
                                  </th>
                                  <th className="text-center font-semibold px-3 py-2">
                                    {translate("Status")}
                                  </th>
                                  <th className="text-left font-semibold px-3 py-2">
                                    {translate("Deceased Name")}
                                  </th>
                                  <th className="text-right font-semibold px-3 py-2">
                                    {translate("Actions")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {block.slots.map((slot) => (
                                  <tr
                                    key={slot.id}
                                    onClick={() => openSlotDialog(slot, block)}
                                    className={`border-t border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 ${
                                      selectedSlotId === slot.id
                                        ? "bg-emerald-50/60 dark:bg-emerald-900/10"
                                        : ""
                                    }`}
                                  >
                                    <td className="px-3 py-2 font-medium">
                                      {slot.label}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {slot.deadperson ? (
                                        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
                                          {translate("Occupied")}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                          {translate("Available")}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                      {slot.deadperson?.name ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openSlotDialog(slot, block);
                                        }}
                                      >
                                        {translate("View")}
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={!!blockToDelete}
        onOpenChange={(v) => {
          if (!v) setBlockToDelete(null);
        }}
        title={translate("Delete Block")}
        description={`${translate("Delete")} "${blockToDelete?.label}"? ${translate("This will also delete all its slots.")}`}
        onConfirm={confirmDeleteBlock}
        confirmText={translate("Delete")}
        variant="destructive"
      />

      <Dialog
        open={slotDialogOpen}
        onOpenChange={(v) => {
          if (!v) closeSlotDialog();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {translate("Slot")}:{" "}
                <span className="font-semibold">{selectedSlot?.label}</span>
                <span className="text-slate-400 text-sm font-normal">
                  {" "}
                  ({selectedBlock?.label})
                </span>
              </span>
            </DialogTitle>
          </DialogHeader>

          {canCreate &&
            (renamingSlot ? (
              <div className="flex items-center gap-2">
                <Input
                  value={slotNameDraft}
                  onChange={(e) => setSlotNameDraft(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!slotNameDraft.trim() || updateSlot.isPending}
                  onClick={saveRenameSlot}
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRenamingSlot(false)}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="self-start -mt-1"
                onClick={startRenameSlot}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {translate("Rename Slot")}
              </Button>
            ))}

          {dialogStep === "search" ? (
            <div className="space-y-2">
              <Input
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder={translate("Search deceased by name...")}
              />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {deadPersonsList.items.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {translate("No matching deceased records.")}
                  </p>
                ) : (
                  deadPersonsList.items.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => pickCandidate(person)}
                      className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 active:bg-emerald-50 dark:active:bg-emerald-900/20 transition-colors flex items-center gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {person.name}
                        </p>
                        {person.icnumber && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {person.icnumber}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : detailLoading ? (
            <p className="text-sm text-slate-400">{translate("Loading...")}</p>
          ) : !detailPersonData ? (
            <p className="text-sm text-slate-400">
              {translate("Deceased record not found.")}
            </p>
          ) : (
            <div className="space-y-3">
              {detailPersonData.photourl && (
                <img
                  src={resolveFileUrl(
                    detailPersonData.photourl,
                    "bucket-dead-person",
                  )}
                  alt={detailPersonData.name}
                  className="w-20 h-20 rounded-xl object-cover mx-auto"
                />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {translate("Name")}
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {detailPersonData.name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {translate("IC No.")}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {detailPersonData.icnumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {translate("Date of Death")}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {detailPersonData.dateofdeath
                      ? new Date(
                          detailPersonData.dateofdeath,
                        ).toLocaleDateString("ms-MY")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {translate("Date of Birth")}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {detailPersonData.dateofbirth
                      ? new Date(
                          detailPersonData.dateofbirth,
                        ).toLocaleDateString("ms-MY")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {translate("Cause of Death")}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {detailPersonData.causeofdeath || "—"}
                  </p>
                </div>
                {detailPersonData.grave && (
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {translate("Current Grave Lot")}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      {detailPersonData.grave.name}
                      {detailPersonData.gravelot
                        ? ` — ${detailPersonData.gravelot}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2">
            {dialogStep === "detail" && !isOccupiedContext && (
              <>
                <Button
                  className="w-full"
                  onClick={confirmAssign}
                  disabled={!detailPersonData || updateDeadPerson.isPending}
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {updateDeadPerson.isPending
                    ? translate("Saving...")
                    : translate("Set to This Slot")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={backToSearch}
                >
                  {translate("Back")}
                </Button>
              </>
            )}
            {dialogStep === "detail" && isOccupiedContext && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={confirmUnassign}
                disabled={updateDeadPerson.isPending}
              >
                <UserMinus className="w-4 h-4 mr-1.5" />
                {updateDeadPerson.isPending
                  ? translate("Saving...")
                  : translate("Unset from This Slot")}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={closeSlotDialog}
            >
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
