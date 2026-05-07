import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  List,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import RichTextEditorForm from "@/components/forms/RichTextEditorForm";
import { translate } from "@/utils/translations";
import { resolveFileUrl } from "@/utils";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import {
  useGetActivityPostsPaginated,
  useActivityPostMutations,
} from "@/hooks/useActivityPostMutations";
import { useGetMosquesByOrganisationId } from "@/hooks/useMosqueMutations";
import { defaultActivityPost } from "@/utils/defaultformfields";

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, canEdit, canDelete, onEdit, onDelete }) {
  const publisher = post.mosque?.name ?? post.tahfiz?.name ?? "";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {post.photourl && (
        <img
          src={resolveFileUrl(post.photourl, "activity-post")}
          alt={post.title}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 text-sm leading-tight flex-1 min-w-0">
            {post.title}
          </p>
          <Badge
            className={`shrink-0 border-0 text-xs ${
              post.ispublished
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {post.ispublished ? translate("Published") : translate("Draft")}
          </Badge>
        </div>

        {publisher && (
          <p className="text-xs text-slate-400 truncate">{publisher}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <button
              onClick={() => onEdit(post)}
              className="flex items-center gap-1.5 text-xs text-sky-600 border border-sky-200 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(post)}
              className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {translate("Delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Form sheet ───────────────────────────────────────────────────────────────

function PostFormSheet({
  editing,
  onClose,
  onSubmit,
  isSubmitting,
  uploading,
  handleFileUpload,
  isOrganisationAdmin,
  mosqueOptions,
  isMosquesLoading,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          ...editing,
          tahfiz: editing?.tahfiz?.id ?? null,
          mosque: editing?.mosque?.id ?? null,
        }
      : defaultActivityPost,
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        <h2 className="font-semibold text-slate-800 text-sm">
          {editing?.id
            ? translate("Edit Activity Post")
            : translate("Add Activity Post")}
        </h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {isOrganisationAdmin && (
          <SelectForm
            name="mosque"
            control={control}
            label={translate("Mosque")}
            placeholder={translate("Select Mosque")}
            options={mosqueOptions}
            required
            errors={errors}
            disabled={isMosquesLoading || mosqueOptions.length === 0}
          />
        )}
        <TextInputForm
          name="title"
          control={control}
          label={translate("Title")}
          required
          errors={errors}
        />
        <RichTextEditorForm
          name="content"
          control={control}
          label={translate("Content")}
          required
          errors={errors}
          translate={translate}
        />
        <CheckboxForm
          name="ispublished"
          control={control}
          label={translate("Published")}
        />
        <FileUploadForm
          name="photourl"
          control={control}
          label={translate("Photo")}
          bucketName="activity-post"
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          translate={translate}
        />
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || uploading}
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MobileManageActivityPosts() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isTahfizAdmin,
    isOrganisationAdmin,
  } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("posts");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedTitle, setAppliedTitle] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const { activityPostsList, totalPages, isLoading } =
    useGetActivityPostsPaginated({
      page,
      pageSize: itemsPerPage,
      filterTitle: appliedTitle || undefined,
    });

  const { data: organisationMosques = [], isLoading: isMosquesLoading } =
    useGetMosquesByOrganisationId(
      isOrganisationAdmin ? (currentUser?.organisation?.id ?? null) : null,
    );

  const { createPost, updatePost, deletePost } = useActivityPostMutations();

  useEffect(() => {
    const open = formOpen || deleteDialogOpen;
    document.body.style.overflow = open ? "hidden" : "";
    document.body.style.touchAction = open ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [formOpen, deleteDialogOpen]);

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/upload/${bucketName}`, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showError(d.error || translate("Failed to upload photo"));
        return null;
      }
      const data = await res.json();
      showSuccess(translate("Photo uploaded"));
      return data.file_url;
    } catch {
      showError(translate("Failed to upload photo"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingPost(null);
    setFormOpen(true);
  };

  const openEdit = (post) => {
    setEditingPost(post);
    setFormOpen(true);
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    let tahfizCenterId = null;
    let mosqueId = null;

    if (isTahfizAdmin && currentUser?.tahfizcenter) {
      tahfizCenterId = currentUser.tahfizcenter.id;
    }

    if (isOrganisationAdmin) {
      mosqueId = formData?.mosque ? Number(formData.mosque) : null;
    } else if (formData?.mosque) {
      mosqueId =
        typeof formData.mosque === "object"
          ? Number(formData.mosque.id)
          : Number(formData.mosque);
    }

    const submitData = {
      ...formData,
      tahfiz: tahfizCenterId ? { id: Number(tahfizCenterId) } : null,
      mosque: mosqueId ? { id: mosqueId } : null,
    };

    try {
      if (editingPost?.id) {
        await updatePost.mutateAsync({ id: Number(editingPost.id), data: submitData });
      } else {
        await createPost.mutateAsync(submitData);
      }
      setFormOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!postToDelete?.id) return;
    try {
      await deletePost.mutateAsync(Number(postToDelete.id));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };

  const mosqueOptions = organisationMosques.map((m) => ({ value: m.id, label: m.name }));

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6">
        <BackNavigation title={translate("Manage Activity Posts")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Filter + Add */}
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                { label: translate("Title"), type: "text", searchColumn: "title" },
              ]}
              onApplyFilter={(f) => { setAppliedTitle(f.title || ""); setPage(1); }}
            />
            {canCreate && (
              <button
                onClick={openAdd}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Card list */}
          {isLoading ? (
            <InlineLoadingComponent />
          ) : activityPostsList.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <List className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityPostsList.items.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onDelete={(p) => { setPostToDelete(p); setDeleteDialogOpen(true); }}
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
                totalItems={activityPostsList.total}
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <PostFormSheet
          editing={editingPost}
          onClose={() => setFormOpen(false)}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          isOrganisationAdmin={isOrganisationAdmin}
          mosqueOptions={mosqueOptions}
          isMosquesLoading={isMosquesLoading}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Activity Post")}
        description={`${translate("Delete")} "${postToDelete?.title}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </>
  );
}
